require('dotenv').config();
const express = require('express');
const app = express();
const db = require(__dirname + '/modules/db_connect');
//讀寫檔案
const fs = require('fs').promises;
// app.set('view engine', 'ejs')
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const dayjs = require('dayjs');

dotenv.config();


app.set('view engine', 'ejs')
// top middleware

app.use(cors())
// 解析Form表單
app.post(multer().none(), async (req, res, next) => {
  next();
});

app.get('/', (req, res, next) => {
  res.json('<h2>首頁</h2>');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post(multer().none(), async (req, res) => {
  next();
});

// 以下新增路由 (請做備註)
//裕庭新增商品路由
const productRouter = require(__dirname + '/routes/product');
app.use('/product', productRouter);
//坤達新增診所路由
const clinicRouter = require(__dirname + '/routes/clinic');
app.use('/clinic', clinicRouter);
// 柏延新增文章路由
const forumRouter = require(__dirname + '/routes/forum');
app.use('/forum', forumRouter);
//品葳新增會員路由
const memberRouter = require(__dirname + '/routes/member');
app.use('/member', memberRouter);
//碩恩新增購物車路由
const cartRouter = require(__dirname + '/routes/cart');
app.use('/cart', cartRouter);

// socket.io
// 將 express 放進 http 中開啟 Server 的 6003 port ， 正確開啟後console印出訊息
const socketPort = 3001 || 30002;
const server = require('http')
  .Server(app)
  .listen(socketPort, () => {
    console.log(`open socket server! port:${socketPort}`);
  });

// 將啟動的 Server 送給 socket.io 處理
const io = require('socket.io')(server, {
  // cors 讓 localhost 可跨 port 連接
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const CHAT_BOT = 'ChatBot';
let chatRoom = '';
let allUsers = [];
const leaveRoom = require('./utils/leave-room');

// 監聽 Server 連線後的所有事件，並捕捉事件 socket 執行
io.on('connection', (socket) => {

  console.log(`User Connected: ${socket.id}`);

  // Add a user to a room
  socket.on('join_room', (data) => {
    const { username, room } = data; // Data sent from client when join_room event emitted
    socket.join(room); // Join the user to a socket room

    let __createdtime__ = Date.now();
    // send msg to all users in the room when new user that just joined
    socket.to(room).emit('receive_message', {
      message: `${username} has joined the room!`,
      username: CHAT_BOT,
      __createdtime__,
    });

    // welcome msg
    socket.emit('receive_message', {
      message: `Welcome ${username}`,
      username: CHAT_BOT,
      __createdtime__,
    });

    chatRoom = room;
    allUsers.push({ id: socket.id, username, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit('chatroom_users', chatRoomUsers);
    socket.emit('chatroom_users', chatRoomUsers);
  });

  socket.on('send_message', (data) => {
    const { message, username, room, __createdtime__ } = data;
    io.in(room).emit('receive_message', data);
    // TODO save msg into MySQL ?
  });

  // leave room
  socket.on('leave_room', (data) => {
    const { username, room } = data;
    socket.leave(room);
    const __createdtime__ = Date.now();
    // Remove user from memory
    allUsers = leaveRoom(socket.id, allUsers);
    socket.to(room).emit('chatroom_users', allUsers);
    socket.to(room).emit('receive_message', {
      username: CHAT_BOT,
      message: `${username} has left the chat`,
      __createdtime__,
    });
    console.log(`${username} has left the chat`);
  });

  // disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected from the chat');
    const user = allUsers.find((user) => user.id == socket.id);
    if (user?.username) {
      allUsers = leaveRoom(socket.id, allUsers);
      socket.to(chatRoom).emit('chatroom_users', allUsers);
      socket.to(chatRoom).emit('receive_message', {
        message: `${user.username} has disconnected from the chat.`,
      });
    }
  });
});

app.use(express.static('public'));

// --------404-------------

app.use((req, res) => {
  res.status(404).send('Error! NOT FOUND');
});

const port = process.env.SERVER_PORT || 6002;

app.listen(port, () => console.log(`server started, port:${port}`));
