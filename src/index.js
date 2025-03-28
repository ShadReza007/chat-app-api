import express from 'express';
import authRoutes from './routes/auth.route.js';
import dotenv from 'dotenv';
import {connectDB} from './lib/db.js';
import cookieParser from 'cookie-parser';
import messageRoutes from './routes/message.route.js';
import cors from 'cors';
import {app,server} from './lib/socket.js';

dotenv.config();

const PORT=process.env.PORT;

app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin:"https://chat-app-waaf.onrender.com",
        credentials:true
    })
);

app.use("/api/auth",authRoutes);
app.use('/api/message',messageRoutes);

server.listen(PORT,()=>{
    console.log('Server is running on port : ' + PORT);
    connectDB();
})