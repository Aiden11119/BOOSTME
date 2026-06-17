import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, PlusCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AIChatTab = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        // Clear history on mount so every refresh is a new session
        await api.delete('/chatbot/history');
      } catch (err) {
        console.error('Failed to clear history on mount', err);
      } finally {
        setMessages([
          { role: 'ai', text: 'Hello! I am your BoostMe AI Assistant. I can help you find a mentor, book an appointment, or just be here to listen if you need to talk. How can I help you today?' }
        ]);
        setIsFetchingHistory(false);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isFetchingHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const updatedMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await api.post('/chatbot/chat', { message: userMessage });

      if (res.data && res.data.reply) {
        setMessages([...updatedMessages, { role: 'ai', text: res.data.reply }]);
      } else {
        throw new Error('No reply from server');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to get response from AI');
      setMessages([...updatedMessages, { role: 'ai', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed manual New Session handler

  if (isFetchingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] sm:h-[calc(100vh-130px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">AI Assistant</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Your 24/7 personalized counselor</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`} style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%] flex-row">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-tl-none flex items-center gap-2 text-[14px]">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-[14px] transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm transform hover:-translate-y-0.5 disabled:transform-none flex items-center gap-2 font-medium text-[14px]"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatTab;
