const express = require("express");
const { addDoctorDetails, doctorProfile, searchDoctor, searchDoctorByCategory, filterDoctors, confirmAppointment, updateDoctorFCMToken, register, verifyOTP, doctorLogin, getAllDoctors } = require("../controllers/doctorController");
const authenticate = require("../middlewares/authentication");
const router = express.Router();

// Login: 
router.post("/login", doctorLogin);

// Verify OTP: 
router.post("/verifyOTP/:userId", verifyOTP);

// Add Doctor details: 
router.post("/addDoctorDetails/:userId", addDoctorDetails);

router.get("/allDoctors", getAllDoctors);

// Get the profile of a doctor: 
router.get("/doctorProfile/:doctorId", authenticate, doctorProfile);

// Search doctors
router.post("/searchDoctor", authenticate, searchDoctor);

// Search doctors by category: 
router.post("/searchDoctorByCategory", authenticate, searchDoctorByCategory);

// Filter Doctors: 
router.post("/filterDoctors", authenticate, filterDoctors);


// Update FCM Token: 
router.post("/updateDoctorFCMToken", authenticate, updateDoctorFCMToken);

// Confirm a patient's appointment: 
router.post("/confirmOrRejectAppointment", confirmAppointment)

module.exports = router;