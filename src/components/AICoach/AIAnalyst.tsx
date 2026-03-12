import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "../GlassCard";
import { Trade } from "@/lib/tradeTypes";
import { processAIQuery } from "@/lib/aiCoach";
import { Send, User, Bot, Sparkles, Trash2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIAnalystProps {
  trades: Trade[];
}

export function AIAnalyst({ trades }: AIAnalystProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "assistant", 
      content: "Hello! I've analyzed your trade history. Ask me anything about your performance, risk, or patterns." 
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: processAIQuery(trades, input)
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 600);
  };

  const clearChat = () => {
    setMessages([{ 
      id: Date.now().toString(), 
      role: "assistant", 
      content: "Chat cleared. What would you like to analyze next?" 
    }]);
  };

  return (
    <GlassCard className="flex flex-col h-[600px] p-0 overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/5 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">AI Trading Analyst</h3>
            <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">AI Analysis Active</span>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-loss hover:bg-loss/10 transition-all group flex items-center gap-2"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase hidden sm:block">Clear Chat</span>
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-black/20"
      >
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${
                  m.role === "user" ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]" : "bg-white/10 text-white"
                }`}>
                  {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl border ${
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20" 
                    : "bg-white/5 border-white/10 rounded-tl-none text-foreground/90"
                }`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/10 bg-background/80 backdrop-blur-xl relative z-10">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your AI coach about your edge..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/50 active:scale-[0.99]"
          />
          <button
            onClick={handleSend}
            className="p-3 bg-primary text-primary-foreground rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
             <History className="w-3 h-3 text-muted-foreground" />
             <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Recommended Queries</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["What is my win rate?", "Why did I lose money?", "Best pair?", "Revenge trading risk?", "Session performance"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-muted-foreground hover:bg-white/10 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

