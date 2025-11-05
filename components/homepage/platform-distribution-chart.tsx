"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PlatformDistribution {
  platform: string
  count: number
  percentage: number
}

const chartConfig = {
  engagement: {
    label: "Engagement",
    theme: {
      light: "hsl(var(--chart-1))",
      dark: "hsl(var(--chart-1))",
    },
  },
} satisfies ChartConfig

export default function PlatformDistributionChart() {
  const [data, setData] = useState<PlatformDistribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/platform-distribution')
        if (!response.ok) {
          throw new Error('Failed to fetch platform distribution')
        }
        const distribution = await response.json()
        setData(distribution)
      } catch (error) {
        console.error("Error loading platform distribution:", error)
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

  // Platform specifieke kleuren voor in de charts
  const platformColors: Record<string, string> = {
    TikTok: "#000000", 
    Facebook: "#1877F2", 
    Instagram: "#E1306C", 
    YouTube: "#FF0000",
  }

  // Chart data formatten voor Recharts
  const chartData = data.map((item) => ({
    platform: item.platform,
    value: item.percentage,
    count: item.count,
    fill: platformColors[item.platform],
  }))

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
      >
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload[0]) return null
            const data = payload[0].payload
            const value = data.value ?? 0
            return (
              <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                <div className="font-semibold">{data.platform}</div>
                <div className="text-sm text-muted-foreground">
                  {data.count.toLocaleString()} comments
                </div>
                <div className="text-sm text-muted-foreground">
                  {value.toFixed(1)}%
                </div>
              </div>
            )
          }}
        />
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis
          type="category"
          dataKey="platform"
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          label={({ value, x, y, width, height }) => {
            const displayValue = value ?? 0
            console.log('Label props:', { x, y, width, height, value, displayValue })
            const xPos = x + width + 5
            const yPos = y + height / 2
            console.log('Calculated positions:', { xPos, yPos })
            return (
              <text
                x={xPos}
                y={yPos}
                fill="currentColor"
                textAnchor="start"
                dominantBaseline="middle"
                className="text-xs font-medium"
              >
                {displayValue.toFixed(1)}%
              </text>
            )
          }}
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.platform}`}
              fill={entry.fill}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

