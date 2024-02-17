const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const port = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Set this to the appropriate origin or a list of allowed origins
    methods: ["GET", "POST"]
  },
});

app.get("/", (req,res) => res.send('healthy'));
app.use(cors());
app.use(express.json());


const emailToSocketidMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);

  socket.on("room:join", (data) => {
    console.log(data);
    const { email, room } = data;
    emailToSocketidMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    socket.emit("room:join", data); // socket.emit trigger emit func the same socket
  });

  socket.on('user:call', ({to, offer}) => {
    io.to(to).emit('incoming:call', {from:socket.id, offer});
  });

  socket.on('call:accepted', ({to, ans}) => {
    io.to(to).emit('call:accepted', {from:socket.id, ans});
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // socket.on("disconnect", (err) => {
  //   console.log(`User DisConnected by ID: ${socket.id}`);
  // });
});

server.listen(port, () => {
  console.log("Server is running at:", port);
});
