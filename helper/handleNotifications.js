const admin = require("firebase-admin")
const Patient = require("../models/patientModel");
const cron = require('node-cron');

// // Function to schedule a reminder notification
// const scheduleReminder = (remindAt, patientId, doctorId, appointmentDetails) => {
//     const reminderCronPattern = `${remindAt.getMinutes()} ${remindAt.getHours()} ${remindAt.getDate()} ${remindAt.getMonth() + 1} *`; // cron format

//     // Schedule the job
//     cron.schedule(reminderCronPattern, async () => {
//         const patient = await Patient.findById(patientId);
//         const fcmToken = patient.fcmToken;
//         const notificationMessage = `Reminder: Your appointment with Dr. ${doctorId} is at ${appointmentDetails.time} on ${appointmentDetails.date}.`;

//         // Send reminder notification
//         sendNotification(fcmToken, "Appointment Reminder", notificationMessage);
//     });
// };

// Schedule a reminder notification
const scheduleReminder = (remindAt, fcmToken, message) => {
    const reminderCronPattern = `${remindAt.getMinutes()} ${remindAt.getHours()} ${remindAt.getDate()} ${remindAt.getMonth() + 1} *`;

    cron.schedule(reminderCronPattern, () => {
        sendNotification(fcmToken, "Appointment Reminder", message);
    });
};

// Send Notification via Firebase
const sendNotification = async (fcmToken, title, message) => {
    try {
        console.log("Sending to FCM Token:", fcmToken); // Check if the token is valid here
        const messagePayload = {
            notification: { title, body: message },
            token: fcmToken,
        };
        await admin.messaging().send(messagePayload);
        console.log("Notification sent successfully");
    } catch (error) {
        console.error("Error sending notification:", error);
        if (error.errorInfo.code === 'messaging/invalid-argument') {
            console.error("Invalid FCM token. Please check the token.");
        }
    }
};


module.exports = { sendNotification, scheduleReminder }