const express = require("express");
const { addPatientDetails, register, login, verifyOTP, sendVerifyEmailLink, verifyEmail, googleLogin, logout, uploadProfilePic, addPreProvidedImage, updateFCMToken, markDoctorFavorite, getFavorites, sendVerifyEmailOTP, editProfile, deleteAccount, addFamilyMembers, getFamilyMembers, getSingleMember, editMemberDetails, addMedicalRecords, deleteMedicalRecord, getAllRecords, getSingleRecord, getRecordsByType } = require("../controllers/patientController");
const { validate } = require("../middlewares/validate");
const { registerValidator, loginValidator } = require("../validator/userValidator");
const authenticate = require("../middlewares/authentication");
const router = express.Router();

// user register: 
router.post("/register/:userId", validate(registerValidator), register);

// user login: 
router.post("/login", validate(loginValidator), login);

// verify otp: 
router.post("/verifyOTP/:userId", verifyOTP);

// Google login: 
router.post('/google-login', googleLogin);

// Send OTP For email verification:
router.post("/sendVerifyEmailOTP/:userId", sendVerifyEmailOTP);

// Upload profile picture: 
router.post("/uploadProfilePicture/:userId", uploadProfilePic);

// Edit user profile (picture and details): 
router.put("/editProfile", authenticate, editProfile);

// Delete user account: 
router.delete("/deleteAccount", authenticate, deleteAccount);

// Mark A Doctor As Favorite: 
router.post("/markDoctorFavorite/:doctorId", authenticate, markDoctorFavorite);

// Get Favorite Doctors: 
router.get("/getFavorites", authenticate, getFavorites);

// Add family member: 
router.post("/addFamilyMember", authenticate, addFamilyMembers);

// Get all family members: 
router.get("/getFamilyMembers", authenticate, getFamilyMembers);

// Get single member details: 
router.get("/getSingleMember", authenticate, getSingleMember);

// Edit member details: 
router.put("/editMemberDetails", authenticate, editMemberDetails);

// Add medical records: 
router.post("/addMedicalRecords", authenticate, addMedicalRecords);

// Get All Medical Records Of User: 
router.get("/getAllRecords", authenticate, getAllRecords);

// Get Single Medical Record: 
router.get("/getSingleRecord/:recordId", authenticate, getSingleRecord);

// Get records by type: 
router.get("/getRecordsByType", authenticate, getRecordsByType);

// Delete a medical record: 
router.delete("/deleteRecord/:recordId", authenticate, deleteMedicalRecord);

// Logout:
router.post("/logout", logout);

// Update FCM Token: 
router.post("/updateFCMToken", authenticate, updateFCMToken);

// router.post("/addPreProvidedImage", addPreProvidedImage);

// router.post("/addPatientDetails", authenticate, addPatientDetails);

// send verify email link:
// router.post("/sendVerifyEmailLink/:userId", sendVerifyEmailLink);

// verify email: 
// router.get("/verifyEmail/:token", verifyEmail);


module.exports = router;