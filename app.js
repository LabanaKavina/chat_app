const express = require('express')
const socket = require('socket.io')
const app = express()
const http = require('http');
const server = http.createServer(app);
const bodyParser = require('body-parser')

const cors = require('cors')
const client  = require('./db')
const userRoute = require('./users')
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json())
app.use(cors({ origin: 'http://localhost:3000' }));

app.post('/login' , async(req,res) => {
    let {rows} = await client.query('select id from users where name ilike $1 and password = $2' , [req.body.name , req.body.password])

    res.json(rows)
})

app.use('/user' , userRoute)
let connectedUsers = {}

io.on("connection", (socket ) => {
  connectedUsers[socket.id] = socket;
  console.log(socket.id);
    socket.on('connected-users', async({ sender , target}) => {
      connectedUsers['from'] = sender
      connectedUsers['to'] = target
      msgs(socket, sender, target);
    })

    socket.on("send-chat", async({ from , to, message }) => {
      const {rows } = await client.query('insert into chats(message ,from_id , to_id ) values($1,$2,$3)',[message ,from, to])
      socket.emit('receive-chat',{ from , to, message })
      socket.emit('send-chat',{ to , from, message })
    });
    socket.on("disconnect", () => {
      delete connectedUsers[socket.id];
      console.log(`User disconnected with ID: ${socket.id}`);
    });
});

const msgs = async (socket, userId, targetUser) => {
  let {rows} = await client.query(
    "select * from chats where (from_id = $1 and to_id = $2) or (from_id = $2 and to_id = $1) order by delivered_at",
    [userId, targetUser]
  );
  rows.map((msg) => {
    if(msg.from_id != userId){
      socket.emit("send-chat", { from: msg.from_id , to : msg.to_id, message: msg.message });
    }
    socket.emit("receive-chat", { from: msg.from_id , to : msg.to_id, message: msg.message });
  });
};


server.listen(6001,()=>{
    console.log("server listening on port 6001")
})