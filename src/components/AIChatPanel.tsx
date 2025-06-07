"use client";

import { useState, useRef, useEffect } from "react";
import { getChatCompletion, ChatMessage } from "@/lib/ollama";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
}

export default function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI coding assistant powered by Code Llama. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState("codellama");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const chatMessages = messages.slice(-10).map(({ role, content }) => ({ role, content }));

      chatMessages.push({ role: "user", content: userMessage });

      const response = await getChatCompletion(chatMessages, {
        model: selectedModel,
        temperature: 0.7,
      });

      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get response from AI assistant. Make sure Ollama is running and the model is downloaded.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-dark)] border-l border-[var(--border-color)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-darker)] backdrop-blur-sm bg-opacity-80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</h2>
          <div className="text-xs text-[var(--text-secondary)] px-2 py-1 rounded-full bg-[var(--bg-dark)] border border-[var(--border-color)]">
            Connected to Ollama
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md bg-[var(--bg-dark)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all duration-200"
          >
            <option value="codellama">Code Llama (Recommended)</option>
            <option value="llama2">Llama 2</option>
            <option value="mistral">Mistral</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  id: "1",
                  role: "assistant",
                  content: "Hello! I'm your AI coding assistant. How can I help you today?",
                  timestamp: new Date(),
                },
              ])
            }
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.role === "assistant" ? "items-start" : "items-end"
            } max-w-[90%] mx-auto w-full`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {message.role === "assistant" ? "AI Assistant" : "You"}
              </span>
              <span className="text-xs text-[var(--text-secondary)] opacity-50">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <div
              className={`w-full rounded-lg p-4 ${
                message.role === "assistant"
                  ? "bg-[var(--bg-darker)] text-[var(--text-primary)] border border-[var(--border-color)]"
                  : "bg-[var(--primary)] bg-opacity-10 border border-[var(--primary)] border-opacity-20 text-[var(--text-primary)]"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}
        {error && (
          <div className="max-w-[90%] mx-auto">
            <div className="text-[var(--error)] text-sm p-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="max-w-[90%] mx-auto">
            <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-darker)]">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-darker)]"
      >
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 min-h-[44px] max-h-[200px] px-3 py-2 rounded-md bg-[var(--bg-dark)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all duration-200 resize-y"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
