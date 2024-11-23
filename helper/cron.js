// notificationScheduler.js
const cron = require("node-cron");
const Notification = require("../models/notificationModel");
const Appointment = require("../models/appointmentModel");
const { sendNotification } = require("../helper/handleNotifications");

// Schedule reminders every minute (adjust interval as needed)
const scheduleReminderNotifications = () => {
    cron.schedule("* * * * *", async () => {
        const now = new Date(); // Get the current time at the start of each cron job execution

        const notifications = await Notification.find({
            notificationType: "reminder",
            status: "pending", // Only fetch unsent reminders
            remindAt: { $lte: now }, // Reminder time is less than or equal to current time
        });

        notifications.forEach(async (notification) => {
            const { patientId, title, message, fcmToken } = notification;

            // Send FCM Notification
            await sendNotification(fcmToken, title, message);

            // Mark as sent to avoid re-sending
            await Notification.findByIdAndUpdate(notification._id, { status: "sent" });
        });
    });
};

// Cron job to delete notifications older than 7 days:
const deleteOldNotifications = () => {
    // Cron that runs every midnight: 
    cron.schedule("0 0 * * *", async () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

        try {
            const deletedNotifications = await Notification.deleteMany({
                createdAt: { $lte: sevenDaysAgo }         // Deletes notifications created more than 7 days ago..
            });
            console.log(`Deleted ${deletedNotifications.deletedCount} old notifications.`);
        } catch (error) {
            console.error("Error deleting old notifications:", error);
        }
    })
}

// Delete appointments older than one month: 
const deleteOldAppointments = () => {
    cron.schedule("0 0 * * *", async () => {
        const now = new Date();

        const oneMonthAgo = new Date(); // Create a new date object
        oneMonthAgo.setMonth(now.getMonth() - 1); // Calculate one month ago

        // console.log("One month ago:", oneMonthAgo);

        try {
            const deletedAppointments = await Appointment.deleteMany({
                date: { $lte: oneMonthAgo }
            });
            console.log(`Deleted ${deletedAppointments.deletedCount} old appointments..`)
        } catch (error) {
            console.error("Error deleting old appointments:", error);
        }
    })
}

// Initialize the cron jobs when the app starts
const initializeCronJobs = () => {
    scheduleReminderNotifications();
    deleteOldNotifications();
    deleteOldAppointments();
};

module.exports = { initializeCronJobs };