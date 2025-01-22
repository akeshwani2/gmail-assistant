'use client';

import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load token from localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('gmail_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (response) => {
      // Save token to state and localStorage
      setAccessToken(response.access_token);
      localStorage.setItem('gmail_access_token', response.access_token);
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    // Add prompt to ensure we always get a fresh token
    prompt: 'consent'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !accessToken) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="flex flex-col h-screen ml-64 items-center justify-center bg-[#0a0a0a]">
        <button
          onClick={() => login()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <img src="/gmail-icon.svg" alt="" className="w-5 h-5" />
          Connect Gmail to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen ml-64 bg-[#0a0a0a]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium mb-2">Welcome to Gmail Assistant</p>
            <p className="text-sm">Ask me anything about your emails!</p>
          </div>
        )}
        
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div>{message.content}</div>
              )}
              {message.timestamp && (
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Message */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-800 p-4 bg-[#0a0a0a]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center bg-gray-800 rounded-xl px-4 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gmail Assistant anything..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none py-2"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:hover:text-blue-500"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
