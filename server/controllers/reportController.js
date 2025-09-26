import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Create a new user report
// @route   POST /api/reports
export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const reporterId = req.user.id;

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'User to report not found' });
    }

    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // Check if this user has already reported the same user
    const existingReport = await Report.findOne({
      reporterId,
      reportedUserId,
      status: { $in: ['pending', 'reviewed'] }
    });

    if (existingReport) {
      return res.status(400).json({ 
        message: 'You have already reported this user. Your report is being reviewed.' 
      });
    }

    const newReport = new Report({
      reporterId,
      reportedUserId,
      reason,
      description
    });

    await newReport.save();

    res.status(201).json({ 
      message: 'Report submitted successfully. Our team will review it shortly.'
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error creating report' });
  }
};

// @desc    Get reports made by the current user
// @route   GET /api/reports/my-reports
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .populate('reportedUserId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Server error getting reports' });
  }
};