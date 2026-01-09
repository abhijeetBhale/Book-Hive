import mongoose from 'mongoose';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import BorrowRequest from '../models/BorrowRequest.js';
import 'dotenv/config';

async function verifyReset() {
  try {
    console.log('🔍 Verifying wallet system reset...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Abhijeet Bhale's wallet (was previously ₹55.98)
    const abhijeet = await User.findOne({ name: 'Abhijeet Bhale' }).select('name wallet');
    console.log('👤 Abhijeet Bhale wallet:');
    console.log(`   Balance: ₹${abhijeet?.wallet?.balance || 0}`);
    console.log(`   Total Earnings: ₹${abhijeet?.wallet?.totalEarnings || 0}`);
    console.log(`   Pending Earnings: ₹${abhijeet?.wallet?.pendingEarnings || 0}`);
    console.log(`   Transactions: ${abhijeet?.wallet?.transactions?.length || 0}\n`);

    // Check Shreyan Bhale's borrow request status
    const borrowRequest = await BorrowRequest.findOne({ 
      'borrower': { $exists: true }
    })
      .populate('borrower', 'name')
      .populate('book', 'title');

    if (borrowRequest) {
      console.log('📚 Sample Borrow Request:');
      console.log(`   Borrower: ${borrowRequest.borrower?.name}`);
      console.log(`   Book: ${borrowRequest.book?.title}`);
      console.log(`   Lending Fee Status: ${borrowRequest.lendingFeeStatus}`);
      console.log(`   Payment ID: ${borrowRequest.lendingFeePaymentId || 'None'}\n`);
    }

    // Count totals
    const totalTransactions = await WalletTransaction.countDocuments();
    const totalUsersWithWallets = await User.countDocuments({ 'wallet.balance': { $gt: 0 } });

    console.log('📊 System Status:');
    console.log(`   Total Wallet Transactions: ${totalTransactions}`);
    console.log(`   Users with Balance > ₹0: ${totalUsersWithWallets}`);
    console.log('\n✅ System is clean and ready for new transactions!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyReset();