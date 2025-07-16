"use client"

import { Briefcase, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TabNavigationProps {
  activeTab: "skills" | "videos"
  onTabChange: (tab: "skills" | "videos") => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center px-6">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent",
            "hover:border-muted-foreground/20 transition-colors",
            activeTab === "skills" && "border-genz-purple text-genz-purple",
          )}
          onClick={() => onTabChange("skills")}
        >
          <Briefcase className="h-4 w-4" />
          <span className="font-medium">Kỹ năng & Cộng đồng</span>
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent",
            "hover:border-muted-foreground/20 transition-colors",
            activeTab === "videos" && "border-genz-pink text-genz-pink",
          )}
          onClick={() => onTabChange("videos")}
        >
          <Video className="h-4 w-4" />
          <span className="font-medium">Video giải trí</span>
        </Button>
      </div>
    </div>
  )
}
