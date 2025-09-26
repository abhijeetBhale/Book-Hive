import BorrowRequest from '../models/BorrowRequest.js';
import { sendEmail } from './emailService.js';

export const sendOverdueReminders = async () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    try {
        const requestsDueSoon = await BorrowRequest.find({
            status: 'borrowed',
            dueDate: {
                $gte: new Date(),
                $lte: threeDaysFromNow
            },
            remindersSent: { $eq: 0 } // Only send one reminder
        }).populate('book borrower owner');

        if (requestsDueSoon.length === 0) {
            console.log('No reminders to send today.');
            return;
        }

        for (const request of requestsDueSoon) {
            const dueDate = new Date(request.dueDate).toLocaleDateString();
            const emailHtml = `
                <h1>Book Return Reminder</h1>
                <p>Hi ${request.borrower.name},</p>
                <p>This is a friendly reminder that the book "<strong>${request.book.title}</strong>" you borrowed from ${request.owner.name} is due on <strong>${dueDate}</strong>.</p>
                <p>Please make arrangements to return it on time.</p>
                <p>Thanks,</p>
                <p>The BookHive Team</p>
            `;

            await sendEmail({
                to: request.borrower.email,
                subject: `Reminder: Your borrowed book is due soon!`,
                html: emailHtml,
            });

            // Mark reminder as sent
            request.remindersSent = 1;
            request.lastReminderDate = new Date();
            await request.save();
        }

        console.log(`Sent ${requestsDueSoon.length} due date reminders.`);
    } catch (error) {
        console.error('Error in reminder service:', error);
    }
};