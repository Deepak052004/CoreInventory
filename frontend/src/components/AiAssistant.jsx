import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your CoreInventory AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { 
        // Send history so AI remembers context
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) 
      });
      
      setMessages(prev => [...prev, { role: res.data.role || 'assistant', content: res.data.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: err.response?.data?.message || 'Sorry, I encountered an error connecting to the AI service.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 z-50 flex items-center justify-center animate-bounce-subtle"
        title="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={clsx(
      "fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300",
      isExpanded ? "w-[80vw] md:w-[600px] h-[80vh]" : "w-[350px] h-[500px]"
    )}>
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold text-sm">CoreInventory AI</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-emerald-500 rounded transition-colors">
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-emerald-500 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={clsx("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
            <span className="text-[10px] text-slate-400 mb-1 px-1 uppercase tracking-wider">{msg.role}</span>
            <div className={clsx(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-br-sm" 
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
            )}>
              {/* Very basic markdown rendering for lists and bold (a full markdown parser is better for production) */}
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className="min-h-[1rem]">
                  {line.replace(/\*\*(.*?)\*\*/g, '$1')} 
                </p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start max-w-[85%] mr-auto">
             <div className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-xs text-slate-500">AI is thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your inventory..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
