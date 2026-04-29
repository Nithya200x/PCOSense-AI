"use client";

import { useEffect, useState } from "react";
import { Send, Bot, User, Mic, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get, set, push } from "firebase/database";

export default function ChatAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your PCOSense AI companion. How are you feeling today? You can ask me about your symptoms, diet, or track your cycle." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load chat history for the user from Firebase
  useEffect(() => {
    if (user) {
      const chatRef = ref(database, `users/${user.uid}/chats`);
      get(chatRef).then((snapshot) => {
        if (snapshot.exists()) {
          setMessages(snapshot.val());
        }
      });
    }
  }, [user]);

  // Persist messages whenever they change
  useEffect(() => {
    if (user && messages.length > 1) { // length > 1 prevents overwriting with default array if db fetch is delayed
       const chatRef = ref(database, `users/${user.uid}/chats`);
       set(chatRef, messages);
    }
  }, [messages, user]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
      const { transcript } = event.results[0][0];
      setInput(prev => (prev + " " + transcript).trim());
    };

    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Connect to FastAPI backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages })
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.reply) {
        throw new Error(data.detail || "Invalid response from server");
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-8 p-4 md:p-8 max-w-4xl mx-auto w-full h-screen bg-transparent">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center text-slate-800 gap-3">
          <Bot size={32} className="text-blue-500" />
          AI Assistant
        </h1>
        <p className="text-slate-500 mt-2">Chat or use voice to log symptoms and get personalized guidance.</p>
      </header>

      <div className="flex-1 glass-card overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-purple-100 text-purple-600"
              }`}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "glass-panel text-slate-700 rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="max-w-[80%] p-4 rounded-2xl glass-panel text-slate-700 rounded-tl-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-purple-500" /> AI is thinking...
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white/50 border-t border-white/20">
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={startListening}
              title="Click to speak"
              className={`p-3 rounded-full transition-colors ${
                isListening 
                  ? "bg-red-100 text-red-600 animate-pulse" 
                  : "text-slate-400 hover:text-purple-600 hover:bg-purple-50"
              }`}
            >
              <Mic size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message or symptoms..." 
              className="flex-1 bg-white/70 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-6 py-3 outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
