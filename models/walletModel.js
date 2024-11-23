const mongoose = require('mongoose');
const User = require("../models/userModel");

const walletSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel',
        required: true,
        unique: true, // Ensures each user has only one wallet
    },
    balance: {
        type: Number,
        required: true,
        default: 0, // Starts with a balance of zero
    },
    transactionHistory: [
        {
            transactionType: {
                type: String,
                enum: ['Credit', 'Debit'], // Defines the type of transaction
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now, // Automatically sets the transaction date
            },
            // description: {
            //     type: String,
            // },
        },
    ],
});

// Model for Wallet
const walletModel = mongoose.model('walletModel', walletSchema);

module.exports = walletModel;
