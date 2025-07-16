"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TabNavigation } from "@/components/layout/tab-navigation"
import { SessionProviderWrapper } from "../session-provider-wrapper" // Import wrapper
import { Notifications } from "../notifications/notifications" // Đảm bảo import Notifications

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<"skills" | "videos">("skills")

  return (
    <SessionProviderWrapper> {/* Bao bọc toàn bộ thành phần */}
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          {/* Thêm Notifications */}
          <Notifications />

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content Area */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SessionProviderWrapper>
  )
}