import express from "express"
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chatControllers.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import { addMemberValidator, chatIdValidator, leaveGroupValidator, newGroupValidator, removeMemberValidator, renameValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();

//after here user must be logged in to access the routes
app.use(isAuthenticated);

app.post("/new",newGroupValidator(),validateHandler,newGroupChat)//raw
app.get('/my',getMyChats)
app.get('/my/groups',getMyGroups)
app.put('/addMembers',addMemberValidator(),validateHandler,addMembers)//raw
app.put('/removeMember',removeMemberValidator(),validateHandler,removeMember)
app.delete('/leave/:id',leaveGroupValidator(),validateHandler,leaveGroup) //dynamic route

app.post('/message',attachmentsMulter,sendAttachmentsValidator(),validateHandler,sendAttachments)//form data

app.get('/message/:id',chatIdValidator(),validateHandler,getMessages)//id of a chat or a group you are in
app.route('/:id').get(chatIdValidator(),validateHandler,getChatDetails).put(renameValidator(),validateHandler,renameGroup).delete(chatIdValidator(),validateHandler,deleteChat);
export default app;
