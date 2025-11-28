// import express from "express";
import express from "express";
import { acceptFriendRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../controllers/userControllers.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();

app.post("/new",singleAvatar,registerValidator(),validateHandler,newUser);
app.post("/login",loginValidator(),validateHandler,login);

app.use(isAuthenticated)
//after here user must be logged in
app.get('/me',getMyProfile)
app.get('/logout',logout)
app.get('/search',searchUser)
app.put('/sendrequest',sendRequestValidator(),validateHandler,sendFriendRequest) //raw data
app.put('/acceptrequest',acceptRequestValidator(),validateHandler,acceptFriendRequest) //raw data
app.get('/notifications',getMyNotifications)
app.get('/friends',getMyFriends)

export default app

