import { useState } from "react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: any;
  }
}
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Mic } from "lucide-react";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", content: "Hello! How can I assist you today?" }]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }]);
      setInput("");
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: "Thank you for your message. How else can I help you?" }]);
      }, 1000);
    }
  };

  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 gap-2 rounded-full shadow-lg" onClick={() => setIsOpen(true)}>
          <MessageCircle className="h-5 w-5" />
          सारथीBot
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>सारथीBot - Your Digital Assistant</SheetTitle>
          <SheetDescription>Ask me anything about government schemes and services.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-lg p-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleVoiceInput}>
            <Mic className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Chatbot;
