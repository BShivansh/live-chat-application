import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";
import os from "os";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 4000;
const ROOM_NAME = "brainspack";
const users = {};

nextApp.prepare().then(() => {
  app.all("*", (req, res) => handle(req, res));

  function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "localhost";
  }

  io.on("connection", (socket) => {
    console.log(`🟢 User Connected: ${socket.id}`);

    socket.on("join room", ({ username, phone }) => {
      socket.join(ROOM_NAME);
      users[socket.id] = username;

      io.to(ROOM_NAME).emit("chat message", {
        message: `🔔 ${username} has joined the chat.`,
        sender: "System",
      });

      console.log(`📢 ${username} joined the room (${ROOM_NAME})`);
    });

    socket.on("chat message", ({ message, sender }) => {
      io.to(ROOM_NAME).emit("chat message", { message, sender });
    });

    socket.on("private message", ({ to, message, sender }) => {
      const recipientSocketId = Object.keys(users).find(
        (key) => users[key] === to
      );

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("private message", { message, sender });
        console.log(`📩 Private message from ${sender} to ${to}: ${message}`);
      }
    });

    socket.on("disconnect", () => {
      const username = users[socket.id];
      if (username) {
        io.to(ROOM_NAME).emit("cha t message", {
          message: `🔴 ${username} has left the chat.`,
          sender: "System",
        });

        console.log(`🔴 ${username} disconnected.`);
        delete users[socket.id];
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://${getIPAddress()}:${PORT}`);
  });
});
