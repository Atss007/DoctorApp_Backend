const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patientModel',
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorModel',
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,  // Detailed message for the notification
    },
    notificationType: {
        type: String,
        enum: ['appointment', 'message', 'reminder', 'alert', 'update', 'general'],
        default: 'general',
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'read', 'archived'],
        default: 'sent',
    },
    remindAt: {
        type: String,
    },
    readAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    fcmToken: {
        type: String,  // Store the FCM token for push notifications targeting
    },
})

const notificationModel = mongoose.model('notificationModel', notificationSchema);

module.exports = notificationModel;