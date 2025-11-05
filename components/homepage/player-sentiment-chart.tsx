"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PlayerSentiment {
  name: string
  negative: number
  neutral: number
  positive: number
}

const chartConfig = {
  negative: {
    label: "Negative",
    color: "#ef4444", // red
  },
  neutral: {
    label: "Neutral",
    color: "#f59e0b", // yellow/orange
  },
  positive: {
    label: "Positive",
    color: "#22c55e", // green
  },
} satisfies ChartConfig

export default function PlayerSentimentChart() {
  const [data, setData] = useState<PlayerSentiment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/players?sentiment=true')
        if (!response.ok) {
          throw new Error('Failed to fetch player sentiment')
        }
        const players = await response.json()
        setData(players)
      } catch (error) {
        console.error("Error loading player sentiment:", error)
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

  // Format data for stacked bar chart
  const chartData = data.map((player) => ({
    name: player.name,
    negative: player.negative,
    neutral: player.neutral,
    positive: player.positive,
  }))

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
      >
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null
            
            const data = payload[0].payload
            return (
              <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                <div className="font-semibold">{data.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <div style={{ color: chartConfig.positive.color }}>
                    Positive: {data.positive.toFixed(1)}%
                  </div>
                  <div style={{ color: chartConfig.neutral.color }}>
                    Neutral: {data.neutral.toFixed(1)}%
                  </div>
                  <div style={{ color: chartConfig.negative.color }}>
                    Negative: {data.negative.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          }}
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Bar
          dataKey="positive"
          stackId="sentiment"
          fill="var(--color-positive)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="neutral"
          stackId="sentiment"
          fill="var(--color-neutral)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="negative"
          stackId="sentiment"
          fill="var(--color-negative)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

