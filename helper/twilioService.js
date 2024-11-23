const twilio = require('twilio');
require("dotenv").config();
// Twilio credentials
// const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
// const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
// const apiKeySid = 'YOUR_TWILIO_API_KEY_SID';
// const apiKeySecret = 'YOUR_TWILIO_API_KEY_SECRET';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.VIDEO_API_KEY_SID;
const apiKeySecret = process.env.VIDEO_API_KEY_SECRET;

const client = twilio(accountSid, authToken);

function generateVideoToken(identity) {
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
        room: 'video-room', // You can use dynamic room names here
    });

    const token = new twilio.jwt.AccessToken(accountSid, apiKeySid, apiKeySecret);
    token.identity = identity;
    token.addGrant(videoGrant);

    return token.toJwt();
}

module.exports = { generateVideoToken };
