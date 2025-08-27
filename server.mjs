import express, { response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "./models/user-model/index.js";
import AuthRouter from "./Routers/auth-api/index.js";
import messageRouter from "./Routers/message-api/index.js";
import { Server } from 'socket.io';
import { createServer } from 'http';


dotenv.config();



const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_TOKEN;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.options("*", cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ],
  credentials: true
}));

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: "*"} });
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
});
mongoose.connection.on("error", (err) => { 
    console.log(`Error connecting to MongoDB: ${err}`);
});

// Root route
app.get("/", (req, res) => {
    res.send("Welcome to the Chat App API");
});

// unathuraizted api routes

app.use('/api/v1', AuthRouter);

// Auth Middleware
app.use('/api/v1', (req, res, next) => {
    const publicPaths = ['/sign-up', '/login', '/logout' ];
    if (publicPaths.includes(req.path)) {
        return next(); // Skip auth for public routes
    }

    const token = req.cookies.Token; // Case-sensitive

    if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    try {
        jwt.verify(token, SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: "Invalid or expired token" });
            }

            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp < now) {
                res.clearCookie("Token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
                });
                return res.status(401).send({ message: "Token expired" });
            }

            req.token = decoded; 
            next();
        });
    } catch (error) {
        console.log("error", error);
        return res.status(500).send({ message: "Internal server error" });
    }
});

// message api routes
app.use('/api/v1', messageRouter(io))



// Protected: Get all users
app.get('/api/v1/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password
        res.status(200).json(users);
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//edit profile 

app.post('/api/v1/edit-profile', async(req ,res)=>{
    let {firstName, lastName, email}= req.body
     const userId = req.token.user_id;
    if(!firstName || !lastName || !email || !userId ){
        res.status(400).send({message : "required perameter is missing"})
        return
    }
    email = email.toLowerCase()
    try {
        const updateProfile = await User.updateOne({_id : userId}, {$set : {firstName : firstName, lastName : lastName , email : email}})
        res.status(201).send({message : "user Updated", response : updateProfile})
    } catch (error) {
        console.log("error", error)
        res.status(500).send({message : "internal server error"})
    }
})

app.get('/api/v1/profile', async (req, res) => {
       const userId = req.token.user_id;
    try {   
        const user = await User.findById(userId, '-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
    res.send({message: "User Logged in" , user: {
            user_id: user._id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email
        }})
  
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    // socket.emit("test Topic", "some data")

    socket.on("disconnect", (reason) => {
        console.log("Client disconnected:", socket.id, "Reason:", reason);
    });

});
// setInterval(()=>{
//     io.emit("test Topic", {event : "ADD_ITEM", data : "some data"})
// }, 2000)



server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
