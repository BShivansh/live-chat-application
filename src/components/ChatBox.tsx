"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { EmojiClickData } from "emoji-picker-react";
import { chatValidationSchema } from "./validationSchema";
import * as Yup from "yup";

const socket = io("http://10.250.32.74:4000", {
  transports: ["websocket", "polling"],
});

const getAvatarColor = (username: string) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({ username: "", phone: "" });
  const [, setUserId] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [privateChat, setPrivateChat] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [roomMessages, setRoomMessages] = useState<
    { text: string; sender: string }[]
  >([]);
  const [privateMessages, setPrivateMessages] = useState<
    Record<string, { text: string; sender: string }[]>
  >({});

  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );

  useEffect(() => {
    socket.on("connect", () => {
      if (socket.id) setUserId(socket.id);
    });

    socket.on("chat message", ({ message, sender }) => {
      setRoomMessages((prev) => [...prev, { text: message, sender }]);

      if (!privateChat) {
        setMessages((prev) => [...prev, { text: message, sender }]);
      }
    });

    socket.on("private message", ({ message, sender }) => {
      setPrivateMessages((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), { text: message, sender }],
      }));

      if (privateChat === sender) {
        setMessages((prev) => [...prev, { text: message, sender }]);
      }
    });

    return () => {
      socket.off("chat message");
      socket.off("private message");
    };
  }, [privateChat]);

  const validateForm = async () => {
    try {
      await chatValidationSchema.validate(
        { username, phone },
        { abortEarly: false }
      );
      setErrors({ username: "", phone: "" });
      return true;
    } catch (validationErrors) {
      const newErrors: { username: string; phone: string } = {
        username: "",
        phone: "",
      };
      (validationErrors as Yup.ValidationError).inner.forEach((error) => {
        if (error.path)
          newErrors[error.path as keyof typeof newErrors] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const joinRoom = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    socket.emit("join room", { username, phone });
    setJoined(true);
  };

  const leaveRoom = () => {
    socket.emit("leave room", { username });
    setJoined(false);
    setRoomMessages([]);
    setPrivateChat(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (message.trim()) {
      if (privateChat) {
        socket.emit("private message", {
          to: privateChat,
          message,
          sender: username,
        });

        setPrivateMessages((prev) => ({
          ...prev,
          [privateChat]: [
            ...(prev[privateChat] || []),
            { text: message, sender: username },
          ],
        }));

        setMessages((prev) => [...prev, { text: message, sender: username }]);
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
      setPrivateChat(user);
      setMessages(privateMessages[user] || []);
    }
  };

  const goBackToRoom = () => {
    if (privateChat) {
      setPrivateMessages((prev) => ({
        ...prev,
        [privateChat]: messages,
      }));
    }

    setMessages(roomMessages);
    setPrivateChat(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div
        className={`w-full max-w-md ${
          joined ? "h-[90vh]" : "h-auto"
        } bg-white dark:bg-gray-800 shadow-2xl rounded-xl flex flex-col overflow-hidden`}
      >
        {!joined ? (
          <div className="p-6 flex flex-col space-y-2 text-white h-[350px] ">
            <h1 className="text-lg font-semibold text-center mb-4">
              Join &quot;brainspack&quot; Chat
            </h1>

            <input
              className={`p-2 rounded-lg ${
                errors.username ? "border-red-500" : "border-gray-700"
              } bg-gray-700 border`}
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="h-[20px]">
              {errors.username && (
                <span className="text-red-500 text-sm">{errors.username}</span>
              )}
            </div>

            <input
              className={`p-2 rounded-lg ${
                errors.phone ? "border-red-500" : "border-gray-700"
              } bg-gray-700 border`}
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="h-[20px] mb-8">
              {errors.phone && (
                <span className="text-red-500 text-sm">{errors.phone}</span>
              )}
            </div>

            <div className="flex justify-center">
              <button
                className="bg-blue-600 p-2 rounded-lg w-[150px]"
                onClick={joinRoom}
              >
                Join Chat
              </button>
            </div>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start ${
                    msg.sender === username ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender !== username && (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 text-white font-bold ${getAvatarColor(
                        msg.sender
                      )}`}
                    >
                      {msg.sender ? msg.sender.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 max-w-[70%] rounded-lg shadow-sm flex items-start ${
                      privateChat
                        ? "bg-green-500 text-white"
                        : msg.sender === "System"
                        ? "bg-gray-500 text-white text-center w-full"
                        : msg.sender === username
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <div>
                      <span
                        className="block font-semibold cursor-pointer hover:underline"
                        onClick={() => startPrivateChat(msg.sender)}
                      >
                        {msg.sender === username ? "You" : msg.sender}
                      </span>
                      <span>{msg.text}</span>
                    </div>
                  </div>

                  {msg.sender === username && (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ml-2 text-white font-bold ${getAvatarColor(
                        username
                      )}`}
                    >
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
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
