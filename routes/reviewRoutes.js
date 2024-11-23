const express = require("express");
const { addReview, getDoctorReviews } = require("../controllers/reviewController");
const authenticate = require("../middlewares/authentication")
const router = express.Router();


// ADD REVIEW: 
router.post("/addReview/:doctorId", authenticate, addReview);

// GET REVIEWS OF A DOCTOR: 
router.get("/getDoctorReviews/:doctorId", authenticate, getDoctorReviews)

module.exports = router;