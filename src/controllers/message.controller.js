import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketID, io } from '../lib/socket.js';

export const getUsersForSidebar = async (req, res) => {
    try{
        const loggedInUserID=req.user._id;
        const filteredUsers=await User.find({ _id: { $ne: loggedInUserID } }).select('-password');

        res.status(200).json(filteredUsers);
    }catch(error){
        console.log("Error in getUsersForSidebar controller: ",error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params;
      const myId = req.user._id;
  
      const messages = await Message.find({
        $or: [
          { senderID: myId, receiverID: userToChatId },
          { senderID: userToChatId, receiverID: myId },
        ],
      });
  
      res.status(200).json(messages);
    } catch (error) {
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const sendMessage = async (req, res) => {
    try{
        const {text,image} = req.body;
        const {id:receiverID} = req.params;
        const senderID=req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl=uploadResponse.secure_url;
        }

        const newMessage=new Message({
            senderID,
            receiverID,
            text,
            image:imageUrl
        });

        await newMessage.save();

        const receiverSocketID = getReceiverSocketID(receiverID);
        if(receiverSocketID){
            io.to(receiverSocketID).emit('newMessage',newMessage);
        }

        res.status(200).json(newMessage);

    }catch(error){
        console.log("Error in sendMessage controller: ",error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}