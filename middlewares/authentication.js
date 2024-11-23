const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Patient = require("../models/patientModel");

module.exports = async function (req, res, next) {
    // Get token from request headers
    const userToken = req.headers.authorization;

    if (!userToken) {
        return res.status(401).json({
            message: "Please authenticate using a token"
        });
    }

    try {
        let token = userToken.split(" ");
        const JWT_TOKEN = token[1];

        // checking if token is missing: 
        if (!token) {
            return res.status(401).json({
                message: "No token, authorization denied!!"
            })
        }

        // Verify token: 
        const decoded = jwt.verify(JWT_TOKEN, process.env.JWT_SECRET_KEY);
        // console.log("Decoded: ", decoded);

        // Extract user id from decoded token: 
        const userId = decoded.id;
        // console.log("user id: ", userId);

        // finding user from db using user id: 
        const user = await Patient.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // attach user to request object: 
        req.user = user;

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Token is not valid"
        })
    }
}