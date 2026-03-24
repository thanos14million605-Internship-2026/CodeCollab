import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Users, MessageSquare } from "lucide-react";
import { useMessageStore } from "../store/messageStore";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const Chat = ({ roomId, participants }) => {
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  const { messages, getAllMessages, createMessage, addMessage } =
    useMessageStore();

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    if (roomId) getAllMessages(roomId);
  }, [roomId]);

  // Socket
  useEffect(() => {
    const handleChatMessage = (event) => addMessage(event.detail);
    window.addEventListener("chat-message", handleChatMessage);

    return () => window.removeEventListener("chat-message", handleChatMessage);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage("");

    const res = await createMessage({
      room_id: roomId,
      message: text,
    });

    if (!res.success) toast.error("Failed to send message");
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} />
          <h3 className="font-semibold">Chat</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users size={16} />
          {participants.length}
        </div>
      </div>

      {/* Messages (SCROLLABLE) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 chat-scroll">
        <AnimatePresence>
          {messages.map((message) => {
            const isMe = message.user?.id === user?.id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-black rounded-bl-none"
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-semibold mb-1">
                      {message.user?.name}
                    </div>
                  )}

                  <div>{message.content}</div>

                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isMe ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <button type="button">
            <Smile />
          </button>

          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
            placeholder="Type message..."
          />

          <button className="bg-blue-500 text-white px-3 rounded">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
