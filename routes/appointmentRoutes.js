const express = require("express");
const authenticate = require("../middlewares/authentication");
const { scheduleAppointment, getMyAppointments, updateAppointment, cancelAppointment } = require("../controllers/appointmentController");
const router = express.Router();

// Schedule an appointment: 
router.post("/scheduleAppointment/:doctorId", authenticate, scheduleAppointment);

// Get my appointments: 
router.get("/getMyAppointments", authenticate, getMyAppointments);

// Update Appointment: 
router.put("/updateAppointment/:appointmentId", authenticate, updateAppointment);

// Cancel Appointment: 
router.put("/cancelAppointment/:appointmentId", authenticate, cancelAppointment);

module.exports = router;