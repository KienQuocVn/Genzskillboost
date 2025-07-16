"use client"

import { Search, Bell, MessageCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Tìm kiếm dự án, người dùng, video..." className="pl-10 bg-muted/50" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />

          {/* User Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>GZ</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
