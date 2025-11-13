import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export interface SentimentJourneyData {
  date: string
  sentiment: number
  commentCount: number
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'comments_combined.csv')
    const csvText = fs.readFileSync(filePath, 'utf-8')
    const lines = csvText.split('\n').slice(1) // Skip header
    
    // Map voor datum -> { totalPosSentiment, count }
    const dateMap: Record<string, { totalPosSentiment: number; count: number }> = {}
    const uniqueDates = new Set<string>()
    
    // Verzamel alle datums en bereken gemiddelde positieve sentiment per dag
    for (const line of lines) {
      if (!line.trim()) continue
      
      // Parse CSV line (handling quoted fields)
      const columns: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      columns.push(current.trim()) // Add last column
      
      if (columns.length < 9) continue
      
      const dateStr = columns[8]?.trim() // date is column 8 (last column)
      const posSentimentStr = columns[5]?.trim() // pos_sentiment (%) is column 5
      
      if (!dateStr || dateStr === 'date' || !posSentimentStr) continue
      
      // Parse positieve sentiment
      const posSentiment = parseFloat(posSentimentStr)
      if (isNaN(posSentiment)) continue
      
      // Parse datum (formaat: "2025-08-04 13:15:00" of "2025-09-01 08:51:07+00:00")
      try {
        // Verwijder timezone info als die er is
        const cleanDateStr = dateStr.replace(/\+00:00$/, '')
        const date = new Date(cleanDateStr)
        
        if (isNaN(date.getTime())) {
          continue
        }
        
        const dateOnly = date.toISOString().split('T')[0] // YYYY-MM-DD format
        uniqueDates.add(dateOnly)
        
        if (!dateMap[dateOnly]) {
          dateMap[dateOnly] = { totalPosSentiment: 0, count: 0 }
        }
        
        dateMap[dateOnly].totalPosSentiment += posSentiment
        dateMap[dateOnly].count += 1
      } catch (error) {
        // Skip invalid dates
        continue
      }
    }
    
    // Sorteer datums en neem de laatste 14 unieke datums
    const sortedDates = Array.from(uniqueDates).sort()
    const last14Dates = sortedDates.slice(-14)
    
    // Converteer naar array met gemiddelde positieve sentiment per dag
    // Converteer percentage (0-100) naar sentiment range (-1.0 tot 1.0)
    // We gebruiken: sentiment = (posSentiment% / 100) * 2 - 1
    // Dit geeft: 0% -> -1.0, 50% -> 0.0, 100% -> 1.0
    const result: SentimentJourneyData[] = last14Dates.map((date) => {
      const data = dateMap[date]
      if (!data || data.count === 0) {
        return {
          date,
          sentiment: 0,
          commentCount: 0,
        }
      }
      
      const avgPosSentiment = data.totalPosSentiment / data.count // Percentage 0-100
      // Converteer naar -1.0 tot 1.0 range
      const sentiment = (avgPosSentiment / 100) * 2 - 1
      
      return {
        date,
        sentiment,
        commentCount: data.count,
      }
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing sentiment journey:', error)
    return NextResponse.json(
      { error: 'Failed to process sentiment journey data' },
      { status: 500 }
    )
  }
}

