import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'comments_combined.csv')
    const csvText = fs.readFileSync(filePath, 'utf-8')
    const lines = csvText.split('\n').slice(1) // Skip de eerste regel (header)

    let totalNeg = 0
    let totalPos = 0
    let totalNeu = 0
    let validCount = 0
    
    for (const line of lines) {
      if (!line.trim()) continue
      
      // Parse CSV line (handling commas in quoted fields)
      const columns = line.match(/(?:[^,"]+|"(?:[^"]|"")*")+/g)
      if (!columns || columns.length < 7) continue
      
      const negSentiment = parseFloat(columns[4]?.trim())
      const posSentiment = parseFloat(columns[5]?.trim())
      const neuSentiment = parseFloat(columns[6]?.trim())
      
      // Check if all values are valid numbers
      if (!isNaN(negSentiment) && !isNaN(posSentiment) && !isNaN(neuSentiment)) {
        totalNeg += negSentiment
        totalPos += posSentiment
        totalNeu += neuSentiment
        validCount++
      }
    }
    
    const avgNeg = totalNeg / validCount
    const avgPos = totalPos / validCount
    const avgNeu = totalNeu / validCount
    
    return NextResponse.json({
      totalComments: validCount,
      averageNegativeSentiment: Number(avgNeg.toFixed(2)),
      averagePositiveSentiment: Number(avgPos.toFixed(2)),
      averageNeutralSentiment: Number(avgNeu.toFixed(2)),
      percentages: {
        negative: `${avgNeg.toFixed(2)}%`,
        positive: `${avgPos.toFixed(2)}%`,
        neutral: `${avgNeu.toFixed(2)}%`
      }
    })
  } catch (error) {
    console.error('Error processing sentiment data:', error)
    return NextResponse.json(
      { error: 'Failed to process sentiment data' },
      { status: 500 }
    )
  }
}
