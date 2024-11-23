const admin = require('firebase-admin');
const express = require('express');
const serviceAccount = require('../firebase/serviceAccount.json');  // Path to your service account JSON file
const { getPatientNotifications, getDoctorNotifications, patientUnreadNotifications, markNotificationAsRead } = require('../controllers/notificationController');
const authenticate = require("../middlewares/authentication");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const router = express.Router();

// Get a patient's notifications: 
router.get("/getPatientNotifications", authenticate, getPatientNotifications);

// Get patient's unread notifications: 
router.get("/getUnreadNotifications", authenticate, patientUnreadNotifications);

// Mark notification as read: 
router.put("/markNotificationAsRead/:notificationId", authenticate, markNotificationAsRead);

// Get a doctor's notifications: 
router.get("/getDoctorNotifications/:doctorId", getDoctorNotifications);

module.exports = router;