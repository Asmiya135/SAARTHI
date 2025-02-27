import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Mic, Loader2, Volume2, VolumeX } from "lucide-react";


export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", content: "Hello! How can I assist you today?" }]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;
    
    return () => {
      // Clean up any ongoing speech
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      
      // Clean up audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Speak the bot's message
  const speakMessage = (text) => {
    if (!ttsEnabled || !speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // You can customize voice properties
    utterance.rate = 1.0;  // Speed of speech
    utterance.pitch = 1.0; // Pitch of voice
    utterance.volume = 1.0; // Volume
    
    // Optional: Set a specific voice if available
    const voices = speechSynthesisRef.current.getVoices();
    // You can choose a specific voice by filtering the voices array
    // For example: const voice = voices.find(v => v.name === 'Google हिन्दी');
    // utterance.voice = voice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current.speak(utterance);
  };

  // Toggle text-to-speech feature
  const toggleTTS = () => {
    if (isSpeaking && speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    setTtsEnabled(!ttsEnabled);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("YOUR_API_ENDPOINT", { message: input });
      const botResponse = { role: "bot", content: response.data.reply };
      setMessages([...updatedMessages, botResponse]);
      
      // Speak the bot's response
      speakMessage(botResponse.content);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { 
        role: "bot", 
        content: "Sorry, something went wrong. Please try again." 
      };
      setMessages([...updatedMessages, errorMessage]);
      
      // Speak the error message
      speakMessage(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (event) => {
        chunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        await processAudioInput(audioBlob);
      });

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage = { role: "bot", content: "Couldn't access your microphone." };
      setMessages([...messages, errorMessage]);
      speakMessage(errorMessage.content);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const processAudioInput = async (audioBlob) => {
    setIsLoading(true);
    const updatedMessages = [...messages, { role: "user", content: "🎤 Voice message" }];
    setMessages(updatedMessages);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3"); // Ensure the file is sent as an MP3 file

      // Process the audio file directly in the backend
      const response = await axios.post("http://localhost:9000/transcribe_with_node", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const botResponse = { role: "bot", content: response.data.translatedText.replace("*","") };
      setMessages([...updatedMessages, botResponse]);

      const audioBase64 = response.data.audioBase64[0];
      
      // Play the audio response
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audio.play();
      
      // Speak the bot's response
      speakMessage(botResponse.content);
    } catch (error) {
      console.error("Error processing audio:", error);
      const errorMessage = { role: "bot", content: "Audio processing failed." };
      setMessages([...updatedMessages, errorMessage]);
      speakMessage(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Stop speaking current message
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 gap-2 rounded-full shadow-lg" onClick={() => setIsOpen(true)}>
          <MessageCircle className="h-5 w-5" />
          सारथीBot
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle>सारथीBot - Your Digital Assistant</SheetTitle>
              <SheetDescription>Ask me anything about government schemes and services.</SheetDescription>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleTTS} 
              title={ttsEnabled ? "Turn off text-to-speech" : "Turn on text-to-speech"}
            >
              {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4 py-2">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}
              >
                {message.content}
                {message.role === "bot" && ttsEnabled && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 ml-2 inline-flex" 
                    onClick={() => speakMessage(message.content)}
                    title="Read aloud"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="px-4 py-3 border-t">
          {isSpeaking && (
            <div className="flex justify-center mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopSpeaking} 
                className="text-xs"
              >
                <VolumeX className="h-4 w-4 mr-1" /> Stop Reading
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Button 
              size="icon"
              variant="outline"
              disabled={isLoading}
              onMouseDown={!recording ? handleStartRecording : undefined}
              onMouseUp={recording ? handleStopRecording : undefined}
              className={recording ? "bg-red-100" : ""}
            >
              <Mic className={`h-5 w-5 ${recording ? "text-red-500 animate-pulse" : ""}`} />
            </Button>
            <Input
              className="flex-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            />
            <Button 
              size="icon"
              disabled={isLoading || !input.trim()} 
              onClick={sendMessage}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
      <audio ref={audioRef} hidden />
    </Sheet>
  );
}

export default Chatbot;