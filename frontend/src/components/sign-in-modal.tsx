"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { LockKeyhole, Smartphone, User, Shield, CheckCircle2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<"login" | "otp" | "consent">("login")
  const [mobile, setMobile] = useState("")
  const [pin, setPin] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [pinless, setPinless] = useState(false)
  const [purpose, setPurpose] = useState("")
  const [otpTimer, setOtpTimer] = useState(59)
  const [consentItems, setConsentItems] = useState({
    docs: true,
    drive: true,
    profile: true,
  })

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("otp")
    // Start OTP timer
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("consent")
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleConsent = (allow: boolean) => {
    if (allow) {
      if (Object.values(consentItems).some((item) => item) && purpose) {
        router.push("/dashboard")
      } else {
        // Show an error message or prevent submission
        alert("Please select at least one consent item and a purpose")
      }
    } else {
      onClose()
    }
  }

  const resendOtp = () => {
    if (otpTimer === 0) {
      setOtpTimer(59)
      // Start OTP timer again
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const fadeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white">
          <h2 className="text-center text-xl font-semibold tracking-tight">
            {step === "login" && "Sign In to your account via DigiLocker"}
            {step === "otp" && "Verify Your Identity"}
            {step === "consent" && "Consent Management"}
          </h2>
        </div>

        <div className="p-6">
          {step === "login" && (
            <motion.div initial="hidden" animate="visible" variants={fadeVariants} className="space-y-6">
              <Tabs defaultValue="mobile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="mobile" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile</span>
                  </TabsTrigger>
                  <TabsTrigger value="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Username</span>
                  </TabsTrigger>
                  <TabsTrigger value="others" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Others</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mobile" className="space-y-5">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="Enter your mobile number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pin">PIN</Label>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="pin"
                            type="password"
                            placeholder="Enter your PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pinless"
                        checked={pinless}
                        onCheckedChange={(checked) => setPinless(checked as boolean)}
                      />
                      <label htmlFor="pinless" className="text-sm text-gray-600">
                        PIN less authentication
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        I consent to{" "}
                        <Link href="#" className="text-green-600 hover:underline font-medium">
                          terms of use
                        </Link>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-6">
                      Sign In
                    </Button>

                    <div className="text-center text-sm">
                      New user?{" "}
                      <Link href="#" className="text-green-600 hover:underline font-medium">
                        Sign up
                      </Link>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="username">
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    Username login option coming soon
                  </div>
                </TabsContent>

                <TabsContent value="others">
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    Additional login options coming soon
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div initial="hidden" animate="visible" variants={fadeVariants} className="space-y-6">
              <Card className="bg-green-50 border-green-200 p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">OTP Sent Successfully</p>
                    <p className="mt-1">DigiLocker has sent you an OTP to your registered mobile.</p>
                    <p>OTP will be valid for 10 Minutes.</p>
                  </div>
                </div>
              </Card>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="otp-0" className="text-center block">
                    Enter OTP
                  </Label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
                  disabled={otp.some((digit) => !digit)}
                >
                  Verify & Continue
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={otpTimer > 0}
                    className={`text-sm ${otpTimer > 0 ? "text-gray-500" : "text-green-600 hover:underline font-medium"}`}
                  >
                    {otpTimer > 0 ? `Resend OTP in 00:${otpTimer.toString().padStart(2, "0")}` : "Resend OTP"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "consent" && (
            <motion.div initial="hidden" animate="visible" variants={fadeVariants} className="space-y-6">
              <Card className="bg-blue-50 border-blue-200 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Consent Required</p>
                    <p className="mt-1">Please provide your consent to share the following with Abhudaya:</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div className="space-y-3 border rounded-md p-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="docs"
                      checked={consentItems.docs}
                      onCheckedChange={(checked) => setConsentItems((prev) => ({ ...prev, docs: checked === true }))}
                    />
                    <label htmlFor="docs" className="font-medium">
                      Issued Documents
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="drive"
                      checked={consentItems.drive}
                      onCheckedChange={(checked) => setConsentItems((prev) => ({ ...prev, drive: checked === true }))}
                    />
                    <label htmlFor="drive" className="font-medium">
                      DigiLocker Drive
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="profile"
                      className="mt-1"
                      checked={consentItems.profile}
                      onCheckedChange={(checked) => setConsentItems((prev) => ({ ...prev, profile: checked === true }))}
                    />
                    <div>
                      <label htmlFor="profile" className="font-medium">
                        Profile Information
                      </label>
                      <div className="text-sm text-gray-500 mt-1">Name, Date of Birth, Gender</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger id="purpose" className="w-full">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kyc">Know Your Customer</SelectItem>
                      <SelectItem value="verification">Verification</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="services">Availing Services</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="age">Age verification</SelectItem>
                      <SelectItem value="guardian">Guardian consent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Consent validity date (Today + 30 days)</p>
                    <p className="text-sm text-gray-500">09 March 2024</p>
                  </div>
                  <p className="text-xs text-gray-500">Consent validity is subject to applicable laws.</p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => handleConsent(false)}>
                    Deny
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleConsent(true)}
                    disabled={!purpose || !Object.values(consentItems).some((item) => item)}
                  >
                    Allow
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

