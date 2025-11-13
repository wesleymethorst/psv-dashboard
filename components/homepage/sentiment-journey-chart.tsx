"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltip } from "@/components/ui/chart"

interface SentimentJourneyData {
  date: string
  sentiment: number
  commentCount: number
}

const chartConfig = {
  sentiment: {
    label: "Sentiment",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function SentimentJourneyChart() {
  const [data, setData] = useState<SentimentJourneyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/sentiment-journey')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch sentiment journey')
        }
        const journeyData = await response.json()
        if (Array.isArray(journeyData)) {
          setData(journeyData)
        } else {
          console.error("Invalid response format:", journeyData)
        }
      } catch (error) {
        console.error("Error loading sentiment journey:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Format datum voor weergave (DD-MM)
  const chartData = data.map((item) => {
    const date = new Date(item.date)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return {
      date: item.date,
      dateLabel: `${day}-${month}`,
      sentiment: item.sentiment,
      commentCount: item.commentCount,
    }
  })

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload[0]) return null
            const data = payload[0].payload
            return (
              <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                <div className="font-semibold mb-2">{data.dateLabel}</div>
                <div className="space-y-1 text-sm">
                  <div>Sentiment: {data.sentiment.toFixed(1)}</div>
                  <div>Comments: {data.commentCount.toLocaleString()}</div>
                </div>
              </div>
            )
          }}
        />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          domain={[-1.0, 1.0]}
          tick={{ fontSize: 12 }}
          ticks={[-1.0, -0.5, 0.0, 0.5, 1.0]}
          label={{ value: 'Sentiment', angle: -90, position: 'insideLeft' }}
        />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ r: 5, fill: "#3b82f6" }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

