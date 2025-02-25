"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, HelpCircle, X } from "lucide-react"
import Link from "next/link"
import type { FormData, SchemeCategory } from "@/types/form"

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

const occupations = [
  "Agriculture",
  "Construction",
  "Education",
  "Healthcare",
  "IT",
  "Manufacturing",
  "Retail",
  "Services",
  "Transportation",
  "Other",
]

const employmentStatuses = ["Employed", "Self-Employed", "Unemployed", "Student", "Homemaker", "Retired"]

const eligibleSchemes: SchemeCategory[] = [
  {
    name: "Social welfare & Empowerment",
    count: 27,
    icon: "👥",
    color: "bg-purple-50",
  },
  {
    name: "Banking,Financial Services and Insurance",
    count: 14,
    icon: "🏦",
    color: "bg-blue-50",
  },
  {
    name: "Skills & Employment",
    count: 14,
    icon: "💼",
    color: "bg-green-50",
  },
  {
    name: "Education & Learning",
    count: 12,
    icon: "📚",
    color: "bg-red-50",
  },
  {
    name: "Health & Wellness",
    count: 8,
    icon: "🏥",
    color: "bg-emerald-50",
  },
  {
    name: "Business & Entrepreneurship",
    count: 6,
    icon: "💡",
    color: "bg-orange-50",
  },
  {
    name: "Utility & Sanitation",
    count: 5,
    icon: "🚰",
    color: "bg-cyan-50",
  },
  {
    name: "Agriculture,Rural & Environment",
    count: 4,
    icon: "🌾",
    color: "bg-lime-50",
  },
  {
    name: "Housing & Shelter",
    count: 4,
    icon: "🏠",
    color: "bg-yellow-50",
  },
  {
    name: "Science, IT & Communications",
    count: 2,
    icon: "🔬",
    color: "bg-indigo-50",
  },
  {
    name: "Sports & Culture",
    count: 2,
    icon: "🏅",
    color: "bg-rose-50",
  },
  {
    name: "Transport & Infrastructure",
    count: 2,
    icon: "🚆",
    color: "bg-slate-50",
  },
]

interface EligibilityFormProps {
  onClose: () => void
}

export function EligibilityForm({ onClose }: EligibilityFormProps) {
  const [formData, setFormData] = useState<FormData>({
    step: 1,
    state: "",
    category: "General",
    gender: "Male",
    isBPL: false,
    isDifferentlyAbled: false,
    isSeniorCitizen: false,
    area: "",
    occupation: "",
    employmentStatus: "",
    isMinority: false,
  })

  const [schemeCount, setSchemeCount] = useState(598)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // In a real app, we would calculate this based on the form data
    setSchemeCount((prev) => Math.max(60, prev - 50))
  }

  const goToNextStep = () => {
    if (formData.step < 3) {
      setFormData((prev) => ({ ...prev, step: prev.step + 1 }))
    }
  }

  const goToPreviousStep = () => {
    if (formData.step > 1) {
      setFormData((prev) => ({ ...prev, step: prev.step - 1 }))
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="state" className="text-blue-600 font-medium">
            Select Your State <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.state} onValueChange={(value) => updateFormData("state", value)}>
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-blue-600 font-medium">Category</Label>
            <HelpCircle className="h-4 w-4 text-blue-600" />
          </div>
          <RadioGroup
            value={formData.category}
            onValueChange={(value: any) => updateFormData("category", value)}
            className="flex gap-4"
          >
            {["General", "OBC", "PVTG", "SC", "ST"].map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={category} />
                <Label htmlFor={category}>{category}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-600 font-medium">Select Your Gender</Label>
          <div className="flex gap-4">
            {["Male", "Female", "Transgender"].map((gender) => (
              <Button
                key={gender}
                type="button"
                variant={formData.gender === gender ? "default" : "outline"}
                onClick={() => updateFormData("gender", gender)}
                className="flex-1"
              >
                {gender}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: "bpl", label: "Do you belong to BPL category?", key: "isBPL" },
            {
              id: "disabled",
              label: "Are you differently abled?",
              key: "isDifferentlyAbled",
            },
            {
              id: "senior",
              label: "Are you senior citizen?",
              key: "isSeniorCitizen",
            },
          ].map(({ id, label, key }) => (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={formData[key as keyof FormData] as boolean}
                onCheckedChange={(checked) => updateFormData(key as keyof FormData, checked)}
              />
              <Label htmlFor={id} className="text-gray-700">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-blue-600">Please select your area of residence</Label>
          <div className="flex gap-4">
            {["Urban", "Rural"].map((area) => (
              <Button
                key={area}
                type="button"
                variant={formData.area === area ? "default" : "outline"}
                onClick={() => updateFormData("area", area)}
                className="flex-1"
              >
                {area}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation" className="text-blue-600">
            Is your occupation one of the following?
          </Label>
          <Select value={formData.occupation} onValueChange={(value) => updateFormData("occupation", value)}>
            <SelectTrigger id="occupation">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {occupations.map((occupation) => (
                <SelectItem key={occupation} value={occupation}>
                  {occupation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentStatus" className="text-blue-600">
            What is your current employment status?
          </Label>
          <Select
            value={formData.employmentStatus}
            onValueChange={(value) => updateFormData("employmentStatus", value)}
          >
            <SelectTrigger id="employmentStatus">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {employmentStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="minority"
            checked={formData.isMinority}
            onCheckedChange={(checked) => updateFormData("isMinority", checked as boolean)}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="minority" className="text-gray-700">
              Do you belong to minority?
            </Label>
            <HelpCircle className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-1">You might be eligible for the following schemes...</h3>
        <p className="text-sm text-blue-600 mb-4">* Select one or more categories to view.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {eligibleSchemes.map((scheme, index) => (
            <Card
              key={index}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedCategory === scheme.name ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => {
                setSelectedCategory(scheme.name)
                setSchemeCount(scheme.count)
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg ${scheme.color} p-3`}>
                  <div className="text-2xl">{scheme.icon}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">{scheme.count} schemes</div>
                  <h4 className="font-medium">{scheme.name}</h4>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-4">Note: Some schemes can fall in multiple categories</p>
      </div>
    </div>
  )

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {["Basic Details", "Additional Info", "Eligible Schemes"].map((label, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                formData.step > index
                  ? "bg-blue-600 text-white"
                  : formData.step === index + 1
                    ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-xs mt-1 ${formData.step === index + 1 ? "text-blue-600 font-medium" : "text-gray-600"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${((formData.step - 1) / 2) * 100}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="p-6">
          {renderProgressIndicator()}

          {formData.step === 1 && renderStep1()}
          {formData.step === 2 && renderStep2()}
          {formData.step === 3 && renderStep3()}

          <div className="flex items-center gap-4 mt-6">
            {formData.step > 1 && (
              <Button variant="outline" onClick={goToPreviousStep} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            <Button variant="outline" onClick={() => setFormData((prev) => ({ ...prev, step: 1 }))}>
              Reset
            </Button>
            <Link
              href={selectedCategory ? `/schemes?category=${encodeURIComponent(selectedCategory)}` : "/schemes"}
              className="flex-1"
            >
              <Button className="w-full">Show Schemes ({schemeCount})</Button>
            </Link>
            <Button
              onClick={() => {
                if (formData.step < 3) {
                  goToNextStep()
                } else {
                  onClose()
                }
              }}
            >
              {formData.step === 3 ? "Finish" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

