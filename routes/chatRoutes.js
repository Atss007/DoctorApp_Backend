// require("dotenv").config();
// const express = require("express");
// const axios = require("axios");
// const rateLimit = require("express-rate-limit");
// const router = express.Router();

// const OPENAI_KEY = process.env.OPENAI_API_KEY;

// // Set up rate limiting
// const apiLimiter = rateLimit({
//     windowMs: 1 * 60 * 1000, // 1 minute window
//     max: 100, // Limit each IP to 10 requests per windowMs
//     message: {
//         success: false,
//         message: "Too many requests, please try again later.",
//     },
// });

// // CHAT ROUTE: // Apply the rate limit to the chat route
// router.post("/", apiLimiter, async (req, res) => {
//     try {
//         const { messages } = req.body;

//         // console.log("OPEN AI KEY ---- ", OPENAI_KEY);
//         const response = await axios.post(
//             'https://api.openai.com/v1/chat/completions',
//             {
//                 model: 'gpt-3.5-turbo',
//                 messages: messages,
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${OPENAI_KEY}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         console.log("backend res: ", response);
//         const botMessage = response.data.choices[0].message;
//         console.log("bot message === ", botMessage);
//         return res.status(200).json({
//             success: true,
//             botMessage,
//         })
//     } catch (error) {
//         if (error.response && error.response.status === 429) {
//             console.log("Rate limit exceeded. Retrying in 5 seconds...");
//             setTimeout(() => {
//                 res.status(429).json({
//                     success: false,
//                     message: "Rate limit exceeded. Please try again later.",
//                 });
//             }, 5000);
//         } else {
//             console.error("An error occurred:", error.message);
//             return res.status(500).json({
//                 success: false,
//                 message: "Error communicating with OpenAI: " + error.message,
//             });
//         }

//         // console.log("Error communicating with OPENAI: ", error);
//         // return res.status(500).json({
//         //     success: false,
//         //     message: error.message,
//         // })
//     }
// })


// module.exports = router;



// // CODE 2:
// require("dotenv").config();
// const express = require("express");
// const axios = require("axios");
// const rateLimit = require("express-rate-limit");
// const router = express.Router();

// const OPENAI_KEY = process.env.OPENAI_API_KEY;

// // Set up rate limiting
// const apiLimiter = rateLimit({
//     windowMs: 1 * 60 * 1000, // 1 minute window
//     max: 100, // Limit each IP to 100 requests per windowMs
//     message: {
//         success: false,
//         message: "Too many requests, please try again later.",
//     },
// });

// // Adding a small delay before making the API request
// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// // CHAT ROUTE: Apply the rate limit to the chat route
// router.post("/", apiLimiter, async (req, res) => {
//     try {
//         const { messages } = req.body;

//         // Add delay to prevent rate limit errors
//         await delay(1000);  // Delay for 1 second between requests

//         // Default to GPT-3.5 if you're out of credits or using the free plan
//         const model = 'gpt-3.5-turbo';

//         const response = await axios.post(
//             'https://api.openai.com/v1/chat/completions',
//             {
//                 model: model,
//                 messages: messages,
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${OPENAI_KEY}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         const remainingRequests = response.headers['x-ratelimit-remaining'];
//         const resetTime = response.headers['x-ratelimit-reset'];

//         if (remainingRequests <= 0) {
//             // If no requests are left, wait until the rate limit resets
//             const delayUntilReset = resetTime * 1000 - Date.now();
//             console.log(`Rate limit exceeded. Retrying in ${delayUntilReset / 1000} seconds...`);
//             await delay(delayUntilReset);
//         }

//         console.log("backend response: ", response);
//         const botMessage = response.data.choices[0].message;
//         console.log("bot message === ", botMessage);

//         return res.status(200).json({
//             success: true,
//             botMessage,
//         });

//     } catch (error) {
//         if (error.response) {
//             // Handle rate limit exceeded (status 429)
//             if (error.response.status === 429) {
//                 console.log("Rate limit exceeded. Retrying in 5 seconds...");
//                 setTimeout(() => {
//                     res.status(429).json({
//                         success: false,
//                         message: "Rate limit exceeded. Please try again later.",
//                     });
//                 }, 5000);
//             }
//             // Handle insufficient credits (status 402 or specific message)
//             else if (error.response.status === 402 || error.response.data.error.message.includes("insufficient credits")) {
//                 console.log("No credits available, falling back to the free-tier model.");

//                 // Fallback to free-tier model
//                 const freeModelResponse = await axios.post(
//                     'https://api.openai.com/v1/chat/completions',
//                     {
//                         model: 'gpt-3.5-turbo', // Free-tier model
//                         messages: messages,
//                     },
//                     {
//                         headers: {
//                             Authorization: `Bearer ${OPENAI_KEY}`,
//                             'Content-Type': 'application/json',
//                         },
//                     }
//                 );

//                 const botMessage = freeModelResponse.data.choices[0].message;
//                 return res.status(200).json({
//                     success: true,
//                     botMessage,
//                     message: "Switched to the free-tier model (gpt-3.5-turbo).",
//                 });
//             }
//         } else {
//             console.error("An error occurred:", error.message);
//             return res.status(500).json({
//                 success: false,
//                 message: "Error communicating with OpenAI: " + error.message,
//             });
//         }
//     }
// });

// module.exports = router;




// // CODE 3:
// require("dotenv").config();
// const OpenAI = require("openai");
// const express = require("express");
// const router = express.Router();
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY, // Replace with your actual OpenAI API key
// });

// // Define the getHaiku function and attach it to a route
// router.get('/haiku', async (req, res) => {
//     try {
//         const completion = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo", // Use a valid model like "gpt-4" or "gpt-4-turbo"
//             messages: [
//                 { role: "system", content: "You are a helpful assistant." },
//                 { role: "user", content: "Write a haiku about recursion in programming." },
//             ],
//         });

//         // Send the response back to the client
//         res.send(completion.choices[0].message.content);
//     } catch (error) {
//         console.error("Error fetching completion:", error);
//         res.status(500).send("An error occurred while fetching the haiku.");
//     }
// });

// module.exports = router;