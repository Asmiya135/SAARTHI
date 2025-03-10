import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2, Mic, Bot } from "lucide-react";
 
export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [jarvisMode, setJarvisMode] = useState(false);
  const messagesEndRef = useRef(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:4000/api/user/query", {
        message: input,
      });
      const botResponse = { role: "bot", content: response.data.reply };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
 
  const startListening = async () => {
    setIsListening(true);
    setVoiceStatus("Listening...");
 
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
 
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported");
      }
 
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
 
      recognition.start();
 
      recognition.onresult = async (event: any) => {
        const transcribedText = event.results[0][0].transcript;
        setVoiceStatus("");
 
        if (jarvisMode) {
          setVoiceStatus(`Recognized: "${transcribedText}"`);
 
          try {
            const res = await axios.post("http://localhost:4000/api/voice/process-query", {
              userQuery: transcribedText,
            });
 
            const { navigateTo } = res.data;
 
            if (navigateTo) {
              setVoiceStatus(`Navigating to ${navigateTo}...`);
              window.location.href = `/${navigateTo.toLowerCase()}`;
            } else {
              setVoiceStatus("Sorry, couldn't determine the destination.");
              setTimeout(() => setVoiceStatus(""), 3000);
            }
          } catch (error) {
            console.error("Error in voice processing:", error);
            setVoiceStatus("Error connecting to server.");
            setTimeout(() => setVoiceStatus(""), 3000);
          }
        } else {
          // Regular chatbot mode
          setInput(transcribedText);
 
          // Auto-send the transcribed message
          const userMessage = { role: "user", content: transcribedText };
          setMessages([...messages, userMessage]);
          setIsLoading(true);
 
          try {
            const response = await axios.post("http://localhost:4000/api/user/query", {
              message: transcribedText,
            });
            const botResponse = { role: "bot", content: response.data.reply };
            setMessages((prev) => [...prev, botResponse]);
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              { role: "bot", content: "Sorry, something went wrong." },
            ]);
          } finally {
            setIsLoading(false);
          }
        }
      };
 
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setVoiceStatus(`Error: ${event.error}`);
        setIsListening(false);
      };
 
      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      setVoiceStatus("Speech recognition not supported in this browser.");
      setIsListening(false);
    }
  };
 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
 
  const toggleJarvisMode = () => {
    setJarvisMode(!jarvisMode);
    if (!jarvisMode) {
      setMessages([...messages, { 
        role: "bot", 
        content: "Jarvis mode activated. I can now process voice commands for navigation. Say a destination to navigate there." 
      }]);
    } else {
      setMessages([...messages, { 
        role: "bot", 
        content: "Returning to regular chat mode." 
      }]);
    }
  };
 
  return (
    <>
      {/* Floating Chatbot Button */}
      <Button
        variant="default"
        className="fixed bottom-4 right-4 rounded-full shadow-lg flex items-center gap-2 px-4 py-2"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
        <span>सारथीBot</span>
      </Button>
 
      {/* Side Tab (Sheet) for Chatbot */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>सारथीBot</SheetTitle>
            <SheetDescription className="flex justify-between items-center">
              <span>Your AI-powered assistant</span>
              <Button
                variant={jarvisMode ? "secondary" : "outline"}
                size="sm"
                onClick={toggleJarvisMode}
                className={`${jarvisMode ? "bg-blue-100" : ""} flex items-center gap-1`}
              >
                <Bot className="h-4 w-4" />
                Jarvis {jarvisMode ? "ON" : "OFF"}
              </Button>
            </SheetDescription>
          </SheetHeader>
 
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                } rounded-lg p-3 max-w-[80%]`}
              >
                {msg.content}
              </div>
            ))}
            {voiceStatus && (
              <div className="text-center text-sm text-muted-foreground my-2">
                {voiceStatus}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
 
          {/* Input Field, Voice Button & Send Button */}
          <div className="p-4 border-t flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={jarvisMode ? "Jarvis mode active - use voice button" : "Type a message..."}
              className="flex-grow"
              disabled={jarvisMode}
            />
            <Button
              variant={jarvisMode ? "default" : "outline"}
              size="icon"
              onClick={startListening}
              disabled={isListening}
              className={`transition-colors ${isListening ? "bg-red-100" : ""} 
                ${jarvisMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || jarvisMode}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
 
export default Chatbot;