import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Book from '../models/Book.js';
import Lending from '../models/Lending.js';
import WalletService from '../services/walletService.js';

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
      userId: userId.toString(),
      userEmail: req.user.email,
      userName: req.user.name
    });

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay keys not configured');
      console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set');
      console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set');
      return res.status(503).json({ 
        success: false,
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
          success: false,
          message: 'Failed to initialize payment service',
          error: initError.message
        });
      }
    }

    const borrowRequest = await BorrowRequest.findById(borrowRequestId)
      .populate('book')
      .populate('owner', 'name email')
      .populate('borrower', 'name email phone _id');
    
    if (!borrowRequest) {
      console.error('❌ Borrow request not found:', borrowRequestId);
      return res.status(404).json({ 
        success: false,
        message: 'Borrow request not found' 
      });
    }

    console.log('📚 Borrow request found:', {
      id: borrowRequest._id,
      status: borrowRequest.status,
      borrower: borrowRequest.borrower,
      borrowerType: typeof borrowRequest.borrower,
      borrowerId: borrowRequest.borrower?._id || borrowRequest.borrower,
      book: borrowRequest.book?.title,
      lendingFee: borrowRequest.book?.lendingFee
    });

    // Get the borrower ID (handle both populated and non-populated cases)
    const borrowerId = borrowRequest.borrower?._id || borrowRequest.borrower;
    
    console.log('🔍 Authorization check:', {
      borrowRequestBorrower: borrowRequest.borrower,
      borrowRequestBorrowerType: typeof borrowRequest.borrower,
      borrowerId: borrowerId,
      borrowerIdString: borrowerId.toString(),
      currentUserId: userId,
      currentUserIdType: typeof userId,
      currentUserIdString: userId.toString(),
      areEqual: borrowerId.toString() === userId.toString()
    });

    if (borrowerId.toString() !== userId.toString()) {
      console.error('❌ Unauthorized access:', {
        requestBorrower: borrowerId.toString(),
        currentUser: userId.toString()
      });
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized. Only the borrower can pay the lending fee.' 
      });
    }

    if (borrowRequest.status !== 'approved') {
      console.error('❌ Invalid status:', borrowRequest.status);
      return res.status(400).json({ 
        success: false,
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
        success: false,
        message: 'This book has no lending fee. Payment not required.' 
      });
    }

    if (borrowRequest.lendingFeeStatus === 'paid') {
      console.error('❌ Already paid:', borrowRequest.lendingFeeStatus);
      return res.status(400).json({ 
        success: false,
        message: 'Lending fee has already been paid for this request' 
      });
    }

    // Check if a Lending record already exists and is paid
    const existingLending = await Lending.findOne({ borrowRequestId });
    if (existingLending && existingLending.isPaid) {
      console.error('❌ Lending already paid:', existingLending._id);
      return res.status(400).json({
        success: false,
        message: 'This lending fee has already been paid'
      });
    }

    // Calculate platform fee and owner earnings using WalletService
    const commissionRate = WalletService.getCommissionRate();
    const platformFee = Math.round(lendingFee * commissionRate * 100) / 100;
    const ownerEarnings = Math.round((lendingFee - platformFee) * 100) / 100;

    console.log('🧮 Fee calculation:', {
      lendingFee,
      platformFee,
      ownerEarnings,
      commissionRate
    });

    // Create or update Lending record
    let lending = await Lending.findOne({ borrowRequestId });
    if (!lending) {
      lending = new Lending({
        bookId: book._id,
        borrowerId: userId,
        lenderId: borrowRequest.owner._id,
        borrowRequestId,
        fee: lendingFee,
        platformFee,
        lenderEarnings: ownerEarnings,
        isPaid: false,
        commissionRate
      });
      await lending.save();
      console.log('✅ Lending record created:', lending._id);
    }

    // Update borrow request with fee information
    borrowRequest.lendingFee = lendingFee;
    borrowRequest.platformFee = platformFee;
    borrowRequest.ownerEarnings = ownerEarnings;
    borrowRequest.lendingFeeStatus = 'pending';
    await borrowRequest.save();

    const amount = Math.round(lendingFee * 100); // Convert to paise

    // Create a more unique receipt ID
    const timestamp = Date.now().toString();
    const receipt = `lend_${borrowRequestId.toString().slice(-8)}_${timestamp.slice(-8)}`;

    const options = {
      amount,
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1,
      notes: {
        userId: userId.toString(),
        purpose: 'lending_fee',
        borrowRequestId: borrowRequestId.toString(),
        bookId: book._id.toString(),
        ownerId: borrowRequest.owner._id.toString(),
        lendingFee: lendingFee.toString(),
        platformFee: platformFee.toString(),
        ownerEarnings: ownerEarnings.toString(),
        bookTitle: book.title,
        borrowerName: borrowRequest.borrower.name,
        borrowerEmail: borrowRequest.borrower.email
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
      status: order.status,
      receipt: order.receipt
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      },
      key: process.env.RAZORPAY_KEY_ID,
      lendingFee: lendingFee,
      platformFee: platformFee,
      ownerEarnings: ownerEarnings,
      borrower: {
        name: borrowRequest.borrower.name,
        email: borrowRequest.borrower.email,
        phone: borrowRequest.borrower.phone
      }
    });
  } catch (error) {
    console.error('❌ Create lending fee order error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific Razorpay errors
    if (error.error) {
      console.error('Razorpay error details:', error.error);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
      details: error.error?.description || error.description,
      hint: error.error?.code === 'BAD_REQUEST_ERROR' && error.error?.description?.includes('international') 
        ? 'International cards are not supported. Please use Indian payment methods (UPI, Net Banking, or Indian cards).'
        : 'Please check your Razorpay configuration and try again'
    });
  }
};

// @desc    Verify lending fee payment and distribute earnings
// @route   POST /api/payment/verify-lending-fee-payment
export const verifyLendingFeePayment = async (req, res) => {
  try {
    console.log('🔍 Verify lending fee payment request received');
    console.log('Request body keys:', Object.keys(req.body));
    
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay secret not configured');
      return res.status(503).json({ 
        success: false,
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, borrowRequestId } = req.body;
    const userId = req.user._id;

    console.log('Payment verification details:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: userId.toString(),
      borrow_request_id: borrowRequestId,
      signature_length: razorpay_signature?.length
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !borrowRequestId) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

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

    // Get borrow request with populated data
    const borrowRequest = await BorrowRequest.findById(borrowRequestId)
      .populate('owner', 'name email wallet')
      .populate('book', 'title')
      .populate('borrower', 'name email');
    
    if (!borrowRequest) {
      console.error('❌ Borrow request not found:', borrowRequestId);
      return res.status(404).json({ 
        success: false,
        message: 'Borrow request not found' 
      });
    }

    console.log('📚 Borrow request details:', {
      id: borrowRequest._id,
      status: borrowRequest.status,
      lendingFeeStatus: borrowRequest.lendingFeeStatus,
      lendingFee: borrowRequest.lendingFee,
      ownerEarnings: borrowRequest.ownerEarnings
    });

    // Check if payment is already processed
    if (borrowRequest.lendingFeeStatus === 'paid') {
      console.log('⚠️  Payment already processed');
      return res.json({
        success: true,
        message: 'Payment has already been processed',
        paymentDetails: {
          lendingFee: borrowRequest.lendingFee,
          platformFee: borrowRequest.platformFee,
          ownerEarnings: borrowRequest.ownerEarnings
        }
      });
    }

    // Check if Lending record exists and is already paid
    const lending = await Lending.findOne({ borrowRequestId });
    if (lending && lending.isPaid) {
      console.log('⚠️  Lending already marked as paid');
      return res.json({
        success: true,
        message: 'Payment has already been processed',
        paymentDetails: {
          lendingFee: lending.fee,
          platformFee: lending.platformFee,
          ownerEarnings: lending.lenderEarnings
        }
      });
    }

    // Verify the user is authorized (handle both populated and non-populated cases)
    const borrowerId = borrowRequest.borrower?._id || borrowRequest.borrower;
    if (borrowerId.toString() !== userId.toString()) {
      console.error('❌ Unauthorized verification attempt');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this payment'
      });
    }

    // Update borrow request payment status
    borrowRequest.lendingFeeStatus = 'paid';
    borrowRequest.lendingFeePaymentId = razorpay_payment_id;
    borrowRequest.paymentCompletedAt = new Date();
    await borrowRequest.save();

    console.log('✅ Borrow request updated with payment info');

    // Update or create Lending record and mark as paid
    let lendingRecord = lending;
    if (!lendingRecord) {
      // Create lending record if it doesn't exist
      const commissionRate = WalletService.getCommissionRate();
      const platformFee = Math.round(borrowRequest.lendingFee * commissionRate * 100) / 100;
      const lenderEarnings = Math.round((borrowRequest.lendingFee - platformFee) * 100) / 100;

      lendingRecord = new Lending({
        bookId: borrowRequest.book._id,
        borrowerId: borrowRequest.borrower._id,
        lenderId: borrowRequest.owner._id,
        borrowRequestId,
        fee: borrowRequest.lendingFee,
        platformFee,
        lenderEarnings,
        isPaid: true,
        paymentId: razorpay_payment_id,
        paidAt: new Date(),
        commissionRate
      });
    } else {
      // Update existing lending record
      lendingRecord.isPaid = true;
      lendingRecord.paymentId = razorpay_payment_id;
      lendingRecord.paidAt = new Date();
    }

    await lendingRecord.save();
    console.log('✅ Lending record updated:', lendingRecord._id);

    // Process payment through wallet service (splits commission and credits wallets)
    const paymentResult = await WalletService.processLendingFeePayment(
      borrowRequestId,
      borrowRequest.owner._id,
      borrowRequest.lendingFee,
      razorpay_payment_id
    );

    console.log('✅ Wallet service processing completed:', paymentResult);

    // Send success response
    res.json({
      success: true,
      message: 'Lending fee paid successfully! The owner has been credited.',
      paymentDetails: {
        lendingFee: lendingRecord.fee,
        platformFee: lendingRecord.platformFee,
        ownerEarnings: lendingRecord.lenderEarnings,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        lendingId: lendingRecord._id
      }
    });

    console.log('✅ Payment verification completed successfully');
  } catch (error) {
    console.error('❌ Verify lending fee payment error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify payment',
      error: error.message 
    });
  }
};
