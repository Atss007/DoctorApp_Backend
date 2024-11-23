const Review = require("../models/reviewsModel");

// Add Review For a doctor: 
module.exports.addReview = async (req, res) => {
    try {
        // const { patientId } = req.user._id;
        const userId = req.user._id;
        const { doctorId } = req.params;
        const { rating, comment } = req.body;

        const review = new Review({
            patientId: userId,
            doctorId,
            rating,
            comment,
        })
        await review.save();
        return res.status(201).json({
            success: true,
            message: "Review added for the doctor!!",
            review
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Get Reviews of a doctor: 
module.exports.getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const reviews = await Review.find({ doctorId: doctorId });
        if (reviews.lenth === 0) {
            return res.status(404).json({
                success: false,
                message: "No reviews found for the doctor"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Reviews fetched!!",
            reviews
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}