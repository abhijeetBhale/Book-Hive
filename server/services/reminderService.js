import BorrowRequest from '../models/BorrowRequest.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './emailService.js';

export const sendOverdueReminders = async (io = null) => {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Find all borrowed books that need reminders
        const allBorrowedBooks = await BorrowRequest.find({
            status: 'borrowed',
            $or: [
                // Books due in 2 days (first reminder)
                {
                    dueDate: { $gte: today, $lte: twoDaysFromNow },
                    'reminderHistory.type': { $ne: 'two_days_before' }
                },
                // Books due today (D-Day reminder)
                {
                    dueDate: { $gte: today, $lte: tomorrow },
                    'reminderHistory.type': { $ne: 'due_date' }
                },
                // Overdue books (daily reminders)
                {
                    dueDate: { $lt: today },
                    $or: [
                        { lastReminderDate: { $exists: false } },
                        { lastReminderDate: { $lt: today } }
                    ]
                }
            ]
        }).populate('book borrower owner');

        if (allBorrowedBooks.length === 0) {
            console.log('No reminders to send today.');
            return;
        }

        // Group books by borrower (user who needs to return books)
        const borrowerGroups = {};
        // Group books by owner (user who lent books)
        const ownerGroups = {};

        allBorrowedBooks.forEach(request => {
            const borrowerId = request.borrower._id.toString();
            const ownerId = request.owner._id.toString();
            
            // Determine reminder type
            const dueDate = new Date(request.dueDate);
            const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            let reminderType;
            if (daysDiff < 0) {
                reminderType = 'overdue';
            } else if (daysDiff === 0) {
                reminderType = 'due_date';
            } else if (daysDiff <= 2) {
                reminderType = 'two_days_before';
            } else {
                return; // Skip books that don't need reminders yet
            }

            const bookData = {
                ...request.toObject(),
                reminderType,
                daysDiff
            };

            // Group by borrower
            if (!borrowerGroups[borrowerId]) {
                borrowerGroups[borrowerId] = {
                    user: request.borrower,
                    books: []
                };
            }
            borrowerGroups[borrowerId].books.push(bookData);

            // Group by owner
            if (!ownerGroups[ownerId]) {
                ownerGroups[ownerId] = {
                    user: request.owner,
                    books: []
                };
            }
            ownerGroups[ownerId].books.push(bookData);
        });

        // Send consolidated emails to borrowers
        let borrowerEmailsSent = 0;
        for (const [borrowerId, data] of Object.entries(borrowerGroups)) {
            try {
                await sendConsolidatedBorrowerEmail(data.user, data.books);
                borrowerEmailsSent++;
                
                // Create in-app notifications for borrower
                await createBorrowerNotifications(data.user, data.books, io);
                
                // Update reminder tracking for all books
                await updateReminderTracking(data.books);
            } catch (error) {
                console.error(`Failed to send email to borrower ${data.user.name}:`, error.message);
            }
        }

        // Send consolidated emails to owners
        let ownerEmailsSent = 0;
        for (const [ownerId, data] of Object.entries(ownerGroups)) {
            try {
                await sendConsolidatedOwnerEmail(data.user, data.books);
                ownerEmailsSent++;
                
                // Create in-app notifications for owner
                await createOwnerNotifications(data.user, data.books, io);
            } catch (error) {
                console.error(`Failed to send email to owner ${data.user.name}:`, error.message);
            }
        }

        console.log(`✅ Sent ${borrowerEmailsSent + ownerEmailsSent} consolidated emails:`);
        console.log(`   - ${borrowerEmailsSent} borrower digest emails`);
        console.log(`   - ${ownerEmailsSent} owner digest emails`);
        console.log(`   - Total books processed: ${allBorrowedBooks.length}`);
    } catch (error) {
        console.error('Error in reminder service:', error);
    }
};

// Helper function to send consolidated email to borrowers
const sendConsolidatedBorrowerEmail = async (borrower, books) => {
    // Categorize books by urgency
    const overdueBooks = books.filter(b => b.reminderType === 'overdue');
    const dueTodayBooks = books.filter(b => b.reminderType === 'due_date');
    const dueSoonBooks = books.filter(b => b.reminderType === 'two_days_before');

    const totalBooks = books.length;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const emailSubject = `📚 BookHive Daily Reminder - ${totalBooks} Book${totalBooks > 1 ? 's' : ''} Need${totalBooks === 1 ? 's' : ''} Your Attention`;

    const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BookHive Daily Reminder</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f5f5f5;
                }
                .container { 
                    max-width: 650px; 
                    margin: 20px auto; 
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
                .content { padding: 30px; }
                .greeting { font-size: 18px; margin-bottom: 25px; }
                .section { margin: 25px 0; }
                .section-title { 
                    font-size: 18px; 
                    font-weight: 700; 
                    margin-bottom: 15px; 
                    padding: 12px 15px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .overdue-section .section-title { 
                    background: #fee2e2; 
                    color: #dc2626; 
                    border-left: 4px solid #dc2626;
                }
                .due-today-section .section-title { 
                    background: #fef3c7; 
                    color: #d97706; 
                    border-left: 4px solid #f59e0b;
                }
                .due-soon-section .section-title { 
                    background: #dbeafe; 
                    color: #2563eb; 
                    border-left: 4px solid #3b82f6;
                }
                .book-item { 
                    background: #f9fafb; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 8px; 
                    border-left: 3px solid #e5e7eb;
                }
                .book-title { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
                .book-details { font-size: 14px; color: #6b7280; }
                .cta-section { 
                    text-align: center; 
                    margin: 40px 0; 
                    padding: 30px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-radius: 12px;
                }
                .return-button { 
                    display: inline-block; 
                    padding: 18px 40px; 
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                    transition: all 0.3s ease;
                }
                .return-button:hover { 
                    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                }
                .footer { 
                    background: #f9fafb; 
                    padding: 25px 30px; 
                    text-align: center; 
                    border-top: 1px solid #e5e7eb;
                }
                .no-reply { 
                    background: #fef3c7; 
                    border: 1px solid #f59e0b; 
                    color: #92400e; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                    font-size: 14px;
                    text-align: center;
                }
                .summary-stats {
                    display: flex;
                    justify-content: space-around;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .stat-item {
                    text-align: center;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }
                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                @media (max-width: 600px) {
                    .container { margin: 10px; }
                    .content { padding: 20px; }
                    .summary-stats { flex-direction: column; gap: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 BookHive Daily Reminder</h1>
                    <p>${totalBooks} book${totalBooks > 1 ? 's' : ''} need${totalBooks === 1 ? 's' : ''} your attention</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hi <strong>${borrower.name}</strong>,
                    </div>
                    
                    <p>Here's your daily book return summary:</p>
                    
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-number">${overdueBooks.length}</div>
                            <div class="stat-label">Overdue</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${dueTodayBooks.length}</div>
                            <div class="stat-label">Due Today</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${dueSoonBooks.length}</div>
                            <div class="stat-label">Due Soon</div>
                        </div>
                    </div>

                    ${overdueBooks.length > 0 ? `
                    <div class="section overdue-section">
                        <div class="section-title">
                            🚨 OVERDUE BOOKS (${overdueBooks.length})
                        </div>
                        ${overdueBooks.map(book => {
                            const overdueDays = Math.abs(book.daysDiff);
                            const borrowedDate = new Date(book.borrowedDate || book.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    <strong>${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue</strong> • 
                                    Borrowed from ${book.owner.name} • 
                                    Borrowed on ${borrowedDate}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}

                    ${dueTodayBooks.length > 0 ? `
                    <div class="section due-today-section">
                        <div class="section-title">
                            ⏰ DUE TODAY (${dueTodayBooks.length})
                        </div>
                        ${dueTodayBooks.map(book => {
                            const borrowedDate = new Date(book.borrowedDate || book.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    <strong>Due today</strong> • 
                                    Borrowed from ${book.owner.name} • 
                                    Borrowed on ${borrowedDate}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}

                    ${dueSoonBooks.length > 0 ? `
                    <div class="section due-soon-section">
                        <div class="section-title">
                            📅 DUE IN 2 DAYS (${dueSoonBooks.length})
                        </div>
                        ${dueSoonBooks.map(book => {
                            const dueDate = new Date(book.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const borrowedDate = new Date(book.borrowedDate || book.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    Due ${dueDate} • 
                                    Borrowed from ${book.owner.name} • 
                                    Borrowed on ${borrowedDate}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="cta-section">
                        <a href="${clientUrl}/borrow-requests" class="return-button">
                            📚 Manage All Returns
                        </a>
                        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
                            Click above to view all your borrowed books and coordinate returns
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="no-reply">
                        ⚠️ <strong>DO NOT REPLY</strong> to this email. This is an automated message from BookHive.
                    </div>
                    <p style="margin: 15px 0 5px 0; color: #6b7280; font-size: 14px;">
                        Thank you for being a responsible member of BookHive!
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        <em>The BookHive Team</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: borrower.email,
        subject: emailSubject,
        html: emailContent,
        headers: {
            'Reply-To': 'noreply@bookhive.com',
            'X-Auto-Response-Suppress': 'All'
        }
    });
};


// Helper function to send consolidated email to owners
const sendConsolidatedOwnerEmail = async (owner, books) => {
    // Categorize books by urgency
    const overdueBooks = books.filter(b => b.reminderType === 'overdue');
    const dueTodayBooks = books.filter(b => b.reminderType === 'due_date');
    const dueSoonBooks = books.filter(b => b.reminderType === 'two_days_before');

    const totalBooks = books.length;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const emailSubject = `📚 BookHive Owner Update - ${totalBooks} Book${totalBooks > 1 ? 's' : ''} Status Update`;

    const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BookHive Owner Update</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f5f5f5;
                }
                .container { 
                    max-width: 650px; 
                    margin: 20px auto; 
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
                .content { padding: 30px; }
                .greeting { font-size: 18px; margin-bottom: 25px; }
                .section { margin: 25px 0; }
                .section-title { 
                    font-size: 18px; 
                    font-weight: 700; 
                    margin-bottom: 15px; 
                    padding: 12px 15px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .overdue-section .section-title { 
                    background: #fee2e2; 
                    color: #dc2626; 
                    border-left: 4px solid #dc2626;
                }
                .due-today-section .section-title { 
                    background: #fef3c7; 
                    color: #d97706; 
                    border-left: 4px solid #f59e0b;
                }
                .due-soon-section .section-title { 
                    background: #dbeafe; 
                    color: #2563eb; 
                    border-left: 4px solid #3b82f6;
                }
                .book-item { 
                    background: #f9fafb; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 8px; 
                    border-left: 3px solid #e5e7eb;
                }
                .book-title { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
                .book-details { font-size: 14px; color: #6b7280; }
                .cta-section { 
                    text-align: center; 
                    margin: 40px 0; 
                    padding: 30px;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    border-radius: 12px;
                }
                .view-button { 
                    display: inline-block; 
                    padding: 18px 40px; 
                    background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
                    transition: all 0.3s ease;
                }
                .view-button:hover { 
                    background: linear-gradient(135deg, #047857 0%, #065f46 100%); 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
                }
                .footer { 
                    background: #f9fafb; 
                    padding: 25px 30px; 
                    text-align: center; 
                    border-top: 1px solid #e5e7eb;
                }
                .no-reply { 
                    background: #fef3c7; 
                    border: 1px solid #f59e0b; 
                    color: #92400e; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                    font-size: 14px;
                    text-align: center;
                }
                .summary-stats {
                    display: flex;
                    justify-content: space-around;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .stat-item {
                    text-align: center;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }
                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                @media (max-width: 600px) {
                    .container { margin: 10px; }
                    .content { padding: 20px; }
                    .summary-stats { flex-direction: column; gap: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 BookHive Owner Update</h1>
                    <p>Status of your ${totalBooks} lent book${totalBooks > 1 ? 's' : ''}</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hi <strong>${owner.name}</strong>,
                    </div>
                    
                    <p>Here's the status of your lent books:</p>
                    
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-number">${overdueBooks.length}</div>
                            <div class="stat-label">Overdue Returns</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${dueTodayBooks.length}</div>
                            <div class="stat-label">Due Today</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${dueSoonBooks.length}</div>
                            <div class="stat-label">Due Soon</div>
                        </div>
                    </div>

                    ${overdueBooks.length > 0 ? `
                    <div class="section overdue-section">
                        <div class="section-title">
                            🚨 OVERDUE RETURNS (${overdueBooks.length})
                        </div>
                        ${overdueBooks.map(book => {
                            const overdueDays = Math.abs(book.daysDiff);
                            const dueDate = new Date(book.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    <strong>${book.borrower.name}</strong> • 
                                    ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue • 
                                    Was due ${dueDate}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}

                    ${dueTodayBooks.length > 0 ? `
                    <div class="section due-today-section">
                        <div class="section-title">
                            ⏰ DUE TODAY (${dueTodayBooks.length})
                        </div>
                        ${dueTodayBooks.map(book => {
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    <strong>${book.borrower.name}</strong> • 
                                    Due today • 
                                    Borrower has been notified
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}

                    ${dueSoonBooks.length > 0 ? `
                    <div class="section due-soon-section">
                        <div class="section-title">
                            📅 DUE SOON (${dueSoonBooks.length})
                        </div>
                        ${dueSoonBooks.map(book => {
                            const dueDate = new Date(book.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return `
                            <div class="book-item">
                                <div class="book-title">"${book.book.title}"</div>
                                <div class="book-details">
                                    <strong>${book.borrower.name}</strong> • 
                                    Due ${dueDate} • 
                                    Reminder sent to borrower
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="cta-section">
                        <a href="${clientUrl}/borrow-requests" class="view-button">
                            📊 View All Lending Activity
                        </a>
                        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
                            Click above to manage your lent books and contact borrowers
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="no-reply">
                        ⚠️ <strong>DO NOT REPLY</strong> to this email. This is an automated message from BookHive.
                    </div>
                    <p style="margin: 15px 0 5px 0; color: #6b7280; font-size: 14px;">
                        Thank you for sharing your books with the BookHive community!
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        <em>The BookHive Team</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: owner.email,
        subject: emailSubject,
        html: emailContent,
        headers: {
            'Reply-To': 'noreply@bookhive.com',
            'X-Auto-Response-Suppress': 'All'
        }
    });
};

// Helper function to create in-app notifications for borrowers
const createBorrowerNotifications = async (borrower, books, io) => {
    try {
        const overdueCount = books.filter(b => b.reminderType === 'overdue').length;
        const dueTodayCount = books.filter(b => b.reminderType === 'due_date').length;
        const dueSoonCount = books.filter(b => b.reminderType === 'two_days_before').length;

        let notificationMessage = '';
        let notificationType = 'due_reminder';

        if (overdueCount > 0) {
            notificationMessage = `${overdueCount} book${overdueCount > 1 ? 's are' : ' is'} overdue for return`;
            notificationType = 'due_reminder';
        } else if (dueTodayCount > 0) {
            notificationMessage = `${dueTodayCount} book${dueTodayCount > 1 ? 's are' : ' is'} due today`;
        } else if (dueSoonCount > 0) {
            notificationMessage = `${dueSoonCount} book${dueSoonCount > 1 ? 's are' : ' is'} due in 2 days`;
        }

        const notification = await Notification.create({
            userId: borrower._id,
            type: notificationType,
            title: 'Book Return Reminder',
            message: notificationMessage,
            metadata: {
                totalBooks: books.length,
                overdueCount,
                dueTodayCount,
                dueSoonCount,
                link: '/borrow-requests'
            }
        });

        // Send real-time notification
        if (io) {
            const notificationData = {
                id: notification._id,
                type: notificationType,
                message: notificationMessage,
                link: '/borrow-requests',
                createdAt: notification.createdAt,
                read: false
            };

            io.to(`user:${borrower._id}`).emit('new_notification', notificationData);
        }
    } catch (error) {
        console.error('Failed to create borrower notification:', error.message);
    }
};

// Helper function to create in-app notifications for owners
const createOwnerNotifications = async (owner, books, io) => {
    try {
        const overdueCount = books.filter(b => b.reminderType === 'overdue').length;
        const dueTodayCount = books.filter(b => b.reminderType === 'due_date').length;
        const dueSoonCount = books.filter(b => b.reminderType === 'two_days_before').length;

        let notificationMessage = '';
        if (overdueCount > 0) {
            notificationMessage = `${overdueCount} of your lent book${overdueCount > 1 ? 's are' : ' is'} overdue`;
        } else if (dueTodayCount > 0) {
            notificationMessage = `${dueTodayCount} of your lent book${dueTodayCount > 1 ? 's are' : ' is'} due today`;
        } else if (dueSoonCount > 0) {
            notificationMessage = `${dueSoonCount} of your lent book${dueSoonCount > 1 ? 's are' : ' is'} due soon`;
        }

        const notification = await Notification.create({
            userId: owner._id,
            type: 'borrower_reminder',
            title: 'Lending Status Update',
            message: notificationMessage,
            metadata: {
                totalBooks: books.length,
                overdueCount,
                dueTodayCount,
                dueSoonCount,
                link: '/borrow-requests'
            }
        });

        // Send real-time notification
        if (io) {
            const notificationData = {
                id: notification._id,
                type: 'borrower_reminder',
                message: notificationMessage,
                link: '/borrow-requests',
                createdAt: notification.createdAt,
                read: false
            };

            io.to(`user:${owner._id}`).emit('new_notification', notificationData);
        }
    } catch (error) {
        console.error('Failed to create owner notification:', error.message);
    }
};

// Helper function to update reminder tracking
const updateReminderTracking = async (books) => {
    for (const book of books) {
        try {
            const request = await BorrowRequest.findById(book._id);
            if (request) {
                request.remindersSent += 1;
                request.lastReminderDate = new Date();
                
                if (!request.reminderHistory) {
                    request.reminderHistory = [];
                }
                request.reminderHistory.push({
                    type: book.reminderType,
                    sentAt: new Date(),
                    daysDiff: book.daysDiff
                });
                
                await request.save();
            }
        } catch (error) {
            console.error(`Failed to update reminder tracking for book ${book._id}:`, error.message);
        }
    }
};