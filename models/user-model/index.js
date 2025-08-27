import mongoose from "mongoose";

const userSchema = new mongoose.Schema({   
    firstName: {
        type: String,
        required: true,
        
    },
    lastName: { 
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        
    },
    password: {
        type: String,
        required: true,
        min : 6,
        max : 10,
    },
    createdOn :{
        type : Date,
        default : Date.now
    }

})
export const User = mongoose.model("User", userSchema);