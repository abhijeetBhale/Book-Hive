import OrganizerApplication from '../models/OrganizerApplication.js';
import User from '../models/User.js';

/**
 * @desc    Get all organizer applications
 * @route   GET /api/admin/organizer/applications
 * @access  Private (Admin)
 */
export const getOrganizerApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by organization name or email
    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { organizationType: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const applications = await OrganizerApplication.find(query)
      .populate('user', 'name email avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OrganizerApplication.countDocuments(query);

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
    console.error('Get organizer applications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch applications',
      error: error.message 
    });
  }
};

/**
 * @desc    Approve organizer application
 * @route   PUT /api/admin/organizer/applications/:id/approve
 * @access  Private (Admin)
 */
export const approveOrganizerApplication = async (req, res) => {
  try {
    const application = await OrganizerApplication.findById(req.params.id);

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

    // Update user to add organizer capabilities (keep role as 'user')
    const user = await User.findById(application.user);
    user.isOrganizer = true; // Add organizer flag instead of changing role
    user.verified = true;
    user.organizerProfile = {
      organizationName: application.organizationName,
      organizationType: application.organizationType,
      contactEmail: application.contactEmail,
      contactPhone: application.contactPhone,
      website: application.website,
      description: application.description,
      verificationDocuments: application.verificationDocuments.map(doc => doc.url),
      approvedAt: new Date(),
      approvedBy: req.user._id
    };
    await user.save();

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: application
    });
  } catch (error) {
    console.error('Approve organizer application error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve application',
      error: error.message 
    });
  }
};

/**
 * @desc    Reject organizer application
 * @route   PUT /api/admin/organizer/applications/:id/reject
 * @access  Private (Admin)
 */
export const rejectOrganizerApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false,
        message: 'Rejection reason is required' 
      });
    }

    const application = await OrganizerApplication.findById(req.params.id);

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

    res.json({
      success: true,
      message: 'Application rejected',
      data: application
    });
  } catch (error) {
    console.error('Reject organizer application error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject application',
      error: error.message 
    });
  }
};

export default {
  getOrganizerApplications,
  approveOrganizerApplication,
  rejectOrganizerApplication
};
