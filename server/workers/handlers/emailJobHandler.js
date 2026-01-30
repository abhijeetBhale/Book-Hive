import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generic email sender
const sendEmail = async (data) => {
  const { to, subject, html, text, attachments } = data;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
      attachments,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      to,
      subject,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Welcome email
const sendWelcomeEmail = async (data) => {
  const { user } = data;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to BookHive! 📚</h1>
      <p>Hi ${user.name},</p>
      <p>Welcome to BookHive, the community-driven platform for modern readers!</p>
      <p>You can now:</p>
      <ul>
        <li>📖 Discover books in your area</li>
        <li>🤝 Connect with fellow readers</li>
        <li>📅 Join literary events</li>
        <li>⭐ Build your reading reputation</li>
      </ul>
      <p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Get Started
        </a>
      </p>
      <p>Happy reading!</p>
      <p>The BookHive Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to BookHive! 🎉',
    html,
    text: `Welcome to BookHive, ${user.name}! Start discovering books in your community.`,
  });
};

// Borrow request email
const sendBorrowRequestEmail = async (data) => {
  const { bookOwner, requester, book, message } = data;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">New Borrow Request 📚</h1>
      <p>Hi ${bookOwner.name},</p>
      <p><strong>${requester.name}</strong> would like to borrow your book:</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0;">${book.title}</h3>
        <p style="margin: 0; color: #6b7280;">by ${book.author}</p>
      </div>
      ${message ? `<p><strong>Message:</strong> "${message}"</p>` : ''}
      <p>
        <a href="${process.env.CLIENT_URL}/dashboard/requests" 
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 12px;">
          View Request
        </a>
        <a href="${process.env.CLIENT_URL}/profile/${requester._id}" 
           style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Profile
        </a>
      </p>
      <p>Best regards,<br>The BookHive Team</p>
    </div>
  `;
  
  return sendEmail({
    to: bookOwner.email,
    subject: `New borrow request for "${book.title}"`,
    html,
    text: `${requester.name} wants to borrow your book "${book.title}". Check your dashboard to respond.`,
  });
};

// Reminder email
const sendReminderEmail = async (data) => {
  const { user, book, dueDate, type } = data;
  
  const isOverdue = new Date() > new Date(dueDate);
  const daysDiff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  let subject, html;
  
  if (type === 'return_reminder') {
    subject = isOverdue 
      ? `Overdue: Please return "${book.title}"` 
      : `Reminder: "${book.title}" due ${daysDiff > 0 ? `in ${daysDiff} days` : 'today'}`;
    
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${isOverdue ? '#dc2626' : '#f59e0b'};">
          ${isOverdue ? '⚠️ Overdue Book' : '📅 Return Reminder'}
        </h1>
        <p>Hi ${user.name},</p>
        <p>This is a ${isOverdue ? 'notice that your borrowed book is overdue' : 'friendly reminder about your borrowed book'}:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0;">${book.title}</h3>
          <p style="margin: 0; color: #6b7280;">by ${book.author}</p>
          <p style="margin: 8px 0 0 0; color: ${isOverdue ? '#dc2626' : '#f59e0b'};">
            <strong>Due: ${new Date(dueDate).toLocaleDateString()}</strong>
          </p>
        </div>
        <p>
          <a href="${process.env.CLIENT_URL}/dashboard/borrowed" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Manage Borrowed Books
          </a>
        </p>
        <p>Thank you for being part of the BookHive community!</p>
        <p>The BookHive Team</p>
      </div>
    `;
  }
  
  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Reminder: Your book "${book.title}" is ${isOverdue ? 'overdue' : `due ${daysDiff > 0 ? `in ${daysDiff} days` : 'today'}`}.`,
  });
};

// Overdue email (more urgent)
const sendOverdueEmail = async (data) => {
  return sendReminderEmail({
    ...data,
    type: 'return_reminder'
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendBorrowRequestEmail,
  sendReminderEmail,
  sendOverdueEmail,
};