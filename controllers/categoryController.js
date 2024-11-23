const multer = require("multer");
const { upload } = require("../middlewares/multer");
const Category = require("../models/categoryModel");
const { cloudinary } = require("../config/cloudinary");

// ADD CATEGORY:
module.exports.createCategory = async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.log("multer error: ", err)
            return res.status(400).json({
                success: false,
                message: "File size too large.. Maximum size is 1MB only."
            });
        } else if (err) {
            console.log("error 02: ", err)
            return res.status(400).json({
                success: false,
                message: "Error uploading image",
                error: err
            })
        }
        try {
            const { name, type } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a name"
                })
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file provided"
                });
            }

            const category = await Category.findOne({ name: name });
            if (category) {
                return res.status(400).json({
                    success: false,
                    message: "Category withh this name already exists"
                })
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "category_images",
                public_id: `${name}`,
            })

            const newCategory = new Category({
                name,
                type,
                categoryImage: {
                    key: req.file.filename,
                    url: result.secure_url
                }
            })

            await newCategory.save();

            return res.status(201).json({
                success: true,
                message: "Category added!!"
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}



// FETCH CATEGORIES: 
module.exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        if (categories.length == 0) {
            return res.status(404).json({
                success: false,
                message: "No Categories"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Categories fetched",
            categories
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Edit Category: 
module.exports.EditCategory = async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: "File size too large.. Maximum size is 1MB only."
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: "Error uploading image",
                error: err
            })
        }
        try {
            const { id } = req.user;

            // const { userId } = req.params
            // console.log("user id: ", userId);

            // const user = await User.findById(userId);
            const category = await Category.findById(id);

            if (!category) {
                return res.status(404).json({
                    message: "User not found"
                })
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "File not provided"
                })
            }

            category.image = {
                key: req.file.filename,
                url: `/uploads/${req.file.filename}`
            }
            await category.save();

            // console.log("user profile image: ", user.profileImg);

            return res.status(200).json({
                success: true,
                message: "category edited..",
                category
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}