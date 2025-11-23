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

export const sendEmailVerification = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  const subject = '✉️ Verify Your BookHive Email Address';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .button:hover { background: #4338ca; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">📧</div>
          <h1>Verify Your Email</h1>
          <p>Welcome to BookHive, ${name}!</p>
        </div>
        <div class="content">
          <p>Thank you for joining BookHive! To complete your registration and unlock all features, please verify your email address.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <div class="info-box">
            <h3>✓ Why verify your email?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Get the "Contact Verified" badge on your profile</li>
              <li>Receive important notifications about your books</li>
              <li>Recover your account if you forget your password</li>
              <li>Build trust with other BookHive members</li>
            </ul>
          </div>

          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>

          <p>If you didn't create a BookHive account, you can safely ignore this email.</p>
          
          <p>Happy reading!</p>
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


export const sendVerificationConfirmationEmail = async (email, name) => {
  const subject = '🎉 Welcome to BookHive Premium - You\'re Now Verified!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .badge { display: inline-block; background: #1a87db; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .checkmark { font-size: 48px; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .benefit-item { display: flex; align-items: start; margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 6px; }
        .benefit-icon { color: #10b981; margin-right: 12px; font-size: 24px; flex-shrink: 0; }
        .premium-badge { background: linear-gradient(135deg, #1a87db 0%, #4F46E5 100%); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">✓</div>
          <h1>Congratulations, ${name}!</h1>
          <div class="premium-badge">🌟 Premium Verified Member</div>
          <p>You've unlocked the full BookHive experience!</p>
        </div>
        <div class="content">
          <p>Thank you for becoming a Premium Verified member! Your BookHive account now has exclusive benefits and features.</p>
          
          <div class="benefits">
            <h3>🎁 Your Premium Benefits:</h3>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <div>
                <strong>Verified Blue Badge</strong><br/>
                <span style="color: #6b7280;">A blue checkmark appears next to your name everywhere on BookHive</span>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🚀</span>
              <div>
                <strong>Boosted Search Visibility</strong><br/>
                <span style="color: #6b7280;">Your profile and books appear higher in search results</span>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">⚡</span>
              <div>
                <strong>Priority Borrowing Queue</strong><br/>
                <span style="color: #6b7280;">Your borrow requests get priority approval from book owners</span>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📚</span>
              <div>
                <strong>Borrow Multiple Books</strong><br/>
                <span style="color: #6b7280;">Borrow up to 3 books simultaneously (vs 1 for free users)</span>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🌟</span>
              <div>
                <strong>Early Access to Rare Books</strong><br/>
                <span style="color: #6b7280;">Get first dibs on newly listed rare and popular books</span>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🛡️</span>
              <div>
                <strong>Trusted Member Profile</strong><br/>
                <span style="color: #6b7280;">Build instant credibility with the BookHive community</span>
              </div>
            </div>
          </div>

          <p style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5;">
            <strong>💡 Pro Tip:</strong> Your premium features are now active! Start browsing books and enjoy your priority status.
          </p>

          <p>Your verified status is lifetime - no recurring fees, ever!</p>
          
          <p>Happy reading and sharing!</p>
          <p><strong>The BookHive Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from BookHive. Please do not reply to this email.</p>
          <p>Questions? Contact us at support@bookhive.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({ to: email, subject, html });
};

export const sendAccountDeletionEmail = async (email, name) => {
  const subject = 'Goodbye from BookHive - Your Account Has Been Deleted';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .highlight { color: #667eea; font-weight: bold; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">📚</div>
          <h1>Goodbye, ${name}</h1>
          <p>We're sorry to see you go</p>
        </div>
        <div class="content">
          <p>Your BookHive account has been successfully deleted as requested.</p>
          
          <div class="info-box">
            <h3>What has been deleted:</h3>
            <ul>
              <li>Your profile and personal information</li>
              <li>All your book listings</li>
              <li>Your friendships and connections</li>
              <li>All messages and conversations</li>
              <li>Your reviews and ratings</li>
              <li>Your location data from the map</li>
              <li>All borrow and lending history</li>
              <li>Club memberships and activities</li>
            </ul>
          </div>

          <p>Thank you for being part of the BookHive community. We appreciate the time you spent with us and hope you enjoyed sharing books with fellow readers.</p>

          <div class="info-box">
            <h3>📖 What We Offered:</h3>
            <p>BookHive was designed to connect book lovers, facilitate book sharing, and build a community of readers. We hope we made a positive impact during your time with us.</p>
          </div>

          <p><strong>Changed your mind?</strong></p>
          <p>If you'd like to return to BookHive in the future, you're always welcome to create a new account. However, please note that your previous data cannot be recovered.</p>

          <p>We wish you all the best in your future reading adventures!</p>
          
          <p><strong>The BookHive Team</strong></p>
        </div>
        <div class="footer">
          <p>This is a confirmation email for your account deletion request.</p>
          <p>If you did not request this deletion, please contact us immediately at support@bookhive.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({ to: email, subject, html });
};
