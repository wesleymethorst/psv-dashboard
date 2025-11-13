"use client"

import { useEffect, useState } from "react"
import { Card,CardAction, CardContent, CardDescription, CardFooter, CardHeader,CardTitle,} from "@/components/ui/card"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PlayerSentiment {
  name: string
  mentions: number
  negative: number
  neutral: number
  positive: number
}

const cardConfig = {
  negative :{
    label: "Negative",
    color: "#ef4444",
  },
  positive:{
    label: "Positive",  
    color: "#22c55e",
  }
} 




export default function PlayerMentionsOverview() {
  const [mostPositive, setMostPositive] = useState<PlayerSentiment | null>(null)
  const [mostNegative, setMostNegative] = useState<PlayerSentiment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      async function loadData() {
        try {
          const response = await fetch('/api/player-oversentiment')
          if (!response.ok) {
            throw new Error('Failed to fetch player sentiment')
          }
          const json = await response.json()
        setMostPositive(json.mostPositive)
        setMostNegative(json.mostNegative)
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

  if (!mostPositive || !mostNegative) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 🟩 Card: jugador más positivo */}
      <Card className="border-green-500 shadow-md">
        <CardHeader>
          <CardTitle className="text-green-600 text-lg font-bold" >
            Most Positive Player 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xl font-semibold">{mostPositive.name}</p>
          <div className="space-y-1 text-sm">
            <p>👍 Positive: {mostPositive.positive.toFixed(1)}%</p>
            <p>😐 Neutral: {mostPositive.neutral.toFixed(1)}%</p>
            <p>👎 Negative: {mostPositive.negative.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* 🟥 Card: jugador más negativo */}
      <Card className="border-red-500 shadow-md">
        <CardHeader>
          <CardTitle className="text-red-600 text-lg font-bold">
            Most Negative Player 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xl font-semibold">{mostNegative.name}</p>
          <div className="space-y-1 text-sm">
            <p>👍 Positive: {mostNegative.positive.toFixed(1)}%</p>
            <p>😐 Neutral: {mostNegative.neutral.toFixed(1)}%</p>
            <p>👎 Negative: {mostNegative.negative.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


