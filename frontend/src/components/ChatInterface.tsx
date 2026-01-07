'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatWebSocket, createTask } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  isError?: boolean;
}

interface ChatInterfaceProps {
  onTasksUpdated: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/chat/ws';

export default function ChatInterface({ onTasksUpdated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hi! I'm your AI task assistant. I can help you create, update, list, and delete tasks. Just tell me what you need!",
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);

  useEffect(() => {
    const ws = new ChatWebSocket(
      WS_URL,
      (payload) => {

        if (!payload) return;

        const type = payload.type || 'agent';
        const text = typeof payload.message === 'string' ? payload.message : String(payload.message ?? '');
        const isDone = payload.done || type === 'done';

        if (type === 'chunk') {
          // streaming chunk: append to the current streaming agent message or create one
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.sender === 'agent' && last.id.startsWith('agent-stream-')) {
              const updated = [...prev.slice(0, -1), { ...last, text: last.text + text }];
              return updated;
            }
            const newMsg = {
              id: 'agent-stream-' + Date.now().toString(),
              text,
              sender: 'agent' as const,
              timestamp: new Date(),
            };
            return [...prev, newMsg];
          });
        } else if (type === 'agent' || type === 'done') {
          // final agent message
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text,
              sender: 'agent',
              timestamp: new Date(),
            },
          ]);
          // Only set loading to false if message is marked as done or final
          if (isDone) {
            setIsLoading(false);
            onTasksUpdated();
          }
        } else if (type === 'error') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: text || "An error occurred. Please try again.",
              sender: 'agent',
              timestamp: new Date(),
              isError: true,
            },
          ]);
          setIsLoading(false);
          onTasksUpdated();
        } else {
          // fallback: append raw
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), text, sender: 'agent', timestamp: new Date() },
          ]);
          setIsLoading(false);
          onTasksUpdated();
        }
      },
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    ws.connect();
    wsRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, [onTasksUpdated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    console.log("inside handleSend");

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
 
      if (wsRef.current && isConnected) {
        console.log("129 inside websocket");

        wsRef.current.send(input);
        console.log("called send");
     

      } else {
        console.log(input);
    
        const parseTaskInput = (text: string) => {
          // Assumptions: Input starts with "create a task" followed by title, then optional keywords like "priority", "due", "description".
          // Example: "create a task buy milk priority high due 2023-10-01 description get 2% milk"
          const titleMatch = text.match(/create a task (.+?)(?:\s+(?:priority|due|description))/i) || text.match(/create a task (.+)/i);
          const title = titleMatch ? titleMatch[1].trim() : text.replace(/create a task/i, '').trim();

          const priorityMatch = text.match(/priority\s+(low|medium|high)/i);
          const priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'medium'; // Default to medium

          const dueMatch = text.match(/due\s+(.+?)(?:\s+(?:description|$))/i);
          const dueDate = dueMatch ? new Date(dueMatch[1].trim()) : null; // Parse as Date or null

          const descMatch = text.match(/description\s+(.+)/i);
          const description = descMatch ? descMatch[1].trim() : '';

          return { title, priority, dueDate, description };
        };

        const { title, priority, dueDate, description } = parseTaskInput(input);

        try {
          const dueDateStr = dueDate ? dueDate.toISOString().split('T')[0] : null;
          const created = await createTask({ title, priority, due_date: dueDateStr, description });
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + '-resp',
              text: `Task created: ${created.title} (ID: ${created.id})`,
              sender: 'agent',
              timestamp: new Date(),
            },
          ]);
          onTasksUpdated();
        } catch (restErr: any) {
          console.error('REST createTask error:', restErr);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + '-err',
              text: `Failed to create task: ${restErr?.message || restErr}`,
              sender: 'agent',
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-err',
          text: `Error: ${err?.message || err}`,
          sender: 'agent',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    } finally {
      setInput('');
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header with glassmorphism */}
      {/* <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl p-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-xl">
                <Bot size={26} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                AI Assistant
                <Sparkles size={20} className="text-yellow-500 animate-spin" style={{animationDuration: '3s'}} />
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Powered by intelligent automation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full shadow-lg transition-all duration-300 ${
                isConnected ? 'bg-green-500 animate-pulse shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
              }`}
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      </div> */}

      {/* Messages Area */}
      <div className="relative flex-grow overflow-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 animate-fade-in ${message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
          >
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 hover:rotate-3 ${message.sender === 'user'
                ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-blue-500/50'
                : message.isError
                  ? 'bg-gradient-to-br from-red-100 via-red-50 to-red-100 dark:from-red-900 dark:via-red-800 dark:to-red-900 text-red-600 dark:text-red-300 shadow-red-400/30 dark:shadow-red-900/50'
                  : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 shadow-gray-400/30 dark:shadow-gray-900/50'
                }`}
            >
              {message.sender === 'user' ? <User size={22} /> : message.isError ? <span className="text-lg">⚠️</span> : <Bot size={22} />}
            </div>

            <div
              className={`max-w-[70%] rounded-2xl px-4 py-4 shadow-2xl transform transition-all hover:shadow-3xl hover:scale-[1.02] ${message.sender === 'user'
                ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-blue-500/30'
                : message.isError
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200 border-2 border-red-300 dark:border-red-700/50 backdrop-blur-xl'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border-2 border-gray-200/50 dark:border-gray-600/50 backdrop-blur-xl'
                }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.text}</p>
              <p
                className={`text-xs mt-2 font-medium ${message.sender === 'user'
                  ? 'text-blue-100'
                  : message.isError
                    ? 'text-red-600 dark:text-red-300'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 flex items-center justify-center shadow-2xl">
              <Bot size={22} className="text-gray-700 dark:text-gray-300" />
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-3xl px-6 py-4 shadow-2xl border-2 border-gray-200/50 dark:border-gray-600/50 backdrop-blur-xl">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with glassmorphism */}
      <div className="relative backdrop-blur-xl p-4 shadow-xl">
        <div className="flex gap-3">
          <div className="flex-grow relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-300/50 dark:focus:ring-blue-600/50 focus:border-blue-500 dark:bg-gray-800/50 dark:text-white shadow-lg transition-all text-[15px] backdrop-blur-xl"
              // allow typing even if WebSocket disconnected — fallback to REST create
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            // allow sending when WS disconnected — fallback to REST createTask
            disabled={!input.trim() || isLoading}
            className="relative px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 disabled:hover:scale-100 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Send size={20} className="relative z-10" />
            <span className="relative z-10 font-semibold">Send</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );


}