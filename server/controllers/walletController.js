import WalletService from '../services/walletService.js';
import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';

// @desc    Get user wallet details
// @route   GET /api/wallet
export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const walletDetails = await WalletService.getWalletDetails(userId, page, limit);

    res.json({
      success: true,
      data: walletDetails
    });
  } catch (error) {
    console.error('Get wallet details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet details',
      error: error.message
    });
  }
};

// @desc    Get wallet transaction history
// @route   GET /api/wallet/transactions
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const source = req.query.source; // Filter by transaction source
    const type = req.query.type; // Filter by transaction type

    let query = { userId };
    
    if (source) {
      query.source = source;
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('referenceId', 'title name')
      .lean();

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
};

// @desc    Request withdrawal (admin approval required)
// @route   POST /api/wallet/withdraw
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      return res.status(400).json({
        success: false,
        message: 'Bank details are required for withdrawal'
      });
    }

    // Check if user has sufficient balance
    const user = await User.findById(userId).select('wallet');
    if (!user.wallet || user.wallet.pendingEarnings < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal'
      });
    }

    // Create withdrawal request (pending admin approval)
    const withdrawalRequest = new WalletTransaction({
      userId,
      type: 'debit',
      source: 'withdrawal',
      amount,
      referenceId: userId,
      referenceType: 'User',
      description: `Withdrawal request for ₹${amount}`,
      balanceAfter: user.wallet.balance, // Balance unchanged until approved
      metadata: {
        status: 'pending',
        bankDetails,
        requestedAt: new Date()
      }
    });

    await withdrawalRequest.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed by admin.',
      data: {
        requestId: withdrawalRequest._id,
        amount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request withdrawal',
      error: error.message
    });
  }
};

// @desc    Get platform wallet summary (admin only)
// @route   GET /api/wallet/platform-summary
export const getPlatformWalletSummary = async (req, res) => {
  try {
    const summary = await WalletService.getPlatformWalletSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get platform wallet summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform wallet summary',
      error: error.message
    });
  }
};

// @desc    Get all withdrawal requests (admin only)
// @route   GET /api/wallet/withdrawal-requests
export const getWithdrawalRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || 'pending';

    const skip = (page - 1) * limit;

    const requests = await WalletTransaction.find({
      source: 'withdrawal',
      'metadata.status': status
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email phone')
      .lean();

    const total = await WalletTransaction.countDocuments({
      source: 'withdrawal',
      'metadata.status': status
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal requests',
      error: error.message
    });
  }
};

// @desc    Process withdrawal request (admin only)
// @route   PUT /api/wallet/withdrawal-requests/:id
export const processWithdrawalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'

    console.log(`🔄 Processing withdrawal request: ${id}, Action: ${action}`);

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes are required'
      });
    }

    const withdrawalRequest = await WalletTransaction.findById(id);
    if (!withdrawalRequest || withdrawalRequest.source !== 'withdrawal') {
      console.log(`❌ Withdrawal request not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.metadata.status !== 'pending') {
      console.log(`❌ Withdrawal request already processed: ${id}, Status: ${withdrawalRequest.metadata.status}`);
      return res.status(400).json({
        success: false,
        message: `Withdrawal request has already been ${withdrawalRequest.metadata.status}`
      });
    }

    // Get current user wallet status
    const user = await User.findById(withdrawalRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (action === 'approve') {
      console.log(`✅ Approving withdrawal: User ${withdrawalRequest.userId}, Amount: ₹${withdrawalRequest.amount}`);
      
      // Check if user has sufficient pending earnings
      const pendingEarnings = user.wallet?.pendingEarnings || 0;
      if (pendingEarnings < withdrawalRequest.amount) {
        console.log(`❌ Insufficient pending earnings: Available ₹${pendingEarnings}, Required ₹${withdrawalRequest.amount}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient pending earnings. Available: ₹${pendingEarnings.toFixed(2)}, Required: ₹${withdrawalRequest.amount.toFixed(2)}`
        });
      }
      
      try {
        // Process the withdrawal
        const result = await WalletService.debitWallet(
          withdrawalRequest.userId,
          withdrawalRequest.amount,
          'withdrawal',
          withdrawalRequest._id,
          'WalletTransaction',
          `Withdrawal approved: ₹${withdrawalRequest.amount}`,
          {
            status: 'approved',
            approvedBy: req.user._id,
            approvedAt: new Date(),
            adminNotes,
            bankDetails: withdrawalRequest.metadata.bankDetails
          }
        );
        console.log(`✅ Debit wallet result:`, result);
      } catch (debitError) {
        console.error('❌ Debit wallet error:', debitError);
        return res.status(400).json({
          success: false,
          message: debitError.message
        });
      }

      // Update the original request
      withdrawalRequest.metadata.status = 'approved';
      withdrawalRequest.metadata.approvedBy = req.user._id;
      withdrawalRequest.metadata.approvedAt = new Date();
      withdrawalRequest.metadata.adminNotes = adminNotes;
    } else {
      console.log(`❌ Rejecting withdrawal: User ${withdrawalRequest.userId}, Amount: ₹${withdrawalRequest.amount}`);
      
      // Reject the withdrawal
      withdrawalRequest.metadata.status = 'rejected';
      withdrawalRequest.metadata.rejectedBy = req.user._id;
      withdrawalRequest.metadata.rejectedAt = new Date();
      withdrawalRequest.metadata.adminNotes = adminNotes;
    }

    await withdrawalRequest.save();

    console.log(`✅ Withdrawal request ${action}d successfully: ${id}`);

    res.json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      data: {
        requestId: withdrawalRequest._id,
        status: withdrawalRequest.metadata.status,
        amount: withdrawalRequest.amount,
        user: {
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Process withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request',
      error: error.message
    });
  }
};

// @desc    Get user earnings summary
// @route   GET /api/wallet/earnings
export const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('wallet');
    if (!user.wallet) {
      await WalletService.initializeWallet(userId);
      return res.json({
        success: true,
        data: {
          totalEarnings: 0,
          pendingEarnings: 0,
          withdrawnAmount: 0,
          balance: 0
        }
      });
    }

    // Get earnings breakdown by source
    const earningsBreakdown = await WalletTransaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'credit'
        }
      },
      {
        $group: {
          _id: '$source',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEarnings: user.wallet.totalEarnings || 0,
        pendingEarnings: user.wallet.pendingEarnings || 0,
        withdrawnAmount: user.wallet.withdrawnAmount || 0,
        balance: user.wallet.balance || 0,
        earningsBreakdown
      }
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings summary',
      error: error.message
    });
  }
};

// @desc    Get all transactions (admin only)
// @route   GET /api/admin/wallet/all-transactions
export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const type = req.query.type || 'all';
    const source = req.query.source || 'all';
    const dateRange = req.query.dateRange || '30d';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (search) {
      // Search in user names and emails
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.userId = { $in: users.map(u => u._id) };
    }

    if (type !== 'all') {
      query.type = type;
    }

    if (source !== 'all') {
      query.source = source;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email phone avatar')
      .populate('referenceId', 'title name')
      .lean();

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
};

// @desc    Get user wallets (admin only)
// @route   GET /api/admin/wallet/user-wallets
export const getUserWallets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Only get users who have wallet data
    query['wallet.totalEarnings'] = { $gt: 0 };

    const users = await User.find(query)
      .sort({ 'wallet.totalEarnings': -1 })
      .skip(skip)
      .limit(limit)
      .select('name email phone avatar wallet createdAt')
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user wallets',
      error: error.message
    });
  }
};

// @desc    Adjust user wallet balance (admin only)
// @route   POST /api/admin/wallet/adjust-balance
export const adjustUserBalance = async (req, res) => {
  try {
    const { userId, amount, reason, type } = req.body;

    if (!userId || !amount || !reason || !type) {
      return res.status(400).json({
        success: false,
        message: 'User ID, amount, reason, and type are required'
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be credit or debit'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      await WalletService.initializeWallet(userId);
    }

    let result;
    if (type === 'credit') {
      result = await WalletService.creditWallet(
        userId,
        Math.abs(amount),
        'admin_adjustment',
        req.user._id,
        'User',
        `Admin adjustment: ${reason}`,
        {
          adjustedBy: req.user._id,
          adjustedAt: new Date(),
          reason
        }
      );
    } else {
      // Check if user has sufficient balance for debit
      if (user.wallet.balance < Math.abs(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for debit adjustment'
        });
      }

      result = await WalletService.debitWallet(
        userId,
        Math.abs(amount),
        'admin_adjustment',
        req.user._id,
        'User',
        `Admin adjustment: ${reason}`,
        {
          adjustedBy: req.user._id,
          adjustedAt: new Date(),
          reason
        }
      );
    }

    res.json({
      success: true,
      message: `Wallet ${type}ed successfully`,
      data: {
        transactionId: result.transaction._id,
        newBalance: result.newBalance,
        amount: Math.abs(amount),
        type
      }
    });
  } catch (error) {
    console.error('Adjust user balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust user balance',
      error: error.message
    });
  }
};

// @desc    Get wallet analytics (admin only)
// @route   GET /api/admin/wallet/analytics
export const getWalletAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transaction analytics
    const [
      transactionsByDay,
      transactionsBySource,
      topEarners,
      recentWithdrawals
    ] = await Promise.all([
      // Transactions by day
      WalletTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: "$type"
            },
            count: { $sum: 1 },
            amount: { $sum: "$amount" }
          }
        },
        {
          $sort: { "_id.date": 1 }
        }
      ]),

      // Transactions by source
      WalletTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$source",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        }
      ]),

      // Top earners
      User.find({
        'wallet.totalEarnings': { $gt: 0 }
      })
        .sort({ 'wallet.totalEarnings': -1 })
        .limit(10)
        .select('name email wallet.totalEarnings wallet.balance')
        .lean(),

      // Recent withdrawals
      WalletTransaction.find({
        source: 'withdrawal',
        createdAt: { $gte: startDate }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        transactionsByDay,
        transactionsBySource,
        topEarners,
        recentWithdrawals
      }
    });
  } catch (error) {
    console.error('Get wallet analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet analytics',
      error: error.message
    });
  }
};