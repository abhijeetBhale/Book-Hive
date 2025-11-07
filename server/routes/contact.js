import express from 'express';

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Name, email, and message are required.' 
      });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send confirmation email to user
    
    // For now, just log the contact request
    console.log('Contact form submission:', {
      name,
      email,
      phone: phone || 'Not provided',
      message,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to:
    // - Save to a Contact model in MongoDB
    // - Send email using nodemailer or similar service
    // - Add to a support ticket system

    res.status(200).json({ 
      message: 'Thank you for contacting us! We will get back to you soon.',
      success: true 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      message: 'Failed to submit contact form. Please try again later.' 
    });
  }
});

export default router;
