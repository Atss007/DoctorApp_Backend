const Patient = require("../models/patientModel");
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const Appointment = require("../models/appointmentModel");
const Token = require("../models/tokenModel");
const Doctor = require("../models/doctorModel");
const Notification = require("../models/notificationModel");
const Wallet = require("../models/walletModel");
const Review = require("../models/reviewsModel");
const { generateToken, generateOTP, generateEmailVerificationToken } = require("../helper/generate");
const { sendVerificationMail } = require("../helper/sendEmail");
const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
const { upload, uploadMedicalRecords } = require("../middlewares/multer");
const { default: mongoose } = require("mongoose");

// USER REGISTRATION: (PATIENT)
module.exports.register = async (req, res) => {
    try {
        const { userId } = req.params;
        // getting user details: 
        const { name, email, phoneNo, gender, birthDate, city, emergencyContactName, emergencyContactPhone, emergencyContactRelation } = req.body;

        // creating record for user(patient): 
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        // UPDATE USER DETAILS: 
        patient.name = name;
        patient.email = email;
        patient.gender = gender;
        patient.phoneNo = phoneNo;
        patient.birthDate = birthDate;
        patient.city = city;
        patient.isNewUser = false;

        await patient.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully!!",
            patient
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// USER LOGIN WITH PHONE NUMBER:
module.exports.login = async (req, res) => {
    try {
        // Getting user's phone no: 
        const { phoneNo } = req.body;
        console.log("phone no: ", phoneNo);

        // finding user with phone no: 
        let patient = await Patient.findOne({ phoneNo });

        // if user is not found; a new user record (with phone no) will be created and saved to DB; and OTP will be sent to continue:  
        if (!patient) {
            const newPatient = new Patient({ phoneNo });
            await newPatient.save();

            // Assign the newly created patient to the `patient` variable
            patient = newPatient;

            console.log("New patient created:", newPatient);
        }

        // if user is found, generating OTP for user: 
        const providedOTP = await generateOTP();
        console.log("Provided otp code: ", providedOTP);
        // console.log("patient._id: ", patient.id);

        // if previously any otp for the user exists, removing from DB: 
        await OTP.deleteMany({ userId: patient._id })

        // creating new record for generated otp for verification: 
        const otpDoc = new OTP({
            userId: patient._id,
            otpCode: providedOTP
        })
        // saving the otp:
        await otpDoc.save();
        // console.log("OTP DOC: ", otpDoc);

        // Sending sms to registered number for OTP: 
        // sendSMS(phoneNo, `${providedOTP} is your OTP for accessing your account. The OTP is valid for 5 minutes.`);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your phone number successfully!!",
            userId: patient._id,
            isNewUser: patient.isNewUser,
            otpDoc,
            // newPatient
        })
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// OTP VERIFICATION:
module.exports.verifyOTP = async (req, res) => {
    try {
        // providing user's userId: 
        const { userId } = req.params;

        // if user id is not provided: 
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User id is required"
            });
        }

        // getting otp entered by user: 
        const { otp } = req.body;

        // if otp is not entered: 
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Provide OTP",
            });
        }

        // getting the otp associated with user from db for verification: 
        const userDbOTP = await OTP.findOne({ userId });

        // if otp is not found in the db: 
        if (!userDbOTP) {
            return res.status(410).json({
                success: false,
                message: "OTP expired"
            })
        }

        // if the generated otp and otp entered by user is not same:  
        if (userDbOTP.otpCode != otp) {
            return res.status(401).json({
                success: false,
                message: "Incorrect OTP",
            })
        }

        // if otp matches, finding user:
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        // if correct otp is entered, it should be deleted from DB: 
        await OTP.deleteOne({ userId });

        const accessToken = await generateToken(patient);

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            accessToken,
            isNewUser: patient.isNewUser
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// google login:
module.exports.googleLogin = async (req, res) => {
    try {
        const { email, name, id } = req.body;
        console.log("email, name: ", email, name);
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: "Missing Google User Data"
            })
        }

        // check if the user exists by email (Google ID can be used as unique ID as well)
        let patient = await Patient.findOne({ email });
        if (patient) {
            console.log("patient found..", patient);
            return res.status(200).json({
                success: true,
                message: "User exists",
                exists: true,
                userId: patient._id
            })
        } else {
            // user does not exists: 
            console.log("no patient found.. so creating one!!")
            patient = new Patient({
                email, name,
                // googleId: id,
                isNewUser: true,
            })
            console.log("new patient: ", patient);
            await patient.save();

            return res.status(201).json({
                success: true,
                message: "New user created",
                exists: false,
                userId: patient._id
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// SEND OTP TO VERIFY EMAIL:
module.exports.sendVerifyEmailOTP = async (req, res) => {
    try {
        const { userId } = req.params;
        const { email } = req.body;

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found!!",
            })
        }

        // Delete existing OTPs for the patient: 
        await OTP.deleteMany({ userId: patient._id });

        const providedOTP = await generateOTP();
        console.log("Provided otp code: ", providedOTP);

        // creating new record for generated otp for verification: 
        const otpDoc = new OTP({
            userId: patient._id,
            otpCode: providedOTP
        })
        // saving the otp:
        await otpDoc.save();
        // console.log("OTP DOC: ", otpDoc);

        const template = `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>OTP Verification</title>
                            <style>
                                /* Reset some default styling */
                                body, h1, h2, p, div {
                                margin: 0;
                                padding: 0;
                                }
                                body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f7fc;
                                color: #333;
                                margin: 0;
                                padding: 0;
                                }
                                .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 50px auto;
                                padding: 30px;
                                background-color: #ffffff;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                                text-align: center;
                                }
                                h2 {
                                color: #4CAF50;
                                font-size: 30px;
                                margin-bottom: 20px;
                                }
                                p {
                                color: #555;
                                font-size: 20px;
                                line-height: 1.6;
                                margin-bottom: 20px;
                                }

                                /* OTP box styling */
                                .otp-box {
                                display: inline-block;
                                padding: 20px;
                                width: 120px;
                                background-color: #f0f0f0;
                                border-radius: 8px;
                                font-size: 32px;
                                font-weight: bold;
                                color: #333;
                                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                margin-top: 30px;
                                }

                                /* Countdown timer styling */
                                .countdown {
                                margin-top: 20px;
                                font-size: 18px;
                                color: #777;
                                }

                                #time-left{
                                    font-weight: bold;
                                }


                                /* Responsive styling for mobile */
                                @media (max-width: 600px) {
                                .container {
                                    padding: 20px;
                                }
                                h2 {
                                    font-size: 20px;
                                }
                                .otp-box {
                                    font-size: 24px;
                                    padding: 15px;
                                }
                                .countdown {
                                    font-size: 12px;
                                }
                                }
                            </style>
                            </head>
                            <body>
                            <div class="container">
                                <h2>OTP For Verification</h2>
                                <p>Please use the following OTP to verify your email!!</p>
                            <p>If you didn't request this OTP, please ignore this email.</p>
                            <div class="countdown" id="countdown-timer">This OTP is valid for <span id="time-left">2 minutes only</span></div>
                            
                                <div class="otp-box" id="otp-box">
                                <span id="otp-code">${providedOTP}</span> <!-- Dynamically inserted OTP -->
                                </div>
                                </div>
                            </body>
                            </html>

        `
        await sendVerificationMail(
            email,
            "OTP For Email Verification",
            // `Your OTP to verify email is: ${providedOTP}. This is valid for 2 minutes only.`
            template,
        );

        return res.status(200).json({
            success: true,
            message: "Email for verification sent",
            userId: patient._id,
            otpDoc,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



// https://res.cloudinary.com/dnbhzklvb/image/upload/v1731393277/profile_images/67319d372b8cf5ab45f36860_profile.png        // male
// https://res.cloudinary.com/dnbhzklvb/image/upload/v1731393277/profile_images/67319d372b8cf5ab45f36860_profile.png        // female


// UPLOAD (ADD OR EDIT) PROFILE IMAGE: 
module.exports.uploadProfilePic = async (req, res) => {
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
            const { userId } = req.params;
            console.log("id: ", userId);

            const { selectedImage } = req.body;  // This will contain the URL of a pre-provided image
            console.log("Selected image URL (if any): ", selectedImage);

            // const { userId } = req.params
            // console.log("user id: ", userId);

            // Check if req.file is available after multer processing
            console.log("Uploaded file: ", req.file); // <-- Debugging line to check req.file

            if (selectedImage) {
                // update user's profile to selected provided image: 
                const patient = await Patient.findById(userId);
                if (!patient) {
                    return res.status(404).json({
                        success: false,
                        message: "Patient not found"
                    })
                }

                patient.profileImage = {
                    url: selectedImage
                }
                await patient.save();
                return res.status(200).json({
                    success: true,
                    message: "Profile image updated successfully.",
                    profileImageUrl: selectedImage
                });
            }

            // If no pre-provided image is selected, handle file upload
            // Check if the file is provided
            if (!req.file) {
                console.log("no file provided..")
                return res.status(400).json({
                    success: false,
                    message: "No file provided"
                });
            }

            // const user = await User.findById(userId);
            const patient = await Patient.findById(userId);

            if (!patient) {
                console.log("user not found")
                return res.status(404).json({
                    message: "Patient not found"
                })
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "profile_images",
                public_id: `${userId}_profile`,
            })


            patient.profileImage = {
                key: req.file.filename,
                url: result.secure_url
            };
            console.log("patient.profileImg: ", patient.profileImg);
            await patient.save();

            // console.log("user profile image: ", user.profileImg);

            return res.status(200).json({
                success: true,
                message: "Profile image uploaded..",
                profileImageUrl: result.secure_url
            })
        } catch (error) {
            console.log("catch block error: ", error)
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}

// EDIT USER PROFILE: 
module.exports.editProfile = async (req, res) => {
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
            // Accessing user's id from params: 
            // const { userId } = req.params;
            // accessing user's id from token (authenticated user):
            const userId = req.user._id;
            console.log("id: ", userId);

            const patient = await Patient.findById(userId);

            if (!patient) {
                console.log("user not found")
                return res.status(404).json({
                    message: "Patient not found"
                })
            }

            const { name, email, phoneNo, city, birthDate, } = req.body;
            const { selectedImage } = req.body;  // This will contain the URL of a pre-provided image

            if (name) patient.name = name;
            if (email) patient.email = email;
            if (birthDate) patient.birthDate = birthDate;
            if (phoneNo) patient.phoneNo = phoneNo;
            if (city) patient.city = city;

            console.log("Selected image URL (if any): ", selectedImage);

            // Check if req.file is available after multer processing
            console.log("Uploaded file: ", req.file); // <-- Debugging line to check req.file

            if (selectedImage) {
                // update user's profile to selected provided image: 
                patient.profileImage = {
                    url: selectedImage
                }
                // await patient.save();
                // return res.status(200).json({
                //     success: true,
                //     message: "Profile image updated successfully.",
                //     profileImageUrl: selectedImage
                // });
            }

            // If no pre-provided image is selected, handle file upload
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "profile_images",
                    public_id: `${userId}_profile`,
                })
                patient.profileImage = {
                    key: req.file.filename,
                    url: result.secure_url
                };
                console.log("patient.profileImg: ", patient.profileImg);
            }
            await patient.save();

            // console.log("user profile image: ", user.profileImg);

            return res.status(200).json({
                success: true,
                message: "User profile updated!!",
                patient,
            })
        } catch (error) {
            console.log("catch block error: ", error)
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}

// DELETE A PATIENT's ACCOUNT: 
module.exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("user id : ", userId);
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "User not found!!"
            })
        }

        // Delete OTPs of the user:
        await OTP.deleteMany({ userId: userId });
        // console.log("otps: ", otp);

        // Delete all appointments associated with user: 
        await Appointment.deleteMany({ patient: userId });
        // console.log("Appointments: ", appointments);

        // Delete wallet of the user: 
        await Wallet.deleteMany({ userId: userId });
        // console.log("wallets: ", wallet);

        // Delete notifications of the user: 
        await Notification.deleteMany({ patientId: userId });
        // console.log("notifications: ", notifications);

        // Delete reviews added by the user:
        await Review.deleteMany({ patientId: userId });
        // console.log("reviews: ", reviews)

        // Delete the patient
        await Patient.findByIdAndDelete(userId);
        return res.status(200).json({
            success: true,
            message: "Account and related data deleted successfully!"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// MARK A DOCTOR AS FAVOURITE: 
module.exports.markDoctorFavorite = async (req, res) => {
    try {
        // getting patient's id: (from login):
        const patientId = req.user._id;

        console.log("patient id: ", patientId)
        // getting doctor's id:
        const doctorId = req.params.doctorId;
        console.log("doctor id : ", doctorId)
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found",
            })
        }

        // console.log("favorites --- ", patient.favoriteDoctors);

        const favorites = patient.favoriteDoctors
        console.log("favorites --- ", favorites);

        if (patient.favoriteDoctors.length === 0) {
            patient.favoriteDoctors.push(doctorId);
            await patient.save();
            return res.status(200).json({
                success: true,
                message: "Doctor added to favorites list",
                favorites: patient.favoriteDoctors
            })
        }
        if (!patient.favoriteDoctors.includes(doctorId)) {
            patient.favoriteDoctors.push(doctorId);
            console.log("favorites: ", patient.favoriteDoctors);
            await patient.save();
            return res.status(200).json({
                success: true,
                message: "Doctor added to favorites list..",
                favorites: patient.favoriteDoctors
            })
        } else {
            return res.status(400).json({
                success: false,
                message: "Doctor is already in favorites"
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Get List Of Favorite Doctors: 
module.exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        // console.log("USER == ", req.user)
        console.log("patient id: ", userId);
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        const favorites = patient.favoriteDoctors;

        if (favorites.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No doctors marked as favorites"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Favorite Doctors Fetched",
            favorites
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ADD FAMILY MEMBERS: 
module.exports.addFamilyMembers = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("userid: ", userId);
        const { name, gender, birthDate, phoneNo, relation } = req.body;
        console.log(name, gender, phoneNo, birthDate, relation);

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            })
        }

        console.log("PATIENT (before adding member): ", patient);

        // Add the new family member to the familyMembers array
        patient.familyMembers.push({
            name,
            gender,
            birthDate,
            phoneNo,
            relation,
        });

        // Save the patient document with the new family member added
        await patient.save();
        console.log("PATIENT (after adding member): ", patient);

        return res.status(200).json({
            success: true,
            message: "Family member details added!!",
            patient
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Get all family members (of logged in user): 
module.exports.getFamilyMembers = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('user id: ', userId);

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found..",
            })
        }

        if (patient.familyMembers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No family members added.."
            })
        }

        return res.status(200).json({
            success: true,
            message: "Famile members found",
            familyMembers: patient.familyMembers
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Get single family member details: 
module.exports.getSingleMember = async (req, res) => {
    try {
        const userId = req.user._id;
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }
        const { name } = req.query;
        console.log("name: ", name);

        const member = await patient.familyMembers.find(member => member.name === name);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            })
        }
        console.log("member: ", member);

        return res.status(200).json({
            success: true,
            message: "Details found",
            member
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Edit member details: 
module.exports.editMemberDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }
        const { name } = req.query;
        console.log("name: ", name);

        const member = await patient.familyMembers.find(member => member.name === name);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            })
        }
        console.log("member: ", member);

        const { newName, gender, phoneNo, birthDate, relation } = req.body;

        if (newName) member.name = newName;
        if (gender) member.gender = gender;
        if (phoneNo) member.phoneNo = phoneNo;
        if (birthDate) member.birthDate = birthDate;
        if (relation) member.relation = relation;
        // Save the updated patient document
        await patient.save();
        console.log("MEMBER --- ", member);

        return res.status(200).json({
            success: true,
            message: "Details updated!!",
            member,
            patient,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ADD PATIENT's MEDICAL RECORDS: 
module.exports.addMedicalRecords = async (req, res) => {
    uploadMedicalRecords(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeds the limit of 2MB.",
                });
            }
            else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: "Too many files selected. Only 5 files are allowed.",
                    err
                });
            } else if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: "File size too large or error in file upload.",
                    err
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err,
                });
            }
        }
        try {
            const userId = req.user._id;
            console.log("user id : ", userId);

            // const {doctor} = req.params;
            const { recordType, date, doctor } = req.body;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded"
                });
            }

            // Find the patient:
            const patient = await Patient.findById(userId);
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: "Patient not found"
                })
            }

            // Initialize an array to store uploaded file details: 
            const fileDetails = [];

            for (let file of req.files) {
                // upload each file to cloudinary: 
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'medical_records',
                    public_id: `${userId}_record_${Date.now()}`
                })

                fileDetails.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                    fileName: file.filename,
                    fileType: file.mimetype,
                });
            }

            const recordDate = date ? new Date(date) : Date.now();

            // Check if the doctor exists
            const doctorExists = await Doctor.findById(doctor);
            if (doctor && !doctorExists) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid doctor ID"
                });
            }

            const newRecord = {
                recordType,
                date: recordDate,
                doctor: doctor || null,
                attachments: fileDetails
            };

            // Add new record to patient's medical records: 
            patient.medicalRecords.push(newRecord);
            await patient.save();

            return res.status(200).json({
                success: true,
                message: "Medical records uploaded successfully.",
                medicalRecord: newRecord,
            });
        } catch (error) {
            console.error("Error uploading medical records:", error);
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}

// GET ALL RECORDS OF A PATIENT: 
module.exports.getAllRecords = async (req, res) => {
    try {
        const userId = req.user._id;

        const patient = await Patient.findById(userId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found..",
            })
        }

        if (patient.medicalRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No records found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Records found",
            records: patient.medicalRecords
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// GET SINGLE RECORD OF PATIENT:
module.exports.getSingleRecord = async (req, res) => {
    try {
        const userId = req.user._id;
        const recordId = req.params.recordId;

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.."
            })
        }

        // const record = await patient.medicalRecords.find(record => record._id === recordId);

        // Convert recordId to ObjectId for accurate comparison
        const recordObjectId = new mongoose.Types.ObjectId(recordId);

        // Find the record by its ID in the medicalRecords array
        const record = patient.medicalRecords.find(record =>
            record._id.toString() === recordObjectId.toString()
        );

        // If the record is not found, return a 404 error
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found."
            });
        }
        // if (!record) {
        //     return res.status(404).json({
        //         success: false,
        //         message: "Record not found"
        //     })
        // }
        // console.log("record: ", record);

        return res.status(200).json({
            success: true,
            message: "Record found",
            record
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// GET MEDICAL RECORDS ACCORDING TO FILTER: 
module.exports.getRecordsByType = async (req, res) => {
    try {
        const userId = req.user._id;
        const { recordType } = req.query;

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            })
        }

        // const filterObject = {};

        // console.log("filter object: ", filterObject);
        // if (recordType) {
        //     filterObject.recordType = recordType
        // }
        // console.log("filter object ----- ", filterObject);

        // const records = await patient.medicalRecords.find(filterObject);


        // Filter the medicalRecords array by recordType
        const records = patient.medicalRecords.filter(record =>
            recordType ? record.recordType === recordType : true
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No records of selected type found"
            })
        }
        // console.log("RECORDS: ", records);

        return res.status(200).json({
            success: true,
            message: "Records found",
            records
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// DELETE MEDICAL RECORDS: 
module.exports.deleteMedicalRecord = async (req, res) => {
    try {
        const userId = req.user._id;
        const recordId = req.params.recordId;
        console.log("record id: ", recordId);

        const patient = await Patient.findById(userId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.."
            })
        }

        // Convert recordId to ObjectId for correct comparison
        const recordObjectId = new mongoose.Types.ObjectId(recordId);

        // Find the record by its ID in the medicalRecords array
        const recordIndex = patient.medicalRecords.findIndex(record => record._id.toString() === recordObjectId.toString());
        console.log("record index: ", recordIndex);

        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Record not found."
            });
        }

        // // If record is not found directly in the main record
        // if (recordIndex === -1) {
        //     // Now check if the recordId exists in the attachments array of the medical records
        //     const attachmentIndex = patient.medicalRecords.findIndex(record =>
        //         record.attachments.some(attachment =>
        //             attachment._id.toString() === recordObjectId.toString()
        //         )
        //     );

        //     if (attachmentIndex === -1) {
        //         return res.status(404).json({
        //             success: false,
        //             message: "Record not found in attachments."
        //         });
        //     }

        //     // If found in attachments, we need to remove the attachment object, not the whole record
        //     const attachmentRecord = patient.medicalRecords[attachmentIndex];
        //     attachmentRecord.attachments = attachmentRecord.attachments.filter(attachment =>
        //         attachment._id.toString() !== recordObjectId.toString()
        //     );

        //     // Save patient after updating the attachment
        //     await patient.save();

        //     return res.status(200).json({
        //         success: true,
        //         message: "Medical record attachment deleted successfully."
        //     });
        // }


        // Remove the record from the array
        patient.medicalRecords.splice(recordIndex, 1);

        // Save the patient document after removing the record
        await patient.save();

        return res.status(200).json({
            success: true,
            message: "Medical record deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Logout: 
module.exports.logout = async (req, res) => {
    try {
        res.clearCookie('accessToken');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// UPDATE THE FCM TOKEN (TO SEND NOTIFICATIONS):
module.exports.updateFCMToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fcmToken } = req.body;
        console.log("fcm token fetched to store in user's record: ", fcmToken)

        await Patient.findByIdAndUpdate(
            userId,
            { fcmToken },
        );
        console.log("FCM TOKEN ADDED TO USER's RECORD SUCCESSFULLY")

        return res.status(200).json({
            success: true,
            message: "FCM TOKEN ADDED"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// // add pre provided image to all patients:
// const addPreProvidedImages = async (req, res) => {
//     const preProvidedImages = [
//         {
//             url: "https://res.cloudinary.com/dnbhzklvb/image/upload/v1731393787/profile_images/67319d372b8cf5ab45f36860_profile.png"        // male
//         },
//         {
//             url: "https://res.cloudinary.com/dnbhzklvb/image/upload/v1731393277/profile_images/67319d372b8cf5ab45f36860_profile.png"        // female
//         }
//     ]

//     await Patient.updateMany({}, {
//         $set: {
//             preProvidedImages: preProvidedImages
//         }
//     })
// }
// // addPreProvidedImages().then(() => {
// //     console.log("Pre-provided images added to all patients");
// // });



// module.exports.addPatientDetails = async (req, res) => {
//     try {
//         const { id } = req.user;
//         const { medicalRecords, allergies, emergencyContact, insuranceDetails } = req.body;

//         const userExists = await User.findById(id);
//         if (!userExists) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             })
//         }

//         const patient = new Patient({
//             userId: id,
//             userName: req.user.name,
//             medicalRecords,
//             allergies,
//             emergencyContact,
//             insuranceDetails,
//         });

//         await patient.save();
//         res.status(201).json({
//             success: true,
//             message: "Details for patient added successfully",
//             patient
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


// // SEND LINK TO VERIFY EMAIL ADDRESS:
// module.exports.sendVerifyEmailLink = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { email } = req.body;

//         const patient = await Patient.findById(userId);
//         if (!patient) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             })
//         }

//         // Delete any existing tokens for the user
//         await Token.deleteMany({ userId: patient._id });

//         const verificationToken = await generateEmailVerificationToken();
//         // console.log("ver token: ", verificationToken);

//         const token = new Token({
//             userId: patient._id,
//             token: verificationToken,
//         })
//         await token.save();

//         const verificationLink = `http://localhost:3000/api/patient/verifyEmail/${verificationToken}`;

//         // Render the EJS template
//         // const templatePath = path.join(__dirname, '../views', 'emailVerification.ejs');
//         // const emailBody = await ejs.render(fs.readFileSync(templatePath, 'utf-8'), {
//         //     verificationLink: verificationLink
//         // });

//         const temp = `
//         <!DOCTYPE html>
//         <html lang="en">

//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Email Verification</title>
//             <style>
//                 body {
//                     font-family: Arial, sans-serif;
//                     margin: 0;
//                     padding: 20px;
//                     background-color: #f4f4f4;
//                 }

//                 .container {
//                     max-width: 600px;
//                     margin: auto;
//                     background: white;
//                     padding: 20px;
//                     border-radius: 5px;
//                     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
//                 }

//                 h1 {
//                     color: #333;
//                 }

//                 p {
//                     font-size: 16px;
//                     color: #555;
//                 }

//                 .button {
//                     display: inline-block;
//                     padding: 15px 30px;
//                     font-size: 16px;
//                     color: white;
//                     background-color: #4CAF50; /* Green */
//                     text-decoration: none;
//                     border-radius: 5px;
//                     margin-top: 20px;
//                 }

//                 .button:hover {
//                     background-color: #45a049;
//                 }
//             </style>
//         </head>

//         <body>
//             <div class="container">
//                 <h1>Email Verification</h1>
//                 <p>Hello,</p>
//                 <p>Your link for email verification is this: </p>
//                 <a href="${verificationLink}" class="button">Verify Email</a>
//                 <p> This is valid for 5 minutes.</p>
//                 <p>If you did not request this email, please ignore it.</p>

//             </div>
//         </body>

//     </html>
// `

//         // // Generate the email body
//         // const emailBody = await emailVerification(verificationLink); // Await the result

//         await sendVerificationMail(
//             email,
//             "Email verification",
//             // `Hello. Your link for email verification is: ${verificationLink}`,
//             // emailBody
//             temp
//         );

//         // sendVerificationMail(email, "verification mail", "sample test message");
//         return res.status(200).json({
//             success: true,
//             message: "Email for verification sent",

//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


// // VERIFY EMAIL:
// module.exports.verifyEmail = async (req, res) => {
//     console.log('Received verification request with token:', req.params.token); // Log the received token

//     try {
//         const { token } = req.params;

//         const verificationToken = await Token.findOne({ token });

//         console.log("token: ", verificationToken);

//         if (!verificationToken) {
//             console.log("no verification token found ")
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid or expired verification token"
//             })
//         }

//         // console.log("user id: ", verificationToken.userId)
//         const patient = await Patient.findById(verificationToken.userId);
//         if (!patient) {
//             console.log("no user found")
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             })
//         }

//         patient.isEmailVerified = true;
//         console.log("email verified: ", patient.isEmailVerified);
//         await patient.save();

//         await Token.deleteOne({ _id: verificationToken._id });

//         // Redirect to a success page
//         // return res.redirect('http://localhost:3000/verificationSuccess.html'); // Change this to your actual success URL

//         return res.status(200).json({
//             success: true,
//             message: "Email verified successfully!!",
//             redirectUrl: '/verificationSuccess.html'
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//         // return res.redirect('http://localhost:3000/api/user/verificationFailure.html'); // Change this to your actual success URL

//     }
// }