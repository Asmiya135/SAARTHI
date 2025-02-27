"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Mic, Bot, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
// import { toast } from "@/components/ui/use-toast"

interface Message {
  role: "user" | "bot"
  content: string
  timestamp: Date
  audioUrl?: string
}

const MAX_RECORDING_TIME = 60 // 60 seconds max for recording
const RETRY_DELAY = 2000 // 2 seconds

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! How can I assist you today?", timestamp: new Date() },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [voiceActivity, setVoiceActivity] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()
  const animationRef = useRef<number>()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        uploadAudio(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      setVoiceActivity(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= MAX_RECORDING_TIME - 1) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return prevTime + 1
        })
      }, 1000)

      // Simulate voice activity
      const animateVoiceActivity = () => {
        setVoiceActivity(Math.random() * 0.5 + 0.5)
        animationRef.current = requestAnimationFrame(animateVoiceActivity)
      }
      animateVoiceActivity()
    } catch (error) {
      console.error("Error starting recording:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setErrorMessage(`Failed to start recording: ${errorMessage}. Please check your microphone settings.`)
      toast({
        title: "Recording Error",
        description: `Failed to start recording: ${errorMessage}. Please check your microphone settings.`,
        variant: "destructive",
      })
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setVoiceActivity(0)
  }, [])

  const uploadAudio = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    try {
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('Audio uploaded successfully:', data.filePath)
    
      // Add the audio message to the chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Audio message',
        timestamp: new Date(),
        audioUrl: data.filePath
      }])

      // Simulate bot response (replace this with actual bot logic)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: "I've received your audio message. How can I help you with that?",
          timestamp: new Date()
        }])
      }, 1000)

    } catch (error) {
      console.error('Error uploading audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrorMessage(`Failed to upload audio: ${errorMessage}. Please try again.`)
      toast({
        title: 'Audio Upload Error',
        description: `Failed to upload audio: ${errorMessage}. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsVoiceModalOpen(false)
    }
  }

  const handleVoiceInput = () => {
    setIsVoiceModalOpen(true)
    startRecording()
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim()) return

    const userMessage = { role: "user" as const, content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate bot response (replace this with actual bot logic)
    setTimeout(() => {
      const botResponse =
        "Thank you for your message. I'm here to help you with any questions about government schemes and services."
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: botResponse,
          timestamp: new Date(),
        },
      ])
      setIsTyping(false)
    }, 1000)
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full shadow-lg gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Bot className="h-5 w-5" />
        <span>सारथीBot</span>
      </Button>
    )
  }

  return (
    <>
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-300",
                "bg-gradient-to-b from-white to-blue-500",
                isRecording ? "animate-pulse" : "opacity-50",
              )}
              style={{
                transform: `scale(${1 + voiceActivity * 0.3})`,
                opacity: isRecording ? 0.8 : 0.5,
              }}
            />
          </div>

          <p className="mt-4 text-white text-lg">{isRecording ? `Recording: ${recordingTime}s` : "Tap to speak"}</p>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          <div className="fixed bottom-8 flex items-center gap-4">
            <Button
              size="lg"
              variant="ghost"
              className={cn(
                "rounded-full w-16 h-16 flex items-center justify-center",
                isRecording ? "bg-red-500/20 text-red-500" : "text-gray-400 hover:text-white",
              )}
              onClick={() => {
                if (isRecording) {
                  stopRecording()
                } else {
                  startRecording()
                }
              }}
            >
              <Mic className="h-8 w-8" />
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="rounded-full w-12 h-12 text-gray-400 hover:text-white"
              onClick={() => {
                stopRecording()
                setIsVoiceModalOpen(false)
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      <div className="fixed inset-4 sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[400px] sm:h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-white" />
              <div>
                <h1 className="font-semibold text-white">सारथीBot</h1>
                <p className="text-xs text-purple-100">Your Digital Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-purple-100 mt-2">Ask me anything about government schemes and services.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div key={i} className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%] space-y-1",
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                )}
              >
                <p className="text-sm">{message.content}</p>
                {message.audioUrl && <audio controls src={message.audioUrl} className="mt-2 max-w-full" />}
                <p className="text-[10px] opacity-70">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              className={cn("rounded-full flex-shrink-0", isRecording && "animate-pulse")}
              onClick={handleVoiceInput}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? `Recording: ${recordingTime}s` : "Type your message..."}
              className="rounded-full flex-grow"
              disabled={isRecording}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isRecording}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {errorMessage && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-sm">
            {errorMessage}
          </div>
        )}
      </div>
    </>
  )
}

