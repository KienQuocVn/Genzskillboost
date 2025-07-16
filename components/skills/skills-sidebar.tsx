"use client"

import { TrendingUp, Compass, Users, Activity, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "./dashboard"

interface SkillsSidebarProps {
  activeItem: SidebarItem
  onItemChange: (item: SidebarItem) => void
}

const sidebarItems = [
  {
    id: "recommendations" as const,
    label: "Gợi ý",
    icon: TrendingUp,
    description: "Dự án được đề xuất cho bạn",
  },
  {
    id: "explore" as const,
    label: "Khám phá",
    icon: Compass,
    description: "Tìm hiểu dự án mới",
  },
  {
    id: "following" as const,
    label: "Đang theo dõi",
    icon: Users,
    description: "Dự án từ người bạn theo dõi",
  },
  {
    id: "activity" as const,
    label: "Hoạt động",
    icon: Activity,
    description: "Cập nhật và thông báo",
  },
  {
    id: "profile" as const,
    label: "Hồ sơ",
    icon: User,
    description: "Quản lý hồ sơ cá nhân",
  },
]

export function SkillsSidebar({ activeItem, onItemChange }: SkillsSidebarProps) {
  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
          Kỹ năng & Cộng đồng
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Kết nối và chia sẻ với cộng đồng Gen Z</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal h-auto p-4",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-all duration-200",
                activeItem === item.id && "bg-genz-purple/10 text-genz-purple border-r-2 border-genz-purple",
              )}
              onClick={() => onItemChange(item.id)}
            >
              <div className="flex items-start space-x-3">
                <item.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Mẹo: Chia sẻ dự án để tăng khả năng được tuyển dụng</p>
          <p className="text-genz-purple">🇻🇳 Dành riêng cho Gen Z Việt Nam</p>
        </div>
      </div>
    </aside>
  )
}
