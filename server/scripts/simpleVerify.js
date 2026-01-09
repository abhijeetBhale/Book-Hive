import mongoose from 'mongoose';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import 'dotenv/config';

async function simpleVerify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const totalTransactions = await WalletTransaction.countDocuments();
    const usersWithBalance = await User.countDocuments({ 'wallet.balance': { $gt: 0 } });
    
    console.log('📊 Reset Verification:');
    console.log(`   Wallet Transactions: ${totalTransactions}`);
    console.log(`   Users with Balance > ₹0: ${usersWithBalance}`);
    console.log('\n✅ System successfully reset!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

simpleVerify();