import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface AskInputProps {
  onSubmit: (value: string) => Promise<string>;
  isGeminiInitialized?: boolean;
  className?: string;
  isSplitMode?: boolean;
  value?: string; // ✅ new
  onChange?: (val: string) => void; // ✅ new
}

export default function AskInput({ 
  onSubmit, 
  isGeminiInitialized = true, 
  className,
  isSplitMode = false,
   value: valueProp,
  onChange
}: AskInputProps) {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: value,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setValue("");
    setIsLoading(true);
    setShowChat(true);

    try {
      const response = await onSubmit(value);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* Chat History */}
      {showChat && messages.length > 0 && (
        <div className={`absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50 ${
          isSplitMode 
            ? '-left-8 w-96 min-w-96' // Fixed width positioned slightly more to the left in split mode
            : 'left-0 right-0' // Normal responsive width
        }`}>
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">AI Chat</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowChat(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.text}
                  </div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <div className="flex-1 relative">
        <input
  type="text"
  placeholder="Ask something or use navigation commands..."
  value={valueProp ?? value}
  onChange={(e) => {
    if (onChange) onChange(e.target.value); // parent-controlled
    else setValue(e.target.value); // internal state
  }}
  disabled={isLoading}
  className={`w-full rounded-lg px-4 py-3 pr-12 text-foreground 
      placeholder-gray-500 focus:outline-none focus:ring-2 
      focus:ring-blue-500 bg-gray-200 ${className}`}
/>

          <Button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            variant="ghost"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{showChat ? 'Hide' : 'Chat'}</span>
          </Button>
        )}
      </form>
    </div>
  );
}
