import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  HelpCircle,
  Loader2
} from "lucide-react";

const COMMON_PROMPTS = [
  "What is the status of my complaint?",
  "Show unresolved issues near me",
  "Why is repairing SW Pine St delayed?",
  "Which department handles pipe leaks?"
];

export default function AICivicAssistant({ userId }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "model",
      content: "Hello! I am your **MyNeighbourhood AI Assistant**. Ask me anything about active potholes, service delays, or category routings!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll chats
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isSending]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const payloadMessages = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          userId
        })
      });

      if (!res.ok) {
        throw new Error("Unable to reach conversation service.");
      }

      const data = await res.json();
      const modelMsg = {
        id: `mod-${Date.now()}`,
        role: "model",
        content: data.content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "model",
        content: "⚠️ I experienced an intermittent connection lag with the municipal server. Please try questioning again shortly.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="ai-chat-assistant" className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col h-full min-h-[500px] flex-1">
      {/* Bot Header info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600/30 border border-indigo-500/30 p-2 rounded-xl text-indigo-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1">
              MyNeighbourhood AI Assistant
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Grounding Enabled</span>
          </div>
        </div>
        <div className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">
          Model: gemini-2.5-flash
        </div>
      </div>

      {/* Message history */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs scrollbar-thin scrollbar-thumb-slate-800"
      >
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex gap-2.5 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {m.role !== "user" ? (
              <div className="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-600/50 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono">
                CP
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-300 uppercase font-mono">
                U
              </div>
            )}

            <div className={`p-3 rounded-2xl ${
              m.role === "user" 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none"
            } leading-relaxed`}>
              {/* Rich formatted Text display */}
              <div className="whitespace-pre-line prose prose-invert max-w-none text-xs">
                {m.content.split("\n\n").map((para, i) => (
                  <p key={i}>
                    {para.split("**").map((frag, idx) => {
                      if (idx % 2 === 1) {
                        return <strong key={idx} className="text-white font-bold">{frag}</strong>;
                      }
                      return frag;
                    })}
                  </p>
                ))}
              </div>
              <span className="text-[8px] text-slate-400 block mt-1 text-right font-mono">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2.5 mr-auto">
            <div className="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-600/50 flex-shrink-0 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
            <div className="bg-slate-800 border border-slate-700 text-slate-400 px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5 font-medium italic text-xs">
              AI is formulating municipal diagnostics...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick prompts */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <span className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-wider flex items-center gap-1 font-mono">
          <HelpCircle className="w-3 h-3" />
          Common Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] text-slate-300 bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1 hover:bg-slate-700 transition-colors text-left max-w-full truncate cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Form submit input text */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about your complaint status or category requirements..."
          className="flex-1 bg-slate-800 outline-none border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder:text-slate-505 focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 py-2.5 px-3.5 rounded-xl text-white transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
