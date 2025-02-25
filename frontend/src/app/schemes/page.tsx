"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Search, Share2, AlertTriangle, Clock, Building2, Users, MoreVertical, Bookmark } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { SchemeDetailModal } from "@/components/scheme-detail-modal"

interface Scheme {
  id: string
  ministry: string
  title: string
  description: string
  visits: number
  tags: string[]
  state?: string
  grant?: string
  eligibilityPercentage?: number
  statistics?: {
    centers?: string
    beneficiaries?: string
    houses?: string
    families?: string
    subscribers?: string
    disbursed?: string
  }
  deadline?: string
  missingDocuments?: string[]
  emoji?: string
  rating?: number
  reviews?: number
}

const schemes: Scheme[] = [
  {
    id: "1",
    ministry: "Ministry Of Agriculture and Farmers Welfare",
    title: "Agri-Clinics And Agri-Business Centres Scheme",
    description:
      "A welfare scheme by the Ministry of Agriculture and Farmers' Welfare was launched in 2002. AC&ABC aims at agricultural development, supplementing the efforts of public extension by providing extension and other services to farmers either on a payment basis or free of cost as per local needs.",
    visits: 5540,
    tags: ["Business", "Entrepreneur", "Student", "Training", "Agriculture", "Employment"],
    grant: "₹5 lakh business loan",
    eligibilityPercentage: 75,
    statistics: {
      centers: "1,500",
      beneficiaries: "1,200,000",
    },
    deadline: "7 days left to apply",
    missingDocuments: ["Business Plan", "Qualification Certificate"],
    emoji: "🌾",
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    ministry: "Ministry Of Finance",
    title: "Atal Pension Yojana",
    description:
      "Atal Pension Yojana (APY) is an old age income security scheme for a savings account holder in the age group of 18-40 years, who is not an income tax-payee. It helps to address longevity risks among workers in unorganized sector and encourages the workers to voluntarily save for retirement.",
    visits: 6160,
    tags: ["Pension", "Social Security", "Unorganized Sector"],
    grant: "₹5,000 monthly pension",
    eligibilityPercentage: 90,
    statistics: {
      subscribers: "4,000,000",
      disbursed: "₹2,500 Cr",
    },
    deadline: "3 days left to apply",
    missingDocuments: ["Income Certificate"],
    emoji: "👴",
    rating: 4.2,
    reviews: 256,
  },
  {
    id: "3",
    state: "Assam",
    ministry: "Ministry of Housing and Urban Affairs",
    title: "Pradhan Mantri Awas Yojana",
    description:
      "A flagship mission implemented by the Ministry of Housing and Urban Affairs to provide housing for all in urban areas.",
    visits: 8240,
    tags: ["Housing", "Urban Development", "Subsidy"],
    grant: "₹2.5 lakh housing grant",
    eligibilityPercentage: 85,
    statistics: {
      houses: "2,000,000",
      families: "2,000,000",
    },
    deadline: "5 days left to apply",
    missingDocuments: ["Income Certificate"],
    emoji: "🏠",
    rating: 4.8,
    reviews: 512,
  },
]

const filters = [
  {
    id: "state",
    label: "State",
    options: ["All States", "Assam", "Bihar", "Delhi", "Gujarat", "Maharashtra"],
  },
  {
    id: "gender",
    label: "Gender",
    options: ["All", "Male", "Female", "Transgender"],
  },
  {
    id: "age",
    label: "Age",
    options: ["All Ages", "0-18", "19-40", "41-60", "60+"],
  },
  {
    id: "caste",
    label: "Caste",
    options: ["All", "General", "OBC", "SC", "ST"],
  },
  {
    id: "level",
    label: "Level",
    options: ["All Levels", "Central", "State"],
  },
  {
    id: "residence",
    label: "Residence",
    options: ["All", "Rural", "Urban"],
  },
  {
    id: "minority",
    label: "Minority",
    options: ["All", "Yes", "No"],
  },
  {
    id: "differently-abled",
    label: "Differently Abled",
    options: ["All", "Yes", "No"],
  },
  {
    id: "benefit-type",
    label: "Benefit Type",
    options: ["All Types", "Cash", "Kind", "Service"],
  },
  {
    id: "dbt-scheme",
    label: "DBT Scheme",
    options: ["All", "Yes", "No"],
  },
  {
    id: "marital-status",
    label: "Marital Status",
    options: ["All", "Single", "Married", "Widowed"],
  },
  {
    id: "disability-percentage",
    label: "Disability Percentage",
    options: ["All", "40-60%", "60-80%", "80%+"],
  },
  {
    id: "below-poverty-line",
    label: "Below Poverty Line",
    options: ["All", "Yes", "No"],
  },
  {
    id: "economic-distress",
    label: "Economic Distress",
    options: ["All", "Yes", "No"],
  },
  {
    id: "government-employee",
    label: "Government Employee",
    options: ["All", "Yes", "No"],
  },
  {
    id: "employment-status",
    label: "Employment Status",
    options: ["All", "Employed", "Unemployed", "Self-Employed"],
  },
  {
    id: "student",
    label: "Student",
    options: ["All", "Yes", "No"],
  },
  {
    id: "occupation",
    label: "Occupation",
    options: ["All", "Farmer", "Farm Labor", "Agricultural Worker", "Other"],
  },
  {
    id: "application-mode",
    label: "Application Mode",
    options: ["All", "Online", "Offline", "Both"],
  },
]

const schemeDetails = {
  id: "1",
  title:
    "Immediate Relief Assistance under Welfare and Relief for Fishermen During Lean Seasons and Natural Calamities Scheme",
  ministry: "Ministry of Fisheries",
  description: "Financial assistance for families of missing fishermen",
  location: "Puducherry",
  tags: ["Missing", "Fisherman", "Relief", "Financial Assistance", "Family"],
  details:
    'The scheme "Immediate Relief Assistance" is a Sub-Component under the scheme "Welfare and Relief for Fishermen During Lean Seasons and Natural Calamities Scheme". The scheme is extended to all the regions of the Union territory of Puducherry. The scheme is introduced with the objective of extending financial assistance to the fishermen\'s families to compensate for the loss due to the missing breadwinner and to support them financially to run their family.',
  benefits: {
    amount:
      "₹ 1,00,000, in two installments of ₹ 50,000 each, as immediate relief assistance for the family (legal heir) of the missing fisherman.",
    disbursal: [
      "Initially, 50% will be extended within 3 months from the date of receipt of the application from the family (legal heir).",
      "The family (legal heir) should approach this department for the release of the balance 50% of the relief which will be deposited in the bank in a joint account in the name of kin (legal heir) and the competent authority concerned.",
      "If no further information is received about the missing person, the balance amount will be released in favour of the next of kin (legal heir), after the prescribed period of 9 months from the date of release of 1st part of lump sum.",
    ],
    note: "*In case of the return of the missing fishermen, the amount extended as compensation either ₹ 50,000 or ₹ 1,00,000 as the case may be, will be recovered by invoking an insurance bond.",
  },
  eligibility: [
    "The fisherman must be registered with the Fisheries Department",
    "Must be a resident of Puducherry",
    "The family must file a missing person report with the local police station",
  ],
  applicationProcess: {
    steps: [
      {
        title: "File Missing Person Report",
        description: "File a missing person report at the local police station and obtain a copy of the FIR",
      },
      {
        title: "Submit Application",
        description: "Submit the application form along with required documents to the Fisheries Department",
      },
      {
        title: "Verification",
        description: "The department will verify the documents and process the application",
      },
      {
        title: "Disbursal",
        description: "First installment will be released within 3 months of application",
      },
    ],
  },
  documents: [
    "Copy of the FIR filed at the police station",
    "Proof of registration with Fisheries Department",
    "Residence proof of Puducherry",
    "Identity proof of the legal heir",
    "Bank account details",
    "Two passport size photographs",
  ],
  faq: [
    {
      question: "How long does it take to receive the first installment?",
      answer:
        "The first installment (50% of the total amount) will be released within 3 months from the date of application submission.",
    },
    {
      question: "When can I apply for the second installment?",
      answer:
        "The family can approach the department for the second installment after 9 months from the date of release of the first installment.",
    },
    {
      question: "What happens if the missing person returns?",
      answer: "If the missing fisherman returns, the compensation amount will be recovered through an insurance bond.",
    },
  ],
  sources: [
    "Fisheries Department, Government of Puducherry",
    "Welfare and Relief for Fishermen Scheme Guidelines",
    "Government Order No. 123/2023",
  ],
}

export default function SchemesPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() => {
    const initialFilters = Object.fromEntries(filters.map((filter) => [filter.id, filter.options[0]]))
    const category = searchParams.get("category")
    if (category) {
      initialFilters.category = category
    }
    return initialFilters
  })
  const [sortOrder, setSortOrder] = useState("a-z")
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null)
  const [bookmarkedSchemes, setBookmarkedSchemes] = useState<string[]>([])

  const handleShare = async (scheme: Scheme) => {
    const shareText = `Check out ${scheme.title} - ${scheme.grant}

Eligibility: ${scheme.eligibilityPercentage}%
Deadline: ${scheme.deadline}

Apply now on MyScheme`
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, "_blank")
  }

  const toggleBookmark = (schemeId: string) => {
    setBookmarkedSchemes((prev) =>
      prev.includes(schemeId) ? prev.filter((id) => id !== schemeId) : [...prev, schemeId],
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5 mr-1" />
              All Schemes
            </Link>
            <div className="flex-1 relative">
              <Input
                type="search"
                placeholder="Search Schemes"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                onClick={() => {
                  const resetFilters = Object.fromEntries(filters.map((filter) => [filter.id, filter.options[0]]))
                  setSelectedFilters(resetFilters)
                }}
              >
                Reset
              </Button>
            </div>
            <Accordion type="multiple" className="space-y-2">
              {filters.map((filter) => (
                <AccordionItem key={filter.id} value={filter.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-sm font-medium">{filter.label}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {filter.options.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={filter.id}
                            value={option}
                            checked={selectedFilters[filter.id] === option}
                            onChange={(e) => {
                              setSelectedFilters({
                                ...selectedFilters,
                                [filter.id]: e.target.value,
                              })
                            }}
                            className="text-blue-600 focus:ring-blue-600"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-semibold">
                Total <span className="text-blue-600">41</span> Schemes Available
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a-z">Scheme Name (A-Z)</SelectItem>
                    <SelectItem value="z-a">Scheme Name (Z-A)</SelectItem>
                    <SelectItem value="visits">Most Visited</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {schemes.map((scheme) => (
                <Card key={scheme.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        {scheme.state && <div className="text-sm text-gray-600">{scheme.state}</div>}
                        <div className="text-sm text-gray-600">{scheme.ministry}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{scheme.emoji}</span>
                          <h3 className="text-xl font-semibold text-blue-600">{scheme.title}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {scheme.tags[0]}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-yellow-600">{scheme.rating} ★</span>
                            <span className="text-sm text-gray-600">({scheme.reviews} reviews)</span>
                          </div>
                        </div>
                        <p className="text-gray-600">{scheme.grant}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleShare(scheme)}>
                          <Share2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBookmark(scheme.id)
                          }}
                        >
                          <Bookmark
                            className={`h-5 w-5 ${
                              bookmarkedSchemes.includes(scheme.id) ? "fill-yellow-400 text-yellow-400" : ""
                            }`}
                          />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 py-3 border-t border-b">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-3xl font-bold text-blue-600">{scheme.eligibilityPercentage}%</div>
                        <div className="text-sm text-gray-600">Eligible</div>
                      </div>
                      <div className="flex gap-6 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xl font-semibold">
                              {scheme.statistics.houses || scheme.statistics.centers || scheme.statistics.subscribers}
                            </div>
                            <div className="text-sm text-gray-600">
                              {scheme.statistics.houses
                                ? "houses built"
                                : scheme.statistics.centers
                                  ? "centers established"
                                  : "active subscribers"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-xl font-semibold">
                              {scheme.statistics.families ||
                                scheme.statistics.beneficiaries ||
                                scheme.statistics.disbursed}
                            </div>
                            <div className="text-sm text-gray-600">
                              {scheme.statistics.families
                                ? "families covered"
                                : scheme.statistics.beneficiaries
                                  ? "beneficiaries"
                                  : "amount disbursed"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {scheme.missingDocuments && scheme.missingDocuments.length > 0 && (
                      <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-red-600">Missing: {scheme.missingDocuments.join(", ")}</div>
                          <div className="text-sm text-red-600">Please upload the required documents to proceed</div>
                        </div>
                      </div>
                    )}

                    {scheme.deadline && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div className="font-medium text-yellow-600">{scheme.deadline}</div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {scheme.tags.slice(1).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setSelectedScheme(scheme.id)}
                    >
                      View Detail
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {selectedScheme && <SchemeDetailModal scheme={schemeDetails} onClose={() => setSelectedScheme(null)} />}
          </div>
        </div>
      </div>
    </div>
  )
}

