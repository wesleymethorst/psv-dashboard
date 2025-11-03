"use client"

import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Header() {
  return (
    <header className="border-b">
      <div className="w-full max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/psv_logo.svg"
              alt="PSV Logo"
              width={60}
              height={45}
              priority
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">PSV Dashboard</h1>
              <p className="text-xs text-muted-foreground">Live dashboard - Updated weekly</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="last-7-days">
              <SelectTrigger>
                <SelectValue placeholder="Last 7 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-platforms">
              <SelectTrigger>
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-platforms">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="x">X</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  )
}

