const mongoose = require('mongoose');
const Wallet = require("../models/walletModel")

const patientSchema = mongoose.Schema({
    // userId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'userModel',
    //     required: true,
    // },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    phoneNo: {
        type: String,
        // required: true,
    },
    city: {
        type: String,
        // required: true,
    },
    profileImage: {
        key: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    preProvidedImages: [
        {
            key: { type: String },   // Optional key (could be used for cloud storage if needed)
            url: { type: String }    // URL of the pre-provided image
        }
    ],
    birthDate: {
        type: Date,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isNewUser: {
        type: Boolean,
        default: true,
    },
    fcmToken: {
        type: String,  // Store the FCM token as a string
        default: null, // Default value can be null
    },
    emergencyContactName: {
        type: String,
    },
    emergencyContactPhone: {
        type: String,
    },
    emergencyContactRelation: {
        type: String,
    },
    favoriteDoctors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'doctorModel'
        }
    ],
    familyMembers: [
        {
            name: { type: String },
            relation: { type: String },
            phoneNo: { type: String },
            gender: { type: String },
            birthDate: { type: String },
        }
    ],
    medicalRecords: [
        {
            doctor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'doctorModel'
            },
            recordType: { type: String },
            date: {
                type: Date,
                default: Date.now,
            },
            attachments: [
                {
                    key: { type: String },
                    url: { type: String },
                    fileType: { type: String }
                }
            ]
        }
    ]
})

patientSchema.pre('save', async function (next) {
    if (this.isNew) { // Only create a wallet for new patients
        const existingWallet = await Wallet.findOne({ userId: this._id });
        if (!existingWallet) {
            const newWallet = new Wallet({
                userId: this._id,
                balance: 0,
                transactionHistory: []
            });
            await newWallet.save();
        }
    }
    next();
});


// // After saving a new user, automatically create their wallet with default values: 
// patientSchema.post('save', async function (doc, next) {
//     try {
//         const existingWallet = await Wallet.findOne({ userId: doc._id });
//         if (!existingWallet) {
//             // Create a new wallet only if one doesn't exist
//             const newWallet = new Wallet({
//                 userId: doc._id,
//                 balance: 0,
//                 transactionHistory: []
//             });
//             await newWallet.save();
//         }
//         next();
//     } catch (error) {
//         next(error)
//     }
// })

const patientModel = mongoose.model('patientModel', patientSchema);

module.exports = patientModel;
