import mongoose from "mongoose";


const messageSchema =  mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },  
    text :{
        type : String,
        required :  true
    },
    imageUrl : {
        type : String
    },
    createdOn : {
        type : Date, 
        default : Date.now
    },
    read : {
        type : Boolean,
        default : false
    }
})



 export  const Message  = mongoose.model("message" , messageSchema);
 