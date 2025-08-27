// import { User } from "../../models/user-model/index.mjs";
import "dotenv/config"
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken";
import express from 'express'
import { User } from "../../models/user-model/index.js";


const AuthRouter = express.Router()
const SECRET = process.env.SECRET_TOKEN;


AuthRouter.post("/sign-up", async (req, res) => {
    let { firstName, lastName, email, password } = req.body;
    email = email.toLowerCase();

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hash
        });

        const signedUpUser = await newUser.save();
        return res.status(201).json({ message: "User created successfully", user: signedUpUser });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Login
AuthRouter.post('/login', async (req, res) => {
    let { email, password } = req.body;
    email = email.toLowerCase();

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User doesn't exist" });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password is incorrect" });
        }

        const token = jwt.sign({
            user_id: existingUser._id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day
        }, SECRET);

        res.cookie("Token", token, {
            httpOnly: true,
            maxAge: 86400000, // 1 day
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                userId: existingUser._id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                
            }
        });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Logout
AuthRouter.post('/logout', (req, res) => {
    res.clearCookie("Token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.status(200).json({ message: "Logout successful" });
});

export default AuthRouter;