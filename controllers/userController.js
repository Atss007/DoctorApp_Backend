
const { sendSMS, generateOTP, generateToken, generateEmailVerificationToken } = require("../helper/generate");
const User = require("../models/userModel")
const OTP = require("../models/otpModel");
const Token = require("../models/tokenModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");
const Wallet = require("../models/walletModel");
const { sendVerificationMail } = require("../helper/sendEmail");
const multer = require("multer");
const { upload } = require("../middlewares/multer");
const { emailVerification } = require("../views/emailVerification");
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');


require("dotenv").config();

// USER REGISTRATION:
module.exports.register = async (req, res) => {
    try {
        const { userId } = req.params;
        // getting user details: 
        const { name, email, gender, birthDate, city } = req.body;

        // if required details are not provided: 
        if (!name || !email || !gender || !city || !birthDate) {
            return res.status(400).json({
                success: false,
                message: "Provide required details"
            })
        }

        // creating record for user(patient): 
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // UPDATE USER DETAILS: 
        user.name = name;
        user.email = email;
        user.gender = gender;
        user.birthDate = birthDate;
        user.city = city;
        user.isNewUser = false;

        await user.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully!!",
            user
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
        // getting user's phone no: 
        const { phoneNo } = req.body;

        // if phone number is not provided: 
        if (!phoneNo) {
            return res.status(400).json({
                success: false,
                message: "Provide Phone Number"
            })
        }

        // finding user with phone no: 
        let user = await User.findOne({ phoneNo });

        // if user is not found: 
        if (!user) {
            user = new User({ phoneNo });
            await user.save();

            console.log("New user created:", user);
        }

        // if user is found, generating OTP for user: 
        const providedOTP = await generateOTP();
        console.log("Provided otp code: ", providedOTP);

        // if previously any otp for the user exists, removing from DB: 
        await OTP.deleteMany({ userId: user._id })

        // creating new record for generated otp for verification: 
        const otpDoc = new OTP({
            userId: user._id,
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
            userId: user._id,
            isNewUser: user.isNewUser,
            otpDoc
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // if correct otp is entered, it should be deleted from DB: 
        await OTP.deleteOne({ userId });

        const accessToken = await generateToken(user);

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            accessToken,
            isNewUser: user.isNewUser
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// SEND LINK TO VERIFY EMAIL ADDRESS: 
module.exports.sendVerifyEmailLink = async (req, res) => {
    try {
        const { userId } = req.params;
        const { email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // Delete any existing tokens for the user
        await Token.deleteMany({ userId: user.id });

        const verificationToken = await generateEmailVerificationToken();
        // console.log("ver token: ", verificationToken);

        const token = new Token({
            userId: user.id,
            token: verificationToken,
        })
        await token.save();

        const verificationLink = `http://localhost:3000/api/user/verifyEmail/${verificationToken}`;

        // Render the EJS template
        // const templatePath = path.join(__dirname, '../views', 'emailVerification.ejs');
        // const emailBody = await ejs.render(fs.readFileSync(templatePath, 'utf-8'), {
        //     verificationLink: verificationLink
        // });

        const temp = `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                }

                .container {
                    max-width: 600px;
                    margin: auto;
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                }

                p {
                    font-size: 16px;
                    color: #555;
                }

                .button {
                    display: inline-block;
                    padding: 15px 30px;
                    font-size: 16px;
                    color: white;
                    background-color: #4CAF50; /* Green */
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }

                .button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <h1>Email Verification</h1>
                <p>Hello,</p>
                <p>Your link for email verification is this: </p>
                <a href="${verificationLink}" class="button">Verify Email</a>
                <p> This is valid for 5 minutes.</p>
                <p>If you did not request this email, please ignore it.</p>

            </div>
        </body>

    </html>
`

        // // Generate the email body
        // const emailBody = await emailVerification(verificationLink); // Await the result

        await sendVerificationMail(
            email,
            "Email verification",
            // `Hello. Your link for email verification is: ${verificationLink}`,
            // emailBody
            temp
        );

        // sendVerificationMail(email, "verification mail", "sample test message");
        return res.status(200).json({
            success: true,
            message: "Email for verification sent",

        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// VERIFY EMAIL: 
module.exports.verifyEmail = async (req, res) => {
    console.log('Received verification request with token:', req.params.token); // Log the received token

    try {
        const { token } = req.params;

        const verificationToken = await Token.findOne({ token });

        console.log("token: ", verificationToken);

        if (!verificationToken) {
            console.log("no verification token found ")
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            })
        }

        // console.log("user id: ", verificationToken.userId)
        const user = await User.findById(verificationToken.userId);
        if (!user) {
            console.log("no user found")
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        user.isEmailVerified = true;
        console.log("email verified: ", user.isEmailVerified);
        await user.save();

        await Token.deleteOne({ _id: verificationToken._id });

        // Redirect to a success page
        // return res.redirect('http://localhost:3000/verificationSuccess.html'); // Change this to your actual success URL

        return res.status(200).json({
            success: true,
            message: "Email verified successfully!!",
            redirectUrl: '/verificationSuccess.html'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
        // return res.redirect('http://localhost:3000/api/user/verificationFailure.html'); // Change this to your actual success URL

    }
}


// UPLOAD (ADD OR EDIT) PROFILE IMAGE: 
module.exports.uploadProfilePic = async (req, res) => {
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
            const user = await User.findById(id);

            if (!user) {
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

            user.profileImg = {
                key: req.file.filename,
                url: `/uploads/${req.file.filename}`
            }
            await user.save();

            // console.log("user profile image: ", user.profileImg);

            return res.status(200).json({
                success: true,
                message: "Profile image uploaded.."
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            })
        }
    })
}


// // DELETE USER: 
// module.exports.deleteUser = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         // Find the user by id: 
//         const user = await User.findOneAndDelete({ _id: userId });
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found.."
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "User deleted successfully!!"
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

module.exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        // console.log("user id: ", userId);
        const patient = await Patient.findOne({ userId: userId });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // delete related wallet record: 
        await Wallet.deleteMany({ userId: userId });

        // delete related appointment records: 
        // console.log("patient id : ", patient._id);
        await Appointment.deleteMany({ patient: patient._id });

        // delete the patient records:
        await Patient.deleteMany({ userId: userId });


        // Delete the user: 
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}