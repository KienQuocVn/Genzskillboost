"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell, X, Check, Heart, MessageCircle, UserPlus, Video, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSocket } from "@/hooks/use-socket"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  isRead: boolean
  createdAt: string
}

export function Notifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const socket = useSocket()
  const { toast } = useToast()

  // Fetch notifications
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session])

  // Socket listeners
  useEffect(() => {
    if (!socket || !session?.user?.id) return

    // Authenticate socket connection
    socket.emit("authenticate", {
      userId: session.user.id,
      token: "jwt_token_here", // You should pass the actual JWT token
    })

    // Listen for new notifications
    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    // Listen for message notifications
    socket.on("message_notification", (notification: any) => {
      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    return () => {
      socket.off("notification")
      socket.off("message_notification")
    }
  }, [socket, session, toast])

  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
        setUnreadCount((prev) => {
          const notification = notifications.find((n) => n.id === notificationId)
          return notification && !notification.isRead ? prev - 1 : prev
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />
      case "project":
        return <Briefcase className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    const { data } = notification
    switch (notification.type) {
      case "like":
      case "comment":
        if (data.projectId) {
          window.location.href = `/projects/${data.projectId}`
        } else if (data.videoId) {
          window.location.href = `/videos/${data.videoId}`
        }
        break
      case "follow":
        if (data.userId) {
          window.location.href = `/users/${data.userId}`
        }
        break
      case "message":
        if (data.conversationId) {
          window.location.href = `/messages/${data.conversationId}`
        }
        break
      default:
        break
    }

    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                  icon={getNotificationIcon(notification.type)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => (window.location.href = "/notifications")}
            >
              Xem tất cả thông báo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: () => void
  icon: React.ReactNode
}

function NotificationItem({ notification, onClick, onDelete, icon }: NotificationItemProps) {
  return (
    <div
      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">{icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.createdAt)}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
        </div>
      </div>
    </div>
  )
}
