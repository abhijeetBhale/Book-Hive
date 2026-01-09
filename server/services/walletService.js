import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import mongoose from 'mongoose';

class WalletService {
  // Get configurable commission rate (default 20%)
  static getCommissionRate() {
    return parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.2;
  }

  // Initialize wallet for user if it doesn't exist
  static async initializeWallet(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        withdrawnAmount: 0,
        transactions: []
      };
      await user.save();
    }

    return user.wallet;
  }

  // Credit wallet with transaction recording
  static async creditWallet(userId, amount, source, referenceId, referenceType, description, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get user and initialize wallet if needed
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          withdrawnAmount: 0,
          transactions: []
        };
      }

      // Update wallet balance
      const previousBalance = user.wallet.balance || 0;
      user.wallet.balance = previousBalance + amount;
      user.wallet.totalEarnings = (user.wallet.totalEarnings || 0) + amount;
      user.wallet.pendingEarnings = (user.wallet.pendingEarnings || 0) + amount;

      await user.save({ session });

      // Create wallet transaction record
      const transaction = new WalletTransaction({
        userId,
        type: 'credit',
        source,
        amount,
        referenceId,
        referenceType,
        description,
        balanceAfter: user.wallet.balance,
        metadata
      });

      await transaction.save({ session });

      // Add transaction reference to user's wallet
      user.wallet.transactions.push(transaction._id);
      await user.save({ session });

      await session.commitTransaction();

      console.log(`✅ Wallet credited: User ${userId}, Amount: ₹${amount}, New Balance: ₹${user.wallet.balance}`);

      return {
        transaction,
        newBalance: user.wallet.balance,
        totalEarnings: user.wallet.totalEarnings
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Wallet credit failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Debit wallet with transaction recording
  static async debitWallet(userId, amount, source, referenceId, referenceType, description, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize wallet if it doesn't exist
      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          withdrawnAmount: 0,
          transactions: []
        };
      }

      // For withdrawals, check pendingEarnings instead of balance
      if (source === 'withdrawal') {
        if (user.wallet.pendingEarnings < amount) {
          throw new Error(`Insufficient pending earnings for withdrawal. Available: ₹${user.wallet.pendingEarnings}, Requested: ₹${amount}`);
        }
        
        // Update wallet for withdrawal
        user.wallet.pendingEarnings = Math.max(0, user.wallet.pendingEarnings - amount);
        user.wallet.withdrawnAmount = (user.wallet.withdrawnAmount || 0) + amount;
        // Don't change balance for withdrawals as it represents available funds
      } else {
        // For other transactions, check balance
        if (user.wallet.balance < amount) {
          throw new Error(`Insufficient wallet balance. Available: ₹${user.wallet.balance}, Requested: ₹${amount}`);
        }
        
        // Update wallet balance for non-withdrawal debits
        user.wallet.balance = user.wallet.balance - amount;
      }

      await user.save({ session });

      // Create wallet transaction record
      const transaction = new WalletTransaction({
        userId,
        type: 'debit',
        source,
        amount,
        referenceId,
        referenceType,
        description,
        balanceAfter: user.wallet.balance, // Always show current balance
        metadata
      });

      await transaction.save({ session });

      // Add transaction reference to user's wallet
      user.wallet.transactions.push(transaction._id);
      await user.save({ session });

      await session.commitTransaction();

      console.log(`✅ Wallet debited: User ${userId}, Amount: ₹${amount}, Source: ${source}`);
      console.log(`   Balance: ₹${user.wallet.balance}, Pending: ₹${user.wallet.pendingEarnings}, Withdrawn: ₹${user.wallet.withdrawnAmount}`);

      return {
        transaction,
        newBalance: user.wallet.balance,
        pendingEarnings: user.wallet.pendingEarnings,
        withdrawnAmount: user.wallet.withdrawnAmount
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Wallet debit failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get wallet balance and transaction history
  static async getWalletDetails(userId, page = 1, limit = 20) {
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      await this.initializeWallet(userId);
      return {
        balance: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        withdrawnAmount: 0,
        transactions: [],
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }

    // Get paginated transactions
    const skip = (page - 1) * limit;
    const transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('referenceId', 'title name')
      .lean();

    const totalTransactions = await WalletTransaction.countDocuments({ userId });

    return {
      balance: user.wallet.balance || 0,
      totalEarnings: user.wallet.totalEarnings || 0,
      pendingEarnings: user.wallet.pendingEarnings || 0,
      withdrawnAmount: user.wallet.withdrawnAmount || 0,
      transactions,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limit)
      }
    };
  }

  // Get platform wallet summary (admin only)
  static async getPlatformWalletSummary() {
    const platformCommissions = await WalletTransaction.aggregate([
      {
        $match: {
          source: 'platform_commission',
          type: 'credit'
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const totalWithdrawals = await WalletTransaction.aggregate([
      {
        $match: {
          source: 'withdrawal',
          type: 'debit'
        }
      },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: '$amount' },
          withdrawalCount: { $sum: 1 }
        }
      }
    ]);

    const totalLenderEarnings = await WalletTransaction.aggregate([
      {
        $match: {
          source: 'lending_fee',
          type: 'credit'
        }
      },
      {
        $group: {
          _id: null,
          totalLenderEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    return {
      platformCommission: platformCommissions[0]?.totalCommission || 0,
      platformTransactions: platformCommissions[0]?.transactionCount || 0,
      totalWithdrawals: totalWithdrawals[0]?.totalWithdrawals || 0,
      withdrawalCount: totalWithdrawals[0]?.withdrawalCount || 0,
      lenderEarnings: totalLenderEarnings[0]?.totalLenderEarnings || 0,
      lenderTransactions: totalLenderEarnings[0]?.transactionCount || 0,
      commissionRate: this.getCommissionRate()
    };
  }

  // Process lending fee payment (splits commission)
  static async processLendingFeePayment(borrowRequestId, lenderId, totalFee, paymentId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const commissionRate = this.getCommissionRate();
      const platformFee = Math.round(totalFee * commissionRate * 100) / 100;
      const lenderEarnings = Math.round((totalFee - platformFee) * 100) / 100;

      console.log('💰 Processing lending fee payment:', {
        borrowRequestId,
        lenderId,
        totalFee,
        platformFee,
        lenderEarnings,
        commissionRate
      });

      // Credit lender wallet
      await this.creditWallet(
        lenderId,
        lenderEarnings,
        'lending_fee',
        borrowRequestId,
        'BorrowRequest',
        `Earned ₹${lenderEarnings} from lending fee (Platform fee: ₹${platformFee})`,
        {
          paymentId,
          totalFee,
          platformFee,
          commissionRate
        }
      );

      // Create platform commission record (virtual admin user or system account)
      const platformTransaction = new WalletTransaction({
        userId: new mongoose.Types.ObjectId('000000000000000000000000'), // System/Platform user ID
        type: 'credit',
        source: 'platform_commission',
        amount: platformFee,
        referenceId: borrowRequestId,
        referenceType: 'BorrowRequest',
        description: `Platform commission (${(commissionRate * 100).toFixed(1)}%) from lending fee`,
        balanceAfter: 0, // Platform balance is calculated dynamically
        metadata: {
          paymentId,
          totalFee,
          lenderEarnings,
          commissionRate,
          lenderId
        }
      });

      await platformTransaction.save({ session });

      await session.commitTransaction();

      console.log('✅ Lending fee payment processed successfully');

      return {
        lenderEarnings,
        platformFee,
        commissionRate,
        lenderTransaction: await WalletTransaction.findOne({ 
          referenceId: borrowRequestId, 
          userId: lenderId, 
          source: 'lending_fee' 
        }),
        platformTransaction
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Lending fee payment processing failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Admin adjustment method
  static async processAdminAdjustment(userId, amount, type, adminId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`💼 Processing admin adjustment: ${type} ₹${amount} for user ${userId}`);

      if (type === 'credit') {
        const result = await this.creditWallet(
          userId,
          amount,
          'admin_adjustment',
          adminId,
          'User',
          `Admin adjustment: ${reason}`,
          {
            adjustedBy: adminId,
            adjustedAt: new Date(),
            reason,
            type: 'credit'
          }
        );

        await session.commitTransaction();
        return result;
      } else if (type === 'debit') {
        const result = await this.debitWallet(
          userId,
          amount,
          'admin_adjustment',
          adminId,
          'User',
          `Admin adjustment: ${reason}`,
          {
            adjustedBy: adminId,
            adjustedAt: new Date(),
            reason,
            type: 'debit'
          }
        );

        await session.commitTransaction();
        return result;
      } else {
        throw new Error('Invalid adjustment type. Must be credit or debit');
      }
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Admin adjustment failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default WalletService;