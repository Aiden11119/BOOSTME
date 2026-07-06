import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
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
        // Check if this is a new browser session
        const isNewBrowserSession = !sessionStorage.getItem('chatSessionStarted');
        
        if (isNewBrowserSession) {
          // It's a new browser session (e.g. they just opened the tab), clear the history in DB
          await api.delete('/chatbot/history');
          sessionStorage.setItem('chatSessionStarted', 'true');
          
          setMessages([
            { role: 'ai', text: 'Hello! I am your BoostMe AI Assistant. I can help you find a mentor, book an appointment, or just be here to listen if you need to talk. How can I help you today?' }
          ]);
        } else {
          // They are just navigating within the same tab, fetch history
          const res = await api.get('/chatbot/history');
          const history = res.data;
          
          if (history && history.length > 0) {
            setMessages(history);
          } else {
            setMessages([
              { role: 'ai', text: 'Hello! I am your BoostMe AI Assistant. I can help you find a mentor, book an appointment, or just be here to listen if you need to talk. How can I help you today?' }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session', err);
        setMessages([
          { role: 'ai', text: 'Hello! I am your BoostMe AI Assistant. I can help you find a mentor, book an appointment, or just be here to listen if you need to talk. How can I help you today?' }
        ]);
      } finally {
        setIsFetchingHistory(false);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const aiMessageId = Date.now();
    setMessages(prev => [
      ...prev, 
      { role: 'user', text: userMessage },
      { role: 'ai', text: '', id: aiMessageId }
    ]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let aiResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        setIsLoading(false); // Stop loading animation once streaming starts

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (let line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                aiResponseText += parsed.text;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg
                ));
              } else if (parsed.error) {
                toast.error(parsed.error);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to get response from AI');
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Sorry, I am having trouble connecting right now. Please try again later.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all z-50 animate-bounce"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-sm">BoostMe AI Assistant</h3>
                <p className="text-xs text-indigo-200">Online & ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'}`} style={{ whiteSpace: 'pre-wrap' }}>
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
                  <div className="p-3 bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-400 mt-2">AI can make mistakes. Check important info.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
