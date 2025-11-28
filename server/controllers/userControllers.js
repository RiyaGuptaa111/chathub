import { compare } from "bcrypt";
import { User } from "../models/userModel.js";
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from '../utils/utility.js';
import { Chat } from "../models/chatModels.js";
import { Request } from "../models/requestModels.js";
import { TryCatch } from "../middlewares/error.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";



// //create a new user
// const newUser=async(req,res)=>{

//     const {name,username,password,bio}=req.body;
//     console.log(req.body);
    
//     const avatar={
//         public_id:"hhddf",
//         url:"hbdsvh",
//     };

//     const user=await User.create({
//         name,
//         bio,
//         username,
//         password,
//         avatar,
//     });
//     sendToken(res,user,201,"User created successfully");
// };


//   //login user and save token in cookie
// const login=async(req,res,next)=>{
//    try {
//     const {username,password}=req.body;

//     const user=await User.findOne({username}).select("+password");
//     if(!user) return next(new ErrorHandler("Invalid username Or Password",404));

//     const isMatch=await compare(password,user.password);

//     if(!isMatch) return next(new ErrorHandler("Invalid username Or Password",404));

//     sendToken(res,user,200,`Welcome Back,${user.name}`);
//    } catch (error) {
//     console.log("error");
    
//    }
// };

// const getMyProfile=async(req,res)=>{
//     try {
//         const user=await User.findById(req.user);
//          res.status(200).json({
//         success:true,
//         user,
//     })
//     } catch (error) {
//         res.json({success:false,message:"Error"}) 
//     }
// }

// const logout=async(req,res)=>{
//     try {
//         return res.status(200)
//         .cookie("chatapp-token","",{...cookieOptions,maxAge:0})
//         .json({
//         success:true,
//         message:"Logged out successfully",
//     });
// } catch (error) {
//        console.log("Error");
       
// }
// }

// const searchUser=async(req,res)=>{
//     try {
//         const {name}=req.query;
//         return res.status(200)
//         .json({
//         success:true,
//         message:name,
//     });
// } catch (error) {
//        console.log("Error");
       
// }
// }

// export {login,newUser,getMyProfile,logout,searchUser};

const login=async(req,res,next)=>{
    try {
      console.log("testt");
      
        const {username,password}=req.body;

    const user=await User.findOne({username}).select("+password");
    console.log("test1");
    
    if(!user) return next(new ErrorHandler("Invalid username Or Password",404));
    // if(!user) return res.status(400).json({message:"Invalid username Or Password"})

    const isMatch=await compare(password,user.password);

    if(!isMatch) return next(new ErrorHandler("Invalid username Or Password",404));

console.log("test2");

    sendToken(res,user,200,`Welcome Back,${user.name}`);
    console.log("test3");
    
    } catch (error) {
        next(error);
    }
};  


const newUser=async(req,res,next)=>{
    const {name,username,password,bio}=req.body;
    const file=req.file;
   
    if(!file) return next(new ErrorHandler("Please upload avatar"));
    
    const result=await uploadFilesToCloudinary([file]);
    
    const avatar={
                public_id:result[0].public_id,
                url:result[0].url,
            };
              
    const user=await User.create({
        name,
        username,
        bio,
         password,
        avatar
    });
        console.log("5");
        
     sendToken(res,user,201,"User created Successfully")
   console.log("created");
   
};
const getMyProfile=async(req,res,next)=>{
    try {
        const user=await User.findById(req.user);

    res.status(200).json({
        success:true,
        user,
    })
    } catch (error) {
        next(error)
    }
}

const logout=async(req,res,next)=>{
        try {
            return res.status(200)
            .cookie("chathub-token","",{...cookieOptions,maxAge:0})
            .json({
            success:true,
            message:"Logged out successfully",
        });
    } catch (error) {
           console.log("Error");
           
    }}

const searchUser=async(req,res)=>{//search people who are not friends by giving any name prompt to search
            try {
                const {name=""}=req.query;
                const myChats=await Chat.find({groupChat:false,members:req.user});
                const allUsersFromMyChats=myChats.flatMap((chat)=>chat.members)
                //flat used to remove our id as in each chat we are common

                const allUsersExceptMeAndFriends=await User.find({
                    _id:{ $nin:allUsersFromMyChats},
                    name:{ $regex:name,$options:"i"}, //to find patttern match names only
                })

                const users=allUsersExceptMeAndFriends.map(({_id,name,avatar})=>({ //to show only name,id and avatar in search box
                    _id,
                    name,
                    avatar:avatar.url,
                }));

                return res.status(200)
                .json({
                success:true,
                users,
            });
        } catch (error) {
               console.log("Error");           
        }
}

const sendFriendRequest = TryCatch(async (req, res, next) => {
    const { userId } = req.body;
  
    const request = await Request.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });
  
    if (request) return next(new ErrorHandler("Request already sent", 400));
  
    await Request.create({
      sender: req.user,
      receiver: userId,
    });
  
    emitEvent(req, NEW_REQUEST, [userId]);
  
    return res.status(200).json({
      success: true,
      message: "Friend Request Sent",
    });
  });
  
  const acceptFriendRequest = TryCatch(async (req, res, next) => {
    const { requestId, accept } = req.body;
  
    const request = await Request.findById(requestId)
      .populate("sender", "name")
      .populate("receiver", "name");
  
    if (!request) return next(new ErrorHandler("Request not found", 404));
  
    if (request.receiver._id.toString() !== req.user.toString())
      return next(
        new ErrorHandler("You are not authorized to accept this request", 401)
      );
  
    if (!accept) {//if we decline request , delete request
      await request.deleteOne();
  
      return res.status(200).json({
        success: true,
        message: "Friend Request Rejected",
      });
    }
  
    const members = [request.sender._id, request.receiver._id];
  
    await Promise.all([
      Chat.create({
        members,
        name: `${request.sender.name}-${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);
  
    emitEvent(req, REFETCH_CHATS, members);
  
    return res.status(200).json({
      success: true,
      message: "Friend Request Accepted",
      senderId: request.sender._id,
    });
  });
  
  const getMyNotifications = TryCatch(async (req, res) => {
    const requests = await Request.find({ receiver: req.user }).populate(
      "sender",
      "name avatar"
    );
  
    const allRequests = requests.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    }));
  
    return res.status(200).json({
      success: true,
      allRequests,
    });
  });
  
  const getMyFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId;
  
    const chats = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");
  
    const friends = chats.map(({ members }) => {
      const otherUser = getOtherMember(members, req.user);
  
      return {
        _id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar.url,
      };
    });
  
    if (chatId) {
      const chat = await Chat.findById(chatId);
  
      const availableFriends = friends.filter(
        (friend) => !chat.members.includes(friend._id)
      );
  
      return res.status(200).json({
        success: true,
        friends: availableFriends,
      });
    } else {
      return res.status(200).json({
        success: true,
        friends,
      });
    }
  });
  
    
  export {
    acceptFriendRequest,
    getMyFriends,
    getMyNotifications,
    getMyProfile,
    login,
    logout,
    newUser,
    searchUser,
    sendFriendRequest,
  };