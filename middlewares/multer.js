const multer = require("multer");
const path = require("path");

const maxProfileSize = 1 * 1000 * 1000 // 1mb
const maxFileSize = 2 * 1000 * 1000     // 2mb

// storage engine: 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

// FOR PROFILE IMAGE: 
module.exports.upload = multer({
    storage: storage,
    limits: { fileSize: maxProfileSize },
    fileFilter: (req, file, cb) => {
        checkImageType(file, cb);
    }
}).single('profileImage');

// FOR CATEGORY IMAGES: 
module.exports.upload = multer({
    storage: storage,
    limits: { fileSize: maxProfileSize },
    fileFilter: (req, file, cb) => {
        checkImageType(file, cb);
    }
}).single('categoryImage');


// FOR MEDICAL RECORDS:  
module.exports.uploadMedicalRecords = multer({
    storage: storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('medicalFiles', 5);        // can store upto 5 files


function checkImageType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    // console.log("extension: ", path.extname(file.originalname).toLowerCase());
    // console.log("mimetype: ", file.mimetype)

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Invalid file type.. should be in jpg/jpeg/png format');
    }
}

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Invalid file type! Only JPG, JPEG, PNG, or PDF allowed.');
    }
}