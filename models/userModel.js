const mongoose = require('mongoose');
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");
const Wallet = require("../models/walletModel")

const userSchema = mongoose.Schema({
    name: {
        type: String,
        // required: true,
    },
    email: {
        type: String,
        // required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        // required: true,
    },
    role: {
        type: String,
        enum: ['Patient', 'Doctor'],
        // required: true,
        default: 'Patient'
    },
    phoneNo: {
        type: String,
        // required: true,
    },
    city: {
        type: String,
        // required: true,
    },
    profileImg: {
        key: {
            type: String,
        },
        url: {
            type: String,
        }
    },
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
    }
})

// After saving a new user, automatically create their wallet with default values: 
userSchema.post('save', async function (doc, next) {
    try {
        // create a new wallet for the user: 
        const newWallet = new Wallet({
            userId: doc._id,
            balance: 0,
            transactionHistory: []
        });

        // save the wallet: 
        await newWallet.save();
        next();
    } catch (error) {
        next(error)
    }
})

const userModel = mongoose.model('userModel', userSchema);
module.exports = userModel;