const mongoose = require("mongoose");
const doctorSchema = mongoose.Schema({
    doctorName: {
        type: String,
    },
    phoneNoOne: {
        type: String
    },
    phoneNoTwo: {
        type: String,
    },
    email: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    city: {
        type: String,
    },
    consultationFee: {
        type: Number,
    },
    experience: {
        type: String
    },
    education: {
        type: String,
    },
    addressOne: {
        type: String
    },
    addressTwo: {
        type: String,
    },
    registrations: {
        type: String,
    },
    availableTime: {
        type: String,
    },
    specialization: {
        type: String,
    },
    fcmToken: {
        type: String,
    },
    about: {
        type: String,
    }
});


const doctorModel = mongoose.model('doctorModel', doctorSchema);

module.exports = doctorModel;






// const mongoose = require('mongoose');

// const doctorSchema = mongoose.Schema({
//     // userId: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'userModel',
//     //     required: true,
//     // },
//     doctorName: {
//         type: String,
//     },
//     gender: {
//         type: String,
//         enum: ['Male', 'Female', 'Other'],
//     },
//     city: {
//         type: String
//     },
//     phoneNo: {

//     },
//     consultationFee: {
//         type: Number,
//     },
//     experience: {
//         type: Number,
//         // required: true,
//     },
//     qualificationOne: {
//         // degrees or certificates
//         type: String,
//         // required: true,
//     },
//     qualificationTwo: {
//         // degrees or certificates
//         type: String,
//         // required: true,
//     },
//     specializationOne: {
//         type: String,
//         // required: true,
//     },
//     specializationTwo: {
//         type: String,
//         // required: true,
//     },
//     availableHours: {
//         type: Array,
//         // required: true,
//     },
//     serviceOne: {
//         type: String
//     },
//     serviceTwo: {
//         type: String
//     },
//     serviceThree: {
//         type: String
//     },
//     ratings: {
//         type: Number,
//         default: 0,
//     },
//     liveStatus: {
//         type: Boolean,
//         default: false
//     }, // Indicates if the doctor is currently live streaming
//     isNewDoctor: {
//         type: Boolean,
//         default: true,
//     },
//     fcmToken: {
//         type: String,  // Store the FCM token as a string
//         default: null, // Default value can be null
//     },
// })


// const doctorModel = mongoose.model('doctorModel', doctorSchema);

// module.exports = doctorModel;