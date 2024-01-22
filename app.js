const express = require('express')
const socket = require('socket.io')
const app = express()
const http = require('http');
const server = http.createServer(app);
const io = socket(server)


io.on('connection',(socket)=>{

console.log("user connected");

socket.on('disconnect',()=>{
    console.log("user disconnected");
})

socket.on('chat', (msg)=>{
    io.emit("chat",msg)
    console.log(msg);
})

})



server.listen(6000,()=>{
    console.log("server listening on port 6000")
})