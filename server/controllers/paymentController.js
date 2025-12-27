import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Book from '../models/Book.js';

// Verification badge price in paise (99 rupees = 9900 paise)
const VERIFICATION_PRICE = 9900;

// Initialize Razorpay instance only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.warn('⚠️  Razorpay keys not found. Payment features will be disabled.');
  console.warn('   Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable payments.');
}

// @desc    Create order for verification badge purchase
// @route   POST /api/payment/create-verification-order
export const createVerificationOrder = async (req, res) => {
  try {
    console.log('📝 Create verification order request received');
    console.log('User:', req.user?.name, req.user?.email);
    console.log('User ID:', req.user?._id);
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('❌ User not authenticated');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'User not found in request'
      });
    }
    
    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay keys not configured');
      console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set');
      console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set');
      return res.status(503).json({ 
        message: 'Payment service is not configured. Please contact support.',
        error: 'Razorpay keys not configured'
      });
    }

    // Initialize Razorpay if not already done
    if (!razorpay) {
      console.log('🔄 Initializing Razorpay...');
      try {
        razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('✅ Razorpay initialized successfully');
      } catch (initError) {
        console.error('❌ Failed to initialize Razorpay:', initError);
        return res.status(503).json({ 
          message: 'Failed to initialize payment service',
          error: initError.message
        });
      }
    }

    const userId = req.user._id;
    console.log('🔍 Looking up user:', userId);
    
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found in database:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.name, user.email);

    // Check if user is already verified
    if (user.isVerified) {
      console.log('⚠️  User already verified');
      return res.status(400).json({ message: 'You are already verified' });
    }

    // Create Razorpay order
    // Receipt must be max 40 characters
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = userId.toString().slice(-8); // Last 8 chars of userId
    const receipt = `ver_${userIdShort}_${timestamp}`; // Format: ver_12345678_12345678 (max 27 chars)
    
    const options = {
      amount: VERIFICATION_PRICE, // amount in paise (99 rupees = 9900 paise)
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1, // Auto capture payment
      notes: {
        userId: userId.toString(),
        purpose: 'verification_badge',
        userName: user.name,
        userEmail: user.email
      }
    };

    console.log('📤 Creating Razorpay order with options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      payment_capture: options.payment_capture
    });

    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', order.id);
    console.log('Order details:', JSON.stringify(order, null, 2));

    res.json({
      success: true,
      order: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      },
      key: process.env.RAZORPAY_KEY_ID,
      contact: user.email,
      email: user.email
    });
  } catch (error) {
    console.error('❌ Create verification order error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific Razorpay errors
    if (error.error) {
      console.error('Razorpay error details:', error.error);
    }
    
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message,
      details: error.error?.description || error.description,
      hint: 'Make sure your Razorpay Test Mode keys are correct and active'
    });
  }
};

// @desc    Verify payment and activate verification badge
// @route   POST /api/payment/verify-payment
export const verifyPayment = async (req, res) => {
  try {
    console.log('🔍 Verify payment request received');
    console.log('Request body:', req.body);
    
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay secret not configured');
      return res.status(503).json({ 
        success: false,
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    console.log('Payment details:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: userId
    });

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Signature verification:', {
      received: razorpay_signature,
      expected: expectedSignature,
      match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Signature mismatch');
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    console.log('✅ Signature verified successfully');

    // Payment is verified, update user with premium features
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isVerified: true,
        verificationPurchaseDate: new Date(),
        verificationPaymentId: razorpay_payment_id,
        // Enable all premium features
        'premiumFeatures.searchBoost': true,
        'premiumFeatures.priorityQueue': true,
        'premiumFeatures.multipleBooks': true,
        'premiumFeatures.maxBooksLimit': 3, // Premium users can borrow 3 books at a time
        'premiumFeatures.earlyAccess': true
      },
      { new: true }
    );

    // Send verification email
    try {
      const { sendVerificationConfirmationEmail } = await import('../services/emailService.js');
      await sendVerificationConfirmationEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Verification badge activated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        verificationPurchaseDate: user.verificationPurchaseDate
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify payment',
      error: error.message 
    });
  }
};

// @desc    Get verification status
// @route   GET /api/payment/verification-status
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('isVerified verificationPurchaseDate');

    res.json({
      isVerified: user.isVerified || false,
      verificationPurchaseDate: user.verificationPurchaseDate || null,
      price: VERIFICATION_PRICE / 100 // Convert paise to rupees
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ 
      message: 'Failed to get verification status',
      error: error.message 
    });
  }
};

// @desc    Create order for security deposit
// @route   POST /api/payment/create-deposit-order
export const createDepositOrder = async (req, res) => {
  try {
    const { borrowRequestId } = req.body;
    const userId = req.user._id;

    const borrowRequest = await BorrowRequest.findById(borrowRequestId).populate('book');
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.borrower.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (borrowRequest.depositStatus !== 'pending') {
      return res.status(400).json({ message: 'Deposit is not pending for this request' });
    }

    const amount = borrowRequest.depositAmount * 100; // Convert to paise

    const options = {
      amount,
      currency: 'INR',
      receipt: `dep_${borrowRequestId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: userId.toString(),
        purpose: 'security_deposit',
        borrowRequestId: borrowRequestId.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create deposit order error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
};

// @desc    Verify security deposit payment
// @route   POST /api/payment/verify-deposit-payment
export const verifyDepositPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, borrowRequestId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed' 
      });
    }

    // Update borrow request
    await BorrowRequest.findByIdAndUpdate(
      borrowRequestId,
      {
        depositStatus: 'paid',
        depositPaymentId: razorpay_payment_id
      }
    );

    res.json({
      success: true,
      message: 'Security deposit paid successfully!'
    });
  } catch (error) {
    console.error('Verify deposit payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify payment',
      error: error.message 
    });
  }
};

// Platform commission rate (20%)
const PLATFORM_COMMISSION_RATE = 0.2;

// @desc    Create order for lending fee payment
// @route   POST /api/payment/create-lending-fee-order
export const createLendingFeeOrder = async (req, res) => {
  try {
    const { borrowRequestId } = req.body;
    const userId = req.user._id;

    console.log('🔄 Creating lending fee order for:', {
      borrowRequestId,
      userId: userId.toString()
    });

    if (!razorpay) {
      console.error('❌ Razorpay not initialized');
      return res.status(503).json({ 
        message: 'Payment service is not configured. Please contact support.',
        error: 'Razorpay not initialized'
      });
    }

    const borrowRequest = await BorrowRequest.findById(borrowRequestId)
      .populate('book')
      .populate('owner', 'name email');
    
    if (!borrowRequest) {
      console.error('❌ Borrow request not found:', borrowRequestId);
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    console.log('📚 Borrow request found:', {
      id: borrowRequest._id,
      status: borrowRequest.status,
      borrower: borrowRequest.borrower.toString(),
      book: borrowRequest.book?.title,
      lendingFee: borrowRequest.book?.lendingFee
    });

    if (borrowRequest.borrower.toString() !== userId.toString()) {
      console.error('❌ Unauthorized access:', {
        requestBorrower: borrowRequest.borrower.toString(),
        currentUser: userId.toString()
      });
      return res.status(403).json({ message: 'Not authorized. Only the borrower can pay the lending fee.' });
    }

    if (borrowRequest.status !== 'approved') {
      console.error('❌ Invalid status:', borrowRequest.status);
      return res.status(400).json({ 
        message: 'Borrow request must be approved before paying lending fee',
        currentStatus: borrowRequest.status
      });
    }

    // Get lending fee from book
    const book = borrowRequest.book;
    const lendingFee = book.lendingFee || 0;

    console.log('💰 Lending fee details:', {
      bookId: book._id,
      bookTitle: book.title,
      lendingFee,
      hasLendingFee: lendingFee > 0
    });

    if (lendingFee <= 0) {
      console.error('❌ No lending fee:', lendingFee);
      return res.status(400).json({ 
        message: 'This book has no lending fee. Payment not required.' 
      });
    }

    if (borrowRequest.lendingFeeStatus === 'paid') {
      console.error('❌ Already paid:', borrowRequest.lendingFeeStatus);
      return res.status(400).json({ 
        message: 'Lending fee has already been paid for this request' 
      });
    }

    // Calculate platform fee and owner earnings
    const platformFee = Math.round(lendingFee * PLATFORM_COMMISSION_RATE * 100) / 100; // Round to 2 decimals
    const ownerEarnings = Math.round((lendingFee - platformFee) * 100) / 100;

    console.log('🧮 Fee calculation:', {
      lendingFee,
      platformFee,
      ownerEarnings,
      commissionRate: PLATFORM_COMMISSION_RATE
    });

    // Update borrow request with fee information
    borrowRequest.lendingFee = lendingFee;
    borrowRequest.platformFee = platformFee;
    borrowRequest.ownerEarnings = ownerEarnings;
    borrowRequest.lendingFeeStatus = 'pending';
    await borrowRequest.save();

    const amount = Math.round(lendingFee * 100); // Convert to paise

    const options = {
      amount,
      currency: 'INR',
      receipt: `lend_${borrowRequestId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      payment_capture: 1,
      notes: {
        userId: userId.toString(),
        purpose: 'lending_fee',
        borrowRequestId: borrowRequestId.toString(),
        bookId: book._id.toString(),
        ownerId: borrowRequest.owner._id.toString(),
        lendingFee: lendingFee.toString(),
        platformFee: platformFee.toString(),
        ownerEarnings: ownerEarnings.toString()
      }
    };

    console.log('🎫 Creating Razorpay order with options:', {
      amount,
      currency: options.currency,
      receipt: options.receipt,
      notesCount: Object.keys(options.notes).length
    });

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      key: process.env.RAZORPAY_KEY_ID,
      lendingFee: lendingFee,
      platformFee: platformFee,
      ownerEarnings: ownerEarnings
    });
  } catch (error) {
    console.error('❌ Create lending fee order error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
};

// @desc    Verify lending fee payment and distribute earnings
// @route   POST /api/payment/verify-lending-fee-payment
export const verifyLendingFeePayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ 
        success: false,
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, borrowRequestId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    // Get borrow request with populated data
    const borrowRequest = await BorrowRequest.findById(borrowRequestId)
      .populate('owner', 'name email')
      .populate('book', 'title');
    
    if (!borrowRequest) {
      return res.status(404).json({ 
        success: false,
        message: 'Borrow request not found' 
      });
    }

    // Update borrow request payment status
    borrowRequest.lendingFeeStatus = 'paid';
    borrowRequest.lendingFeePaymentId = razorpay_payment_id;
    borrowRequest.paymentCompletedAt = new Date();
    await borrowRequest.save();

    // Add earnings to owner's wallet
    const owner = await User.findById(borrowRequest.owner._id);
    if (owner) {
      owner.wallet.totalEarnings = (owner.wallet.totalEarnings || 0) + borrowRequest.ownerEarnings;
      owner.wallet.pendingEarnings = (owner.wallet.pendingEarnings || 0) + borrowRequest.ownerEarnings;
      
      // Add transaction record
      owner.wallet.transactions.push({
        type: 'lending_fee',
        amount: borrowRequest.ownerEarnings,
        borrowRequestId: borrowRequest._id,
        description: `Earned ₹${borrowRequest.ownerEarnings} from lending "${borrowRequest.book.title}" (Platform fee: ₹${borrowRequest.platformFee})`
      });
      
      await owner.save();
    }

    res.json({
      success: true,
      message: 'Lending fee paid successfully! The owner has been credited.',
      paymentDetails: {
        lendingFee: borrowRequest.lendingFee,
        platformFee: borrowRequest.platformFee,
        ownerEarnings: borrowRequest.ownerEarnings
      }
    });
  } catch (error) {
    console.error('Verify lending fee payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify payment',
      error: error.message 
    });
  }
};
