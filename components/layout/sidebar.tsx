"use client"

import { Compass, Users, Activity, User, TrendingUp, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Notifications } from "@/components/notifications/notifications"
import { useTheme } from "next-themes"

interface SidebarProps {
  activeTab: "skills" | "videos"
}

const sidebarItems = [
  { id: "recommendations", label: "Gợi ý", icon: TrendingUp },
  { id: "explore", label: "Khám phá", icon: Compass },
  { id: "following", label: "Đang theo dõi", icon: Users },
  { id: "activity", label: "Hoạt động", icon: Activity },
  { id: "profile", label: "Hồ sơ", icon: User },
]

export function Sidebar({ activeTab }: SidebarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-genz-purple to-genz-pink rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GZ</span>
            </div>
            <span className="font-bold text-lg">GenZSkillBoost</span>
          </div>
          <div className="flex items-center space-x-1">
            <Notifications />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors duration-200",
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>© 2024 GenZSkillBoost</p>
          <p>Dành cho Gen Z Việt Nam 🇻🇳</p>
        </div>
      </div>
    </aside>
  )
}
