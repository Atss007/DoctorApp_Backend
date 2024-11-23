const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PatientModel',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorModel',
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    // meetingType: {
    //     type: String,
    //     enum: ['Video', 'Voice', 'In-Person'],
    //     required: true,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    remindMeBefore: {
        type: String,
    },
    updatedAt: {
        type: Date,
    }
});

const appointmentModel = mongoose.model('appointmentModel', appointmentSchema);

module.exports = appointmentModel;