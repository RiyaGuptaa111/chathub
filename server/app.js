import express from "express";
import userRoute from './routes/userRoute.js'
// import { connectDB } from "./utils/features.js";
import dotenv from 'dotenv'
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from 'cookie-parser';
import { connectDB } from "./utils/features.js";
import chatRoute from './routes/chatRoute.js'
import adminRoute from './routes/adminRoute.js'
import { Server } from "socket.io";
import { createGroupChats, createMessages, createMessagesInAChat, createSingleChats } from "./seeders/chatSeeder.js";
// import { createUser } from "./seeders/userSeeder.js";
import {createServer} from "http"
import { Message } from "./models/messageModels.js";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/event.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import cors from 'cors'
import { v2 as cloudinary } from "cloudinary";
import { socketAuthenticator } from "./middlewares/auth.js";
import { corsOptions } from "./constants/config.js";


dotenv.config({
    path:"./.env",
})
export const adminSecretKey=process.env.ADMIN_SECRET_KEY || "nkdbfkbhfkg"
const port=9000;
const userSocketIDs = new Map();
const onlineUsers = new Set();


connectDB("mongodb://localhost:27017")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// createUser(10);
// createSingleChats(10);
//  /createGroupChats(10);
// createMessagesInAChat("6750ad0560c9cf7bbc7db373",5)
// createMessages(10)
const app=express();
const server= createServer(app)
const io=new Server(server,{cors:corsOptions})

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.set("io", io);

app.use('/api/v1/user',userRoute);
app.use('/api/v1/chat',chatRoute)
app.use('/api/v1/admin',adminRoute)

app.get("/",(req,res)=>{
    res.send("Hello world");
})

io.use((socket, next) => {
    cookieParser()(
      socket.request,
      socket.request.res,
      async (err) => await socketAuthenticator(err, socket, next)
    );
  });
  
io.on("connection", (socket) => {
    const user = socket.user;
    // console.log(user);
    
    userSocketIDs.set(user._id.toString(), socket.id);//online users
//   console.log(userSocketIDs);
  
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
  
      const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId,
      };
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });//alert of 4 new messages
  
      try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }
    });
  
    socket.on(START_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(START_TYPING, { chatId });
    });
  
    socket.on(STOP_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    });
  
    socket.on(CHAT_JOINED, ({ userId, members }) => {
      onlineUsers.add(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  
    socket.on(CHAT_LEAVED, ({ userId, members }) => {
      onlineUsers.delete(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  
    socket.on("disconnect", () => {
      userSocketIDs.delete(user._id.toString());
      onlineUsers.delete(user._id.toString());
      socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  });

app.use(errorMiddleware)
server.listen(port,()=>{
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
    
})
export {userSocketIDs}