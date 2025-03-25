"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { EmojiClickData } from "emoji-picker-react";

const socket = io("http://192.168.29.109:4000", {
  transports: ["websocket", "polling"],
});

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { text: string; sender: string; private?: boolean }[]
  >([]);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [_userId, setUserId] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [privateChat, setPrivateChat] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [roomMessages, setRoomMessages] = useState<
    { text: string; sender: string }[]
  >([]);
  useEffect(() => {
    socket.on("connect", () => {
      if (socket.id) setUserId(socket.id);
    });

    socket.on("chat message", ({ message, sender }) => {
      setMessages((prev) => [...prev, { text: message, sender }]);
    });

    socket.on("private message", ({ message, sender }) => {
      setMessages((prev) => [
        ...prev,
        { text: message, sender, private: true },
      ]);
    });

    return () => {
      socket.off("chat message");
      socket.off("private message");
    };
  }, []);

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
    setPrivateChat(null);
  };

  const sendMessage = () => {
    if (message.trim()) {
      if (privateChat) {
        socket.emit("private message", {
          to: privateChat,
          message,
          sender: username,
        });

        setMessages((prev) => [
          ...prev,
          { text: message, sender: username, private: true },
        ]);
      } else {
        socket.emit("chat message", { message, sender: username });
      }
      setMessage("");
      setShowEmojiPicker(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const addEmoji = (emoji: EmojiClickData) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  const startPrivateChat = (user: string) => {
    if (user !== username) {
      setRoomMessages(messages);
      setPrivateChat(user);
      setMessages([]);
    }
  };

  const goBackToRoom = () => {
    setMessages(roomMessages); // Restore old room messages
    setPrivateChat(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-sm h-screen bg-gray-800 shadow-lg rounded-lg flex flex-col">
        {!joined ? (
          <div className="p-6 flex flex-col space-y-4 text-white">
            <h1 className="text-lg font-semibold text-center">
              Join &quot;brainspack&quot; Chat
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
              <span>
                {privateChat
                  ? `Chat with ${privateChat}`
                  : "Live Chat - brainspack"}
              </span>
              <button
                className="bg-red-500 px-3 py-1 rounded"
                onClick={privateChat ? goBackToRoom : leaveRoom}
              >
                {privateChat ? "Back" : "Leave"}
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
                      msg.private
                        ? "bg-green-500 text-white"
                        : msg.sender === "System"
                        ? "bg-gray-500 text-white text-center w-full"
                        : msg.sender === username
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <span
                      className="block font-semibold cursor-pointer hover:underline"
                      onClick={() => startPrivateChat(msg.sender)}
                    >
                      {msg.sender === username ? "You" : msg.sender}
                    </span>
                    <span>{msg.text}</span>
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
                  }
                }}
              />
              <button
                className="ml-3 bg-blue-600 hover:bg-blue-700 p-2 rounded-full"
                onClick={sendMessage}
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
