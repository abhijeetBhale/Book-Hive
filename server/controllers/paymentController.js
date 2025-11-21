import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

// Verification badge price in paise (50 rupees = 5000 paise)
const VERIFICATION_PRICE = 5000;

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
      amount: VERIFICATION_PRICE, // amount in paise (50 rupees = 5000 paise)
      currency: 'INR',
      receipt: receipt,
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
      receipt: options.receipt
    });

    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', order.id);

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
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ 
        success: false,
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    // Verify signature
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

    // Payment is verified, update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isVerified: true,
        verificationPurchaseDate: new Date(),
        verificationPaymentId: razorpay_payment_id
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
