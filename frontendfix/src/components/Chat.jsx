import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Users, MessageSquare } from 'lucide-react';
import { REACTIONS } from '../utils/constants';
import socketService from '../socket';
import toast from 'react-hot-toast';

const Chat = ({ roomCode, participants }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chat messages
  useEffect(() => {
    const handleChatMessage = (event) => {
      const message = event.detail;
      setMessages(prev => [...prev, message]);
    };

    window.addEventListener('chat-message', handleChatMessage);
    return () => window.removeEventListener('chat-message', handleChatMessage);
  }, []);

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    socketService.sendChatMessage(newMessage.trim());
    setNewMessage('');
  };

  // Send reaction
  const sendReaction = (emoji) => {
    socketService.sendReaction(emoji);
    setShowReactions(false);
    toast.success(`Reaction sent: ${emoji}`);
  };

  // Listen for reactions
  useEffect(() => {
    const handleReaction = (event) => {
      const { emoji, user } = event.detail;
      
      // Add reaction as a system message
      const reactionMessage = {
        id: Date.now(),
        type: 'reaction',
        content: `${user.name} reacted with ${emoji}`,
        user,
        created_at: new Date(),
        emoji
      };
      
      setMessages(prev => [...prev, reactionMessage]);
    };

    window.addEventListener('reaction', handleReaction);
    return () => window.removeEventListener('reaction', handleReaction);
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-container h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {participants.length}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 py-8"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`mb-4 ${
                  message.type === 'reaction' ? 'text-center' : ''
                }`}
              >
                {message.type === 'reaction' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    <span>{message.emoji}</span>
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {message.user?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <div className="text-gray-800 break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        {/* Reactions */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-2 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-8 gap-1">
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => sendReaction(reaction.emoji)}
                    className="p-2 hover:bg-gray-200 rounded transition-colors duration-200 text-lg"
                    title={reaction.name}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={sendMessage} className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={500}
          />
          
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
