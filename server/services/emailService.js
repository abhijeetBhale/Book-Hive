import transporter from '../config/email.js';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


export const sendVerificationConfirmationEmail = async (email, name) => {
  const subject = '🎉 Your BookHive Account is Now Verified!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .badge { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .checkmark { font-size: 48px; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefit-item { display: flex; align-items: start; margin: 10px 0; }
        .benefit-icon { color: #10b981; margin-right: 10px; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">✓</div>
          <h1>Congratulations, ${name}!</h1>
          <p>Your account is now verified</p>
        </div>
        <div class="content">
          <p>Thank you for purchasing the verified badge! Your BookHive account now has the verified status.</p>
          
          <div class="benefits">
            <h3>Your Verified Benefits:</h3>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span><strong>Verified Badge:</strong> A blue checkmark will appear next to your name across the platform</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span><strong>Increased Trust:</strong> Other users will know you're a verified member of the community</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span><strong>Better Visibility:</strong> Your profile and book listings will stand out</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span><strong>Priority Support:</strong> Get faster responses from our support team</span>
            </div>
          </div>

          <p>Your verified status is now active and will be visible to all BookHive users.</p>
          
          <p>Happy reading and sharing!</p>
          <p><strong>The BookHive Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from BookHive. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({ to: email, subject, html });
};
