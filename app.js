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
  const userId = socket.id;
    connectedUsers[userId] = socket;

    let { from , to } = connectedUsers
    msgs(socket, from, to);

    socket.on("chat", async({ from , to, message }) => {
      const {rows } = await client.query('insert into chats(message ,from_id , to_id ) values($1,$2,$3)',[message ,from, to])
     socket.emit('chat',({ from , to, message }))
    });

    socket.on("disconnect", () => {
      delete connectedUsers[userId];
      console.log(`User disconnected with ID: ${userId}`);
    });
});

app.post("/target_user", (req, res) => {

  let userId = req.body.userId
  let targetUser = req.body.targetUser;
  connectedUsers.from = userId
  connectedUsers.to = targetUser
  res.json('done')
});

const msgs = async (socket, userId, targetUser) => {
  let {rows} = await client.query(
    "select * from chats where (from_id = $1 and to_id = $2) or (from_id = $2 and to_id = $1) order by delivered_at",
    [userId, targetUser]
  );
  rows.map((msg) => {
    socket.emit("chat", { from: msg.from_id , to : msg.to_id, message: msg.message });
  });
};


server.listen(6001,()=>{
    console.log("server listening on port 6001")
})