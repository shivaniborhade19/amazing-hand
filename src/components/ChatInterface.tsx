import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, User, Key } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  onPromptSubmit: (prompt: string) => Promise<string>;
  onApiKeySubmit: (apiKey: string) => void;
  isGeminiInitialized: boolean;
  className?: string;
}

export default function ChatInterface({ 
  onPromptSubmit, 
  onApiKeySubmit, 
  isGeminiInitialized,
  className 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I can help you navigate the TenXer interface using natural language. Try commands like "go to ruka hand", "play video", or ask me anything about robotics!',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!isGeminiInitialized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!isGeminiInitialized) {
      setShowApiKeyInput(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await onPromptSubmit(inputValue);
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

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    onApiKeySubmit(apiKeyInput);
    setApiKeyInput('');
    setShowApiKeyInput(false);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: 'Great! Gemini AI is now active. You can use natural language to navigate and ask questions.',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, welcomeMessage]);
  };

  if (showApiKeyInput) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Key className="w-4 h-4" />
            <span>Enter your Gemini API key to enable AI navigation</span>
          </div>
          <form onSubmit={handleApiKeySubmit} className="space-y-2">
            <Input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter Gemini API key..."
              className="w-full"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Initialize AI
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowApiKeyInput(false)}
              >
                Skip for now
              </Button>
            </div>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-80 ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {message.sender === 'user' ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
              </div>
              <div
                className={`rounded-lg p-2 text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3 h-3" />
              </div>
              <div className="bg-muted rounded-lg p-2 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isGeminiInitialized ? "Ask me anything or use commands like 'go to ruka hand'..." : "Enter Gemini API key first..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </form>
        {!isGeminiInitialized && (
          <Button 
            variant="link" 
            size="sm" 
            className="mt-2 h-auto p-0 text-xs"
            onClick={() => setShowApiKeyInput(true)}
          >
            Setup Gemini API key
          </Button>
        )}
      </div>
    </Card>
  );
}