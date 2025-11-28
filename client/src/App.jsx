import React, { lazy, Suspense, useEffect } from 'react'
import {BrowserRouter,Routes,Route} from "react-router-dom"
import ProtectRoute from './components/styles/auth/ProtectRoute.jsx';
import {Loaders} from './components/layout/Loaders.jsx';
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Chat = lazy(() => import("./pages/Chat"));
const Groups = lazy(() => import("./pages/Groups"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ChatManagement = lazy(() => import("./pages/admin/ChatManagement"));
const MessagesManagement = lazy(() =>
  import("./pages/admin/MessageManagement")
);
import { useDispatch, useSelector } from "react-redux";
import { userExists, userNotExists } from "./redux/reducers/auth";
import axios from 'axios';
import { server } from './constants/config.js';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './socket.jsx';

const App = () => {
  const { user,loader } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  useEffect(()=>{
    axios
    .get(`${server}/api/v1/user/me`,{ withCredentials: true})
    .then(({data})=>dispatch(userExists(data.user)))
    .catch((err)=>dispatch(userNotExists()));
  },[dispatch])

  return loader?(
    <Loaders/>
  ):(
    <BrowserRouter>
    <Suspense fallback={<Loaders/>}>
    
    <Routes>
       
       <Route element={<SocketProvider><ProtectRoute user={user}/></SocketProvider>}>
               {/* <Route element={<ProtectRoute user={user}/>}>  */}

            <Route path='/' element={<Home/>}></Route>
            <Route path='/chat/:chatId' element={<Chat/>}></Route>
            <Route path='/groups' element={<Groups/>}></Route>
       </Route>

        <Route path='/login'
         element={<ProtectRoute user={!user} redirect='/'>
          <Login/>
         </ProtectRoute>}>
         </Route>

{/* <Route path='/login'
         element={user?<Home/>:<Login/>}></Route> */}

         <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} /> 
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/chats" element={<ChatManagement />} />
          <Route path="/admin/messages" element={<MessagesManagement />} />

         <Route path='*' element={<NotFound/>}></Route>

      </Routes>
    </Suspense>
      <Toaster position='bottom-center'/>
    </BrowserRouter>
  )
}

export default App
