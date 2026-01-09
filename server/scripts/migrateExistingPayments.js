import mongoose from 'mongoose';
import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRequest from '../models/BorrowRequest.js';
import WalletService from '../services/walletService.js';
import WalletTransaction from '../models/WalletTransaction.js';
import 'dotenv/config';

async function migrateExistingPayments() {
  try {
    console.log('🔄 Migrating existing payments to wallet system...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all paid lending fees that don't have wallet transactions
    const paidRequests = await BorrowRequest.find({ 
      lendingFeeStatus: 'paid',
      lendingFee: { $gt: 0 },
      lendingFeePaymentId: { $exists: true }
    })
      .populate('book', 'title')
      .populate('borrower', 'name email')
      .populate('owner', 'name email')
      .lean();

    console.log(`Found ${paidRequests.length} paid requests to migrate:`);

    for (const request of paidRequests) {
      console.log(`\n📚 Processing: ${request.borrower?.name} → "${request.book?.title}"`);
      console.log(`   Amount: ₹${request.lendingFee}`);
      console.log(`   Owner: ${request.owner?.name}`);
      console.log(`   Payment ID: ${request.lendingFeePaymentId}`);

      // Check if wallet transaction already exists
      const existingTransaction = await WalletTransaction.findOne({
        referenceId: request._id,
        source: 'lending_fee'
      });

      if (existingTransaction) {
        console.log('   ⚠️  Wallet transaction already exists, skipping...');
        continue;
      }

      // Calculate fees using current commission rate
      const commissionRate = WalletService.getCommissionRate();
      const platformFee = Math.round(request.lendingFee * commissionRate * 100) / 100;
      const ownerEarnings = Math.round((request.lendingFee - platformFee) * 100) / 100;

      console.log(`   💰 Platform Fee: ₹${platformFee} (${(commissionRate * 100).toFixed(1)}%)`);
      console.log(`   💰 Owner Earnings: ₹${ownerEarnings}`);

      try {
        // Process the payment through wallet service
        const result = await WalletService.processLendingFeePayment(
          request._id,
          request.owner._id,
          request.lendingFee,
          request.lendingFeePaymentId
        );

        console.log('   ✅ Wallet transactions created successfully');
        console.log(`   📊 Lender credited: ₹${result.lenderEarnings}`);
        console.log(`   📊 Platform commission: ₹${result.platformFee}`);

        // Update the borrow request with calculated fees if they're missing
        if (!request.platformFee || !request.ownerEarnings) {
          await BorrowRequest.findByIdAndUpdate(request._id, {
            platformFee: result.platformFee,
            ownerEarnings: result.lenderEarnings
          });
          console.log('   📝 Updated borrow request with fee breakdown');
        }

      } catch (error) {
        console.error(`   ❌ Failed to process payment: ${error.message}`);
      }
    }

    // Show final wallet summary
    console.log('\n🏦 Final Platform Wallet Summary:');
    const platformSummary = await WalletService.getPlatformWalletSummary();
    console.log(`Platform Commission: ₹${platformSummary.platformCommission}`);
    console.log(`Lender Earnings: ₹${platformSummary.lenderEarnings}`);
    console.log(`Commission Rate: ${(platformSummary.commissionRate * 100).toFixed(1)}%`);

    // Show owner wallet balances
    console.log('\n👥 Owner Wallet Balances:');
    const ownersWithEarnings = await User.find({
      'wallet.totalEarnings': { $gt: 0 }
    }).select('name email wallet').lean();

    ownersWithEarnings.forEach(owner => {
      console.log(`${owner.name}: ₹${owner.wallet.totalEarnings} total, ₹${owner.wallet.pendingEarnings} pending`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

migrateExistingPayments();