
import express from 'express'
import { Message } from '../../models/message-model/index.js';
import { User } from '../../models/user-model/index.js';

export default function (io){
const messageRouter = express.Router()

messageRouter.post('/chat', async (req, res) => {
  const id = req.token?.user_id; // safely access user_id

  const { receiverId, message } = req.body;

  // Validate required fields
  if (!receiverId || !message) {
    return res.status(400).send({ message: "Required parameter is missing" });
  }
  try {
    const newMessage = await Message.create({
      sender: id,
      receiver: receiverId,
      text: message
    });
    const conversetion = await Message.findById(newMessage._id)
  .populate({ path: "sender", select: "-password" })
  .populate({ path: "receiver", select: "-password" })
.exec();
    io.emit(`${id}-${receiverId}`, {data : conversetion  })
    io.emit(`${receiverId}-${id}`, {data : conversetion  })
    io.emit(`personal-channel-${receiverId}`, conversetion)

     res.status(201).send({
      message: "Message is sent",
      data: conversetion
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
});


messageRouter.get('/get-chat/:id', async (req, res) => {
  const senderId = req.token.user_id; // authenticated user
  const receiverId = req.params.id;   // the other user

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    })
    .populate({path : "sender" , select : "-password"})
    .populate({path : "receiver" , select : "-password"})
    .exec();

    res.status(200).json({
      message: "Messages found",
      data: messages
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
messageRouter.get('/receiver-detail/:id', async (req, res) => {
  const receiverId = req.params.id;

  try {
    const receiver = await User.findById(receiverId, "-password");

    if (!receiver) {
      return res.status(404).send({ message: "Receiver not found" });
    }

    res.status(200).send({ message: "Receiver found", receiver });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

return messageRouter
}
