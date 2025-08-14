"use client"

import { AuthLayout } from "@/components/auth-layout"
import { LoginContainer } from "@/components/login-container"
import Image from "next/image"
import Link from "next/link"

export default function SignUpPage() {
  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:4000/auth/google"
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[440px] space-y-6">
        {/* Main Content */}
        <div className="space-y-2">
          <h1 className="text-[22px] font-semibold text-[#1A1A1A]">Login</h1>
          <p className="text-[15px] text-[#666666]">Welcome back to your ABHUDAYA account!</p>
        </div>

        {/* Form Fields */}
        <form className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Mobile Number</label>
            <input
              type="tel"
              placeholder="Enter Your Mobile Number"
              className="h-[46px] w-full rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#1A1A1A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#0066B3]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Enter MPIN</label>
            <input
              type="password"
              placeholder="Enter your MPIN"
              className="h-[46px] w-full rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#1A1A1A] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#0066B3]"
            />
            <div className="flex justify-end">
              <Link href="/forgot-mpin" className="text-sm text-[#0066B3] hover:underline">
                Forgot MPIN?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="h-[46px] w-full rounded-lg bg-[#0066B3] text-[15px] font-medium text-white transition-colors hover:bg-[#0066B3]/90"
          >
            Login
          </button>
        </form>

        <button
          type="button"
          className="h-[46px] w-full rounded-lg bg-[#F8F9FC] text-[15px] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FC]/80"
        >
          Login with OTP
        </button>

        <div className="text-center">
          <span className="text-[15px] text-[#666666]">
            New on ABHUDAYA?{" "}
            <Link href="/register" className="text-[#0066B3] hover:underline">
              Register Here
            </Link>
          </span>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[15px] text-[#666666]">OR</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[15px] text-[#1A1A1A] hover:bg-gray-50 transition-colors"
        >
          <Image 
            src="/google.png" 
            alt="Google" 
            width={20} 
            height={20}
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </AuthLayout>
  )
}