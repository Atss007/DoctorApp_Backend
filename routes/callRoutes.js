const express = require('express');
const twilio = require('twilio');
const router = express.Router();
require("dotenv").config();

// Replace these with your actual Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.VIDEO_API_KEY_SID;
const apiKeySecret = process.env.VIDEO_API_KEY_SECRET;

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

function generateAccessToken(identity, room) {
    if (!identity) {
        console.log("Identity is required..")
        throw new Error('Identity is required');
    }

    // Ensure that the Twilio credentials are correct
    if (!accountSid || !apiKeySid || !apiKeySecret) {
        throw new Error('Twilio credentials are missing');
    }

    // Set options for the AccessToken constructor
    const options = {
        identity: identity,  // Identity of the user
        ttl: 3600,           // Optional: Set the time-to-live (default is 3600 seconds)
        // nbf: Math.floor(Date.now() / 1000) // Optional: Set the not-before time if needed
    };

    // Create a new AccessToken instance
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, options);

    // Assign identity directly to the token
    token.identity = identity; // This is crucial for generating the token correctly

    // Add the VideoGrant to the token
    const videoGrant = new VideoGrant({ room });
    token.addGrant(videoGrant);

    // Return the token as a JWT string
    return token.toJwt();
}

router.get('/getToken', (req, res) => {
    try {
        const { identity, room } = req.query;  // Get identity and room from query parameters

        console.log("Received identity:", identity);
        console.log("Received room:", room);

        if (!identity || !room) {
            return res.status(400).json({ error: 'identity and room are required' });
        }

        // Generate the access token using the identity and room
        const token = generateAccessToken(identity, room);
        console.log("Generated TOKEN: ", token);

        // Return the generated token in the response
        res.json({ token });
    } catch (error) {
        console.error('Error generating token:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;






// const express = require('express');
// const twilio = require('twilio');
// const cors = require('cors');
// const router = express.Router();
// require("dotenv").config();

// // Replace these with your actual Twilio credentials
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const apiKeySid = process.env.VIDEO_API_KEY_SID;
// const apiKeySecret = process.env.VIDEO_API_KEY_SECRET;

// const AccessToken = twilio.jwt.AccessToken;
// const VideoGrant = AccessToken.VideoGrant;

// function generateAccessToken(identity, room) {
//     if (!identity) {
//         console.log("Identity is required..")
//         throw new Error('Identity is required');
//     }
//     // console.log("acc sid: ", accountSid);
//     // console.log("api key sid: ", apiKeySid);
//     // console.log("api key secret: ", apiKeySecret);

//     console.log("ACCESS TOKEN ----------", AccessToken);
//     console.log("VIDEO GRANT ----------", VideoGrant);
//     // Ensure that the Twilio credentials are correct
//     if (!accountSid || !apiKeySid || !apiKeySecret) {
//         throw new Error('Twilio credentials are missing');
//     }
//     console.log("before generating token..")
//     const token = new AccessToken(accountSid, apiKeySid, apiKeySecret);
//     console.log("TOKEN (generated): ", token)
//     token.identity = identity;
//     console.log("token.identity: ", token.identity);

//     const videoGrant = new VideoGrant({ room });
//     token.addGrant(videoGrant);

//     return token.toJwt();
// }

// router.get('/getToken', (req, res) => {
//     try {
//         // const identity = req.query.identity || 'testUser'; // Use default for testing
//         // const room = req.query.room || 'testRoom';         // Use default for testing

//         // const { identity, room } = req.body;  // Get data from the request body
//         const { identity, room } = req.query;  // Use req.query for GET requests

//         console.log("Received identity:", identity);
//         console.log("Received room:", room);

//         if (!identity || !room) {
//             return res.status(400).json({ error: 'identity and room are required' });
//         }

//         const token = generateAccessToken(identity, room);
//         console.log("TOKEN: ", token);
//         res.json({ token });
//     } catch (error) {
//         console.error('Error generating token:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;





// CODE 3:
// require("dotenv").config();
// const express = require("express");
// const twilio = require("twilio");
// const router = express.Router();
// const AccessToken = twilio.jwt.AccessToken;
// const VideoGrant = AccessToken.VideoGrant;
// const app = express();

// router.get('/getToken', (req, res) => {
//     if (!req.query || !req.query.room || !req.query.username) {
//         return res.status(400).send('username and room parameter is required');
//     }

//     const accessToken = new AccessToken(
//         process.env.TWILIO_ACCOUNT_SID,
//         process.env.VIDEO_API_KEY_SID,
//         process.env.VIDEO_API_KEY_SECRET
//     );

//     accessToken.identity = req.query.username;
//     console.log("access token => identity: ", accessToken.identity);
//     const grant = new VideoGrant();
//     grant.room = req.query.room;
//     accessToken.addGrant(grant);

//     const jwt = accessToken.toJwt();
//     console.log("JWT: ", jwt);
//     return res.send(jwt);
// });

// module.exports = router;





// CODE 2:
// const express = require("express");
// const generateVideoToken = require("../helper/twilioService");
// const router = express.Router();

// router.get('/video-token', (req, res) => {
//     const identity = req.query.identity; // Identity is the user or participant name
//     const token = generateVideoToken(identity);
//     res.json({ token });
// });

// module.exports = router;





// // CODE 1:

// const express = require("express");
// const { AccessToken } = require("twilio").jwt;
// const VideoGrant = AccessToken.VideoGrant;
// require("dotenv").config();

// const router = express.Router();

// const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
// const twilioApiKeySid = process.env.VIDEO_API_KEY_SID;
// const twilioApiKeySecret = process.env.VIDEO_API_KEY_SECRET;

// router.get("/video/token", async (req, res) => {
//     const { identity, room } = req.query;

//     // Ensure identity and room are provided
//     if (!identity || !room) {
//         console.log("dentity and room are required");
//         return res.status(400).json({ error: 'Identity and room are required' });
//     }
//     console.log("identity, room: ", identity, room);
//     // Create an access token with twilio credentials:
//     const token = new AccessToken(twilioAccountSid, twilioApiKeySid, twilioApiKeySecret);
//     token.identity = identity;
//     console.log("token.identity: ", token.identity);
//     // Grant token access to twilio video:
//     const videoGrant = new VideoGrant({ room });
//     token.addGrant(videoGrant);

//     // send the token as a response:
//     res.json({
//         token: token.toJwt()
//     });
// })

// module.exports = router;