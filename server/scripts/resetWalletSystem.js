import mongoose from 'mongoose';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Lending from '../models/Lending.js';
import 'dotenv/config';

async function resetWalletSystem() {
  try {
    console.log('🧹 Resetting wallet system - removing all transactions...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Delete all wallet transactions
    const deletedTransactions = await WalletTransaction.deleteMany({});
    console.log(`🗑️  Deleted ${deletedTransactions.deletedCount} wallet transactions`);

    // Step 2: Delete all lending records
    const deletedLendings = await Lending.deleteMany({});
    console.log(`🗑️  Deleted ${deletedLendings.deletedCount} lending records`);

    // Step 3: Reset all user wallets to zero
    const users = await User.find({});
    let resetCount = 0;

    for (const user of users) {
      if (user.wallet) {
        user.wallet = {
          balance: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          withdrawnAmount: 0,
          transactions: []
        };
        await user.save();
        resetCount++;
      }
    }

    console.log(`👤 Reset wallets for ${resetCount} users`);

    // Step 4: Reset borrow request payment statuses
    const borrowRequests = await BorrowRequest.find({
      $or: [
        { lendingFeeStatus: 'paid' },
        { lendingFeePaymentId: { $exists: true } }
      ]
    });

    let resetBorrowRequests = 0;
    for (const req of borrowRequests) {
      req.lendingFeeStatus = 'pending';
      req.lendingFeePaymentId = undefined;
      req.paymentCompletedAt = undefined;
      req.platformFee = undefined;
      req.ownerEarnings = undefined;
      await req.save();
      resetBorrowRequests++;
    }

    console.log(`📚 Reset payment status for ${resetBorrowRequests} borrow requests`);

    // Step 5: Show summary
    console.log('\n📊 Reset Summary:');
    console.log(`   Wallet Transactions: ${deletedTransactions.deletedCount} deleted`);
    console.log(`   Lending Records: ${deletedLendings.deletedCount} deleted`);
    console.log(`   User Wallets: ${resetCount} reset to ₹0`);
    console.log(`   Borrow Requests: ${resetBorrowRequests} payment status reset`);

    // Step 6: Verify reset
    const remainingTransactions = await WalletTransaction.countDocuments();
    const remainingLendings = await Lending.countDocuments();
    
    console.log('\n✅ Verification:');
    console.log(`   Remaining Transactions: ${remainingTransactions}`);
    console.log(`   Remaining Lendings: ${remainingLendings}`);

    if (remainingTransactions === 0 && remainingLendings === 0) {
      console.log('\n🎉 Wallet system successfully reset! Ready for fresh transactions.');
    } else {
      console.log('\n⚠️  Some records may not have been deleted. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

resetWalletSystem();