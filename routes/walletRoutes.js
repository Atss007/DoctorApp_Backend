const express = require("express");
const authenticate = require("../middlewares/authentication");
const { createWallet, getMyWallet, creditWallet, debitWallet, getTransactionHistory } = require("../controllers/walletController");
const router = express.Router();


// create wallet: 
router.post("/createWallet", createWallet);

// get my wallet: 
router.get("/getMyWallet", authenticate, getMyWallet);

// credit wallet: 
router.put("/creditWallet", authenticate, creditWallet);

// debit wallet: 
router.put("/debitWallet", authenticate, debitWallet);

// get transactions history: 
router.get("/getMyTransactions", authenticate, getTransactionHistory);

module.exports = router;