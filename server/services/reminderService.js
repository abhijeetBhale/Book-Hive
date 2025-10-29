import BorrowRequest from '../models/BorrowRequest.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './emailService.js';

export const sendOverdueReminders = async (io = null) => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const now = new Date();

    try {
        // Find books due in 3 days (first reminder)
        const requestsDueSoon = await BorrowRequest.find({
            status: 'borrowed',
            dueDate: {
                $gte: new Date(),
                $lte: threeDaysFromNow
            },
            remindersSent: { $eq: 0 }
        }).populate('book borrower owner');

        // Find books due tomorrow (second reminder)
        const requestsDueTomorrow = await BorrowRequest.find({
            status: 'borrowed',
            dueDate: {
                $gte: new Date(),
                $lte: oneDayFromNow
            },
            remindersSent: { $eq: 1 }
        }).populate('book borrower owner');

        // Find overdue books
        const overdueRequests = await BorrowRequest.find({
            status: 'borrowed',
            dueDate: { $lt: now },
            remindersSent: { $lt: 3 } // Send up to 3 overdue reminders
        }).populate('book borrower owner');

        const allReminders = [
            ...requestsDueSoon.map(req => ({ ...req.toObject(), reminderType: 'due_soon' })),
            ...requestsDueTomorrow.map(req => ({ ...req.toObject(), reminderType: 'due_tomorrow' })),
            ...overdueRequests.map(req => ({ ...req.toObject(), reminderType: 'overdue' }))
        ];

        if (allReminders.length === 0) {
            console.log('No reminders to send today.');
            return;
        }

        for (const request of allReminders) {
            const dueDate = new Date(request.dueDate).toLocaleDateString();
            const daysDiff = Math.ceil((new Date(request.dueDate) - now) / (1000 * 60 * 60 * 24));
            
            let emailSubject, emailContent, notificationTitle, notificationMessage;

            if (request.reminderType === 'due_soon') {
                emailSubject = `Reminder: Book due in ${daysDiff} days`;
                notificationTitle = 'Book Due Soon';
                notificationMessage = `"${request.book.title}" is due in ${daysDiff} days`;
                emailContent = `
                    <h1>Book Return Reminder</h1>
                    <p>Hi ${request.borrower.name},</p>
                    <p>This is a friendly reminder that the book "<strong>${request.book.title}</strong>" you borrowed from ${request.owner.name} is due in <strong>${daysDiff} days</strong> (${dueDate}).</p>
                    <p>Please make arrangements to return it on time.</p>
                    <p>Thanks,</p>
                    <p>The BookHive Team</p>
                `;
            } else if (request.reminderType === 'due_tomorrow') {
                emailSubject = `Urgent: Book due tomorrow!`;
                notificationTitle = 'Book Due Tomorrow';
                notificationMessage = `"${request.book.title}" is due tomorrow!`;
                emailContent = `
                    <h1>Urgent: Book Due Tomorrow!</h1>
                    <p>Hi ${request.borrower.name},</p>
                    <p><strong>Important:</strong> The book "<strong>${request.book.title}</strong>" you borrowed from ${request.owner.name} is due <strong>tomorrow</strong> (${dueDate}).</p>
                    <p>Please return it as soon as possible to avoid any late fees.</p>
                    <p>Thanks,</p>
                    <p>The BookHive Team</p>
                `;
            } else if (request.reminderType === 'overdue') {
                const overdueDays = Math.abs(daysDiff);
                emailSubject = `Overdue: Book return required`;
                notificationTitle = 'Book Overdue';
                notificationMessage = `"${request.book.title}" is ${overdueDays} days overdue`;
                emailContent = `
                    <h1>Overdue Book Return</h1>
                    <p>Hi ${request.borrower.name},</p>
                    <p><strong>Urgent:</strong> The book "<strong>${request.book.title}</strong>" you borrowed from ${request.owner.name} was due on ${dueDate} and is now <strong>${overdueDays} days overdue</strong>.</p>
                    <p>Please return it immediately to maintain your good standing in the BookHive community.</p>
                    <p>Thanks,</p>
                    <p>The BookHive Team</p>
                `;
            }

            // Send email notification
            try {
                await sendEmail({
                    to: request.borrower.email,
                    subject: emailSubject,
                    html: emailContent,
                });
            } catch (emailError) {
                console.error('Failed to send email reminder:', emailError);
            }

            // Create in-app notification for borrower
            try {
                const borrowerNotification = await Notification.create({
                    userId: request.borrower._id,
                    type: 'due_reminder',
                    title: notificationTitle,
                    message: notificationMessage,
                    metadata: {
                        bookId: request.book._id,
                        requestId: request._id,
                        dueDate: request.dueDate,
                        daysDiff: daysDiff,
                        link: '/borrow-requests'
                    }
                });

                // Send real-time notification to borrower
                if (io) {
                    const notificationData = {
                        id: borrowerNotification._id,
                        type: 'due_reminder',
                        message: notificationMessage,
                        book: {
                            _id: request.book._id,
                            title: request.book.title,
                            coverImage: request.book.coverImage
                        },
                        link: '/borrow-requests',
                        createdAt: borrowerNotification.createdAt,
                        read: false
                    };

                    io.to(`user:${request.borrower._id}`).emit('new_notification', notificationData);
                }
            } catch (notificationError) {
                console.error('Failed to create in-app notification:', notificationError);
            }

            // Create notification for lender (owner)
            try {
                let lenderMessage;
                if (request.reminderType === 'overdue') {
                    const overdueDays = Math.abs(daysDiff);
                    lenderMessage = `${request.borrower.name} has an overdue book: "${request.book.title}" (${overdueDays} days overdue)`;
                } else {
                    lenderMessage = `Reminder sent to ${request.borrower.name} about "${request.book.title}" due ${request.reminderType === 'due_tomorrow' ? 'tomorrow' : `in ${daysDiff} days`}`;
                }

                const lenderNotification = await Notification.create({
                    userId: request.owner._id,
                    type: 'borrower_reminder',
                    title: 'Borrower Reminder Sent',
                    message: lenderMessage,
                    metadata: {
                        bookId: request.book._id,
                        requestId: request._id,
                        borrowerId: request.borrower._id,
                        dueDate: request.dueDate,
                        daysDiff: daysDiff,
                        link: '/borrow-requests'
                    }
                });

                // Send real-time notification to lender
                if (io) {
                    const lenderNotificationData = {
                        id: lenderNotification._id,
                        type: 'borrower_reminder',
                        message: lenderMessage,
                        book: {
                            _id: request.book._id,
                            title: request.book.title,
                            coverImage: request.book.coverImage
                        },
                        borrower: {
                            _id: request.borrower._id,
                            name: request.borrower.name,
                            avatar: request.borrower.avatar
                        },
                        link: '/borrow-requests',
                        createdAt: lenderNotification.createdAt,
                        read: false
                    };

                    io.to(`user:${request.owner._id}`).emit('new_notification', lenderNotificationData);
                }
            } catch (lenderNotificationError) {
                console.error('Failed to create lender notification:', lenderNotificationError);
            }

            // Update reminder count
            const originalRequest = await BorrowRequest.findById(request._id);
            originalRequest.remindersSent += 1;
            originalRequest.lastReminderDate = new Date();
            await originalRequest.save();
        }

        console.log(`Sent ${allReminders.length} reminders (${requestsDueSoon.length} due soon, ${requestsDueTomorrow.length} due tomorrow, ${overdueRequests.length} overdue).`);
    } catch (error) {
        console.error('Error in reminder service:', error);
    }
};