const express = require("express");
const { login, register, verifyOTP, sendVerifyEmailLink, uploadProfilePic, verifyEmail, deleteUser } = require("../controllers/userController");
const { validate } = require("../middlewares/validate");
const { registerValidator, loginValidator } = require("../validator/userValidator");
const authenticate = require("../middlewares/authentication");
const router = express.Router();


// // user register: 
// router.post("/register/:userId", validate(registerValidator), register);

// // user login: 
// router.post("/login", validate(loginValidator), login);

// // verify otp: 
// router.post("/verifyOTP/:userId", verifyOTP);

// // send verify email link:
// router.post("/sendVerifyEmailLink/:userId", sendVerifyEmailLink);

// // verify email: 
// router.get("/verifyEmail/:token", verifyEmail);

// upload (or edit) profile image: 
router.post("/uploadProfilePicture", authenticate, uploadProfilePic);

// Delete user: 
router.delete("/deleteUser/:userId", authenticate, deleteUser);

router.get('/verification-success', (req, res) => {
    res.render('verification-success'); // Ensure this view exists
});

router.get('/verification-failure', (req, res) => {
    res.render('verification-failure'); // Ensure this view exists
});

module.exports = router;