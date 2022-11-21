const express = require("express");
const app = express();
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");

app.use(cors);
const server = http.createServer(app);
const io = new Server(server, {
    cors : {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

// Listening to events
io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on("JOIN_ROOM", (data) => {
        let room = data.typedRoom;
        let user = data.typedUser;
        console.log(`User: ${user} is joining room ${room}`)
        socket.join(room)
        socket.to(room).emit("USER_JOINED", {room, user});
    })

    socket.on("SEND_MESSAGE", (data) => {
        let room = data.room;
        let user = data.username;
        let message = data.message;
        socket.to(room).emit("RECEIVE_MESSAGE", data)        
    })

})

server.listen(3001, () => {
    console.log("Server is running...")
})