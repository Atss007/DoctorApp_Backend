const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Function to upload images to cloudinary: 
async function uploadImage(imagePath) {
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'samples',
        });
        console.log("ImAage uploaded successfully: ", result.url);
        return result.url;
    } catch (error) {
        console.log("Error uploading image: ", error);
    }
}

module.exports = { cloudinary, uploadImage };