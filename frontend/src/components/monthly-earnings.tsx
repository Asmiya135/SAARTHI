"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  type TooltipProps,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, TrendingUpIcon, ArrowRightIcon } from "lucide-react"

const data = [
  {
    category: "Education",
    baseIncome: 10000,
    potentialBenefits: 3500,
    description: "Scholarships, tuition fee waivers, book allowances",
    icon: "🎓",
    color: "hsl(230, 80%, 65%)",
  },
  {
    category: "Healthcare",
    baseIncome: 10000,
    potentialBenefits: 2800,
    description: "Medical insurance, free checkups, medicine subsidies",
    icon: "🏥",
    color: "hsl(180, 70%, 45%)",
  },
  {
    category: "Housing",
    baseIncome: 10000,
    potentialBenefits: 4200,
    description: "Rent allowances, construction subsidies, utility bill reductions",
    icon: "🏠",
    color: "hsl(350, 70%, 60%)",
  },
  {
    category: "Nutrition",
    baseIncome: 10000,
    potentialBenefits: 1500,
    description: "Food subsidies, PDS benefits, midday meal programs",
    icon: "🍲",
    color: "hsl(120, 60%, 50%)",
  },
  {
    category: "Agriculture",
    baseIncome: 10000,
    potentialBenefits: 3800,
    description: "Seed subsidies, equipment loans, crop insurance",
    icon: "🌾",
    color: "hsl(45, 90%, 50%)",
  },
  {
    category: "Employment",
    baseIncome: 10000,
    potentialBenefits: 5000,
    description: "Skill development, MGNREGA, self-employment grants",
    icon: "💼",
    color: "hsl(280, 80%, 60%)",
  },
  {
    category: "Women & Child",
    baseIncome: 10000,
    potentialBenefits: 2500,
    description: "Maternity benefits, child education, self-help groups",
    icon: "👪",
    color: "hsl(320, 70%, 60%)",
  },
]

// Sort data by potential benefits in descending order
const sortedData = [...data].sort((a, b) => b.potentialBenefits - a.potentialBenefits)

// Calculate total potential benefits
const totalPotentialBenefits = data.reduce((sum, item) => sum + item.potentialBenefits, 0)
const maxBenefitCategory = data.reduce(
  (max, item) => (item.potentialBenefits > max.potentialBenefits ? item : max),
  data[0],
)

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const categoryData = data.find((item) => item.category === label)

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{categoryData?.icon}</span>
          <h3 className="font-bold text-gray-900">{label}</h3>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Base Income: <span className="font-semibold text-gray-900">₹{payload[0].value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Potential Benefits:{" "}
            <span className="font-semibold" style={{ color: categoryData?.color }}>
              ₹{payload[1].value}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Total:{" "}
            <span className="font-semibold text-gray-900">₹{Number(payload[0].value) + Number(payload[1].value)}</span>
          </p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">{categoryData?.description}</p>
        </div>
      </div>
    )
  }
  return null
}

// Format large numbers
const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}k`
  }
  return `₹${value}`
}

export function MonthlyEarnings() {
  const [chartType, setChartType] = useState<"horizontal" | "vertical" | "grouped">("horizontal")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleBarClick = (data: any) => {
    setSelectedCategory(data.category)
  }

  const filteredData = selectedCategory ? data.filter((item) => item.category === selectedCategory) : sortedData

  // Prepare data for grouped bar chart
  const groupedData = sortedData.map((item) => ({
    ...item,
    totalIncome: item.baseIncome + item.potentialBenefits,
  }))

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Scheme Benefits Potential</CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              Explore potential benefits across various government schemes
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 border-indigo-200"
          >
            <TrendingUpIcon className="h-3.5 w-3.5" />
            <span>Total Potential: ₹{totalPotentialBenefits.toLocaleString()}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="mt-2">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="details">Details View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <div className="flex justify-end mb-2">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setChartType("horizontal")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-l-lg ${
                    chartType === "horizontal" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                  } border border-gray-200`}
                >
                  Horizontal
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("vertical")}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    chartType === "vertical" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                  } border-t border-b border-gray-200`}
                >
                  Vertical
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("grouped")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-r-lg ${
                    chartType === "grouped" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                  } border border-gray-200`}
                >
                  Grouped
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-100 shadow-sm">
              {chartType === "horizontal" && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={filteredData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      domain={[0, 16000]}
                      tickFormatter={(value) => `₹${value / 1000}k`}
                      stroke="#94a3b8"
                    />
                    <YAxis dataKey="category" type="category" width={100} tick={{ fill: "#64748b" }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                    />
                    <ReferenceLine x={10000} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Bar
                      dataKey="baseIncome"
                      name="Base Monthly Income"
                      stackId="a"
                      fill="rgba(203, 213, 225, 0.7)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="potentialBenefits"
                      name="Potential Benefits"
                      stackId="a"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {filteredData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={selectedCategory === entry.category ? 1 : 0.85}
                        />
                      ))}
                      <LabelList
                        dataKey="potentialBenefits"
                        position="right"
                        formatter={(value: number) => `+₹${value.toLocaleString()}`}
                        style={{ fontSize: "11px", fill: "#4b5563" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "vertical" && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={filteredData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#64748b" }}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tickFormatter={formatCurrency} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                    />
                    <ReferenceLine y={10000} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Bar
                      dataKey="baseIncome"
                      name="Base Monthly Income"
                      stackId="a"
                      fill="rgba(203, 213, 225, 0.7)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="potentialBenefits"
                      name="Potential Benefits"
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {filteredData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={selectedCategory === entry.category ? 1 : 0.85}
                        />
                      ))}
                      <LabelList
                        dataKey="potentialBenefits"
                        position="top"
                        formatter={(value: number) => `+₹${value.toLocaleString()}`}
                        style={{ fontSize: "11px", fill: "#4b5563" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "grouped" && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={groupedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#64748b" }}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tickFormatter={formatCurrency} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                    />
                    <ReferenceLine y={10000} stroke="#94a3b8" strokeDasharray="3 3" label="Base Income Level" />
                    <Bar
                      dataKey="baseIncome"
                      name="Base Monthly Income"
                      fill="rgba(203, 213, 225, 0.7)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="potentialBenefits" name="Potential Benefits" cursor="pointer" radius={[4, 4, 0, 0]}>
                      {groupedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={selectedCategory === entry.category ? 1 : 0.85}
                        />
                      ))}
                      <LabelList
                        dataKey="potentialBenefits"
                        position="top"
                        formatter={(value: number) => `+₹${value.toLocaleString()}`}
                        style={{ fontSize: "11px", fill: "#4b5563" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {selectedCategory && (
                <div className="mt-2 text-center">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Reset Selection
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-indigo-600">
                  <InfoIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-indigo-900 mb-2">Benefits Overview</h3>
                  <ul className="space-y-2 text-sm text-indigo-800">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        The graph shows your current monthly income (₹10,000) plus potential benefits from various
                        scheme categories.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        <strong>Employment schemes</strong> offer the highest potential financial support (₹5,000).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        <strong>Housing schemes</strong> could provide up to ₹4,200 in benefits through subsidies and
                        allowances.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Click on each category bar to explore specific schemes you may be eligible for.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Try different chart views using the buttons above the graph.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {sortedData.map((item) => (
                <div
                  key={item.category}
                  className="p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <h3 className="font-medium">{item.category}</h3>
                    </div>
                    <Badge variant="secondary" className="text-white" style={{ backgroundColor: item.color }}>
                      +₹{item.potentialBenefits.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-xs text-gray-500 w-16">₹10,000</div>
                    <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gray-200 w-[62.5%]"></div>
                      <div
                        className="absolute inset-y-0 left-[62.5%] h-full rounded-r-lg transition-all duration-500"
                        style={{
                          width: `${(item.potentialBenefits / 16000) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="text-xs font-medium text-white">
                          +₹{item.potentialBenefits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 w-16 text-right">₹16,000</div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Base Income</span>
                    <div className="flex items-center text-sm text-gray-700">
                      <ArrowRightIcon className="h-3 w-3 mx-1" />
                      <span className="font-medium">
                        ₹{(item.baseIncome + item.potentialBenefits).toLocaleString()}
                      </span>
                      <span className="text-xs ml-1 text-gray-500">Total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

