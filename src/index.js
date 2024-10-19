require('dotenv').config()

const express = require('express');
const http = require('http');
const mongoose=require('mongoose')
const { Server } = require('socket.io');
const authRoutes  = require('./routes/authRoutes');
const roomRoutes= require('./routes/roomRoutes')
const msgRoutes=require('./routes/msgRoutes')
const socketHandler = require('./socketHandler');
const cors=require('cors')

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"*",
  }
});

mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth/',authRoutes)
app.use('/api/room/',roomRoutes)
app.use('/api/msg/',msgRoutes)

socketHandler(io)

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
