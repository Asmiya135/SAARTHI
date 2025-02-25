"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EligibilityForm } from "../../src/components/eligibility-form"

export function SearchBar() {
  const [showEligibility, setShowEligibility] = useState(false)

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="relative flex items-center">
          <div className="relative flex-grow">
            <Input
              type="search"
              placeholder="Search for schemes, categories, or ministries"
              className="h-12 pl-12 pr-4 text-lg w-full rounded-l-full rounded-r-none border-r-0"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          <Button className="h-12 rounded-l-none rounded-r-full bg-blue-600 hover:bg-blue-700 text-white px-6">
            Search
          </Button>
          <Button variant="outline" className="ml-2 h-12 px-4">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => setShowEligibility(true)}
        >
          Explore Eligible Schemes
        </Button>
      </div>

      {showEligibility && <EligibilityForm onClose={() => setShowEligibility(false)} />}
    </>
  )
}

