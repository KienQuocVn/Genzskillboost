"use client"

import { useState } from "react"
import { SkillsSidebar } from "./skills-sidebar"
import { RecommendationsContent } from "./content/recommendations-content"
import { ExploreContent } from "./content/explore-content"
import { FollowingContent } from "./content/following-content"
import { ActivityContent } from "./content/activity-content"
import { ProfileContent } from "./content/profile-content"
import { Menu, Sun, Moon } from "lucide-react"
import { Notifications } from "@/components/notifications/notifications"
import { Button } from "@/components/ui/button"

export type SidebarItem = "recommendations" | "explore" | "following" | "activity" | "profile"

export function SkillsDashboard() {
  const [activeItem, setActiveItem] = useState<SidebarItem>("recommendations")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const renderContent = () => {
    switch (activeItem) {
      case "recommendations":
        return <RecommendationsContent />
      case "explore":
        return <ExploreContent />
      case "following":
        return <FollowingContent />
      case "activity":
        return <ActivityContent />
      case "profile":
        return <ProfileContent />
      default:
        return <RecommendationsContent />
    }
  }

  return (
    <div className="flex h-full bg-background">
      {/* Fixed Sidebar */}
      <SkillsSidebar activeItem={activeItem} onItemChange={setActiveItem} />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border">
            <SkillsSidebar
              activeItem={activeItem}
              onItemChange={(item) => {
                setActiveItem(item)
                setIsMobileMenuOpen(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-hidden">
        {/* Add hamburger menu button for mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-genz-purple to-genz-pink rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GZ</span>
            </div>
            <span className="font-bold text-lg">GenZSkillBoost</span>
          </div>
          <div className="flex items-center space-x-2">
            <Notifications />
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="h-8 w-8">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-full overflow-y-auto">{renderContent()}</div>
      </main>
    </div>
  )
}
