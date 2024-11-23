require("dotenv").config();
const jwt = require("jsonwebtoken")

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// generating 6 digit otp:
const generateOTP = async () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    return code;
}

// sending sms to user (for otp):
const sendSMS = async (phoneNo, message) => {
    const client = require('twilio')(accountSid, authToken);
    client.messages.create({
        body: message,
        from: twilioNumber,
        to: phoneNo
    })
        .then(message => console.log(message.sid));
}

// generating jwt: 
const generateToken = async (user) => {
    const token = jwt.sign(
        {
            id: user._id,
            phoneNo: user.phoneNo,
            role: user.role,
        },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn: '60m'
        }
    )

    return token;
}

const generateEmailVerificationToken = async () => {
    const length = 64;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tokenCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        tokenCode += characters.charAt(randomIndex);
    }

    return tokenCode;
}

module.exports = { generateOTP, sendSMS, generateToken, generateEmailVerificationToken }