"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react"; // ✅ Import Emoji Picker
import * as yup from "yup";

const socket = io("http://192.168.29.109:4000", {
  transports: ["websocket", "polling"],
});

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("connect", () => {
      if (socket.id) setUserId(socket.id);
    });

    socket.on("chat message", ({ message, sender }) => {
      setMessages((prev) => [...prev, { text: message, sender }]);
    });

    return () => {
      socket.off("chat message");
    };
  }, [userId]);

  const joinRoom = () => {
    if (username.trim() && phone.trim()) {
      socket.emit("join room", { username, phone });
      setJoined(true);
    } else {
      alert("Please enter your name and phone number!");
    }
  };

  const leaveRoom = () => {
    socket.emit("leave room", { username });
    setJoined(false);
    setMessages([]);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chat message", { message, sender: username });
      setMessage("");
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ✅ Keep the emoji picker open after selecting emojis
  const addEmoji = (emoji: any) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-sm h-screen bg-gray-800 shadow-lg rounded-lg flex flex-col">
        {!joined ? (
          <div className="p-6 flex flex-col space-y-4 text-white">
            <h1 className="text-lg font-semibold text-center">
              Join "brainspack" Chat
            </h1>
            <input
              className="p-2 bg-gray-700 rounded-lg"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="p-2 bg-gray-700 rounded-lg"
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="bg-blue-600 p-2 rounded-lg" onClick={joinRoom}>
              Join Chat
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-600 text-white text-lg font-semibold p-4 flex justify-between">
              <span>Live Chat - brainspack</span>
              <button
                className="bg-red-500 px-3 py-1 rounded"
                onClick={leaveRoom}
              >
                Leave
              </button>
            </div>

            {/* Messages Box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === username ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 max-w-[70%] rounded-lg ${
                      msg.sender === "System"
                        ? "bg-gray-500 text-white text-center w-full"
                        : msg.sender === username
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="p-3 border-t border-gray-700 bg-gray-900 flex items-center relative">
              <button
                className="mr-3 text-white"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😀
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-3">
                  <EmojiPicker onEmojiClick={addEmoji} />
                </div>
              )}
              <input
                type="text"
                className="flex-1 p-2 bg-gray-800 rounded-lg text-white placeholder-gray-400"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                    setShowEmojiPicker(false);
                  }
                }}
              />
              <button
                className="ml-3 bg-blue-600 hover:bg-blue-700 p-2 rounded-full"
                onClick={() => {
                  sendMessage();
                  setShowEmojiPicker(false);
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
