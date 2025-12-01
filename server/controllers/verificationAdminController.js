import VerificationApplication from '../models/VerificationApplication.js';
import User from '../models/User.js';

/**
 * @desc    Get all verification applications
 * @route   GET /api/admin/verification/applications
 * @access  Private (Admin)
 */
export const getVerificationApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const applications = await VerificationApplication.find(query)
      .populate('user', 'name email avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VerificationApplication.countDocuments(query);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get verification applications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch applications',
      error: error.message 
    });
  }
};

/**
 * @desc    Approve verification application
 * @route   PUT /api/admin/verification/applications/:id/approve
 * @access  Private (Admin)
 */
export const approveVerificationApplication = async (req, res) => {
  try {
    const application = await VerificationApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Application has already been reviewed' 
      });
    }

    // Update application
    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Update user to add verification badge and premium features
    const user = await User.findById(application.user);
    user.isVerified = true;
    user.verificationPurchaseDate = new Date();
    // Enable all premium features
    user.premiumFeatures.searchBoost = true;
    user.premiumFeatures.priorityQueue = true;
    user.premiumFeatures.multipleBooks = true;
    user.premiumFeatures.maxBooksLimit = 3;
    user.premiumFeatures.earlyAccess = true;
    await user.save();

    // Create notification for the user
    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        user: user._id,
        type: 'verification_approved',
        title: 'Verification Badge Approved! 🎉',
        message: 'Congratulations! Your verification application has been approved. You now have a verified badge on your profile.',
        read: false,
        data: {
          applicationId: application._id
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: application
    });
  } catch (error) {
    console.error('Approve verification application error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve application',
      error: error.message 
    });
  }
};

/**
 * @desc    Reject verification application
 * @route   PUT /api/admin/verification/applications/:id/reject
 * @access  Private (Admin)
 */
export const rejectVerificationApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false,
        message: 'Rejection reason is required' 
      });
    }

    const application = await VerificationApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Application has already been reviewed' 
      });
    }

    application.status = 'rejected';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.rejectionReason = reason;
    await application.save();

    // Create notification for the user
    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        user: application.user,
        type: 'verification_rejected',
        title: 'Verification Application Update',
        message: `Your verification application has been reviewed. Reason: ${reason}`,
        read: false,
        data: {
          applicationId: application._id,
          reason
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Application rejected',
      data: application
    });
  } catch (error) {
    console.error('Reject verification application error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject application',
      error: error.message 
    });
  }
};

export default {
  getVerificationApplications,
  approveVerificationApplication,
  rejectVerificationApplication
};
