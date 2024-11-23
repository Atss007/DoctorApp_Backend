const express = require("express");
const { createCategory, getCategories } = require("../controllers/categoryController");
const router = express.Router();

// Add Category:
router.post("/addCategory", createCategory);

// Get Categories: 
router.get("/getCategories", getCategories);

module.exports = router;
