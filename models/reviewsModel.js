const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorModel'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patientModel',
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const reviewModel = mongoose.model('reviewModel', reviewSchema);

module.exports = reviewModel;