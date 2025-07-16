"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, MessageCircle, Heart, Eye, Clock, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatNumber } from "@/lib/utils"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"

interface ForumThread {
  id: string
  title: string
  content: string
  category: string
  author: {
    id: string
    name: string
    avatar?: string
    username: string
  }
  isPinned: boolean
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface ForumComment {
  id: string
  threadId: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    username: string
  }
  likesCount: number
  createdAt: string
  updatedAt: string
}

const categories = [
  { value: "general", label: "Thảo luận chung", color: "bg-blue-500" },
  { value: "help", label: "Hỗ trợ kỹ thuật", color: "bg-green-500" },
  { value: "showcase", label: "Chia sẻ dự án", color: "bg-purple-500" },
  { value: "jobs", label: "Việc làm", color: "bg-orange-500" },
  { value: "learning", label: "Học tập", color: "bg-pink-500" },
  { value: "feedback", label: "Góp ý", color: "bg-cyan-500" },
]

export function CommunityForum() {
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateThread, setShowCreateThread] = useState(false)
  const socket = useSocket()
  const { toast } = useToast()

  // Fetch threads
  useEffect(() => {
    fetchThreads()
  }, [activeTab])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    socket.on("thread:created", (thread: ForumThread) => {
      setThreads((prev) => [thread, ...prev])
      toast({
        title: "Bài viết mới!",
        description: `${thread.author.name} vừa đăng: ${thread.title}`,
      })
    })

    socket.on("thread:updated", (updatedThread: ForumThread) => {
      setThreads((prev) => prev.map((t) => (t.id === updatedThread.id ? updatedThread : t)))
    })

    socket.on("comment:created", (comment: ForumComment) => {
      if (selectedThread?.id === comment.threadId) {
        setComments((prev) => [...prev, comment])
      }
      // Update comment count in threads list
      setThreads((prev) =>
        prev.map((t) => (t.id === comment.threadId ? { ...t, commentsCount: t.commentsCount + 1 } : t)),
      )
    })

    return () => {
      socket.off("thread:created")
      socket.off("thread:updated")
      socket.off("comment:created")
    }
  }, [socket, selectedThread, toast])

  const fetchThreads = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/forum/threads?category=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads)
      }
    } catch (error) {
      console.error("Error fetching threads:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (threadId: string) => {
    try {
      const response = await fetch(`/api/forum/threads/${threadId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThread(thread)
    fetchComments(thread.id)
    // Update view count
    updateViewCount(thread.id)
  }

  const updateViewCount = async (threadId: string) => {
    try {
      await fetch(`/api/forum/threads/${threadId}/view`, { method: "POST" })
    } catch (error) {
      console.error("Error updating view count:", error)
    }
  }

  const handleLikeThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/forum/threads/${threadId}/like`, {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, likesCount: data.likesCount } : t)))
      }
    } catch (error) {
      console.error("Error liking thread:", error)
    }
  }

  const filteredThreads = threads.filter((thread) => {
    if (activeTab === "all") return true
    return thread.category === activeTab
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
            Diễn đàn cộng đồng 💬
          </h2>
          <p className="text-muted-foreground">Nơi Gen Z Việt Nam kết nối, thảo luận và chia sẻ kinh nghiệm</p>
        </div>

        <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
          <DialogTrigger asChild>
            <Button className="bg-genz-purple hover:bg-genz-purple/90">
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
            </DialogHeader>
            <CreateThreadForm onSuccess={() => setShowCreateThread(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onClick={() => handleThreadClick(thread)}
                  onLike={() => handleLikeThread(thread.id)}
                />
              ))}

              {filteredThreads.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Chưa có bài viết nào trong danh mục này</p>
                  <Button className="mt-4" onClick={() => setShowCreateThread(true)}>
                    Tạo bài viết đầu tiên
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Thread Detail Modal */}
      {selectedThread && (
        <ThreadDetailModal
          thread={selectedThread}
          comments={comments}
          onClose={() => setSelectedThread(null)}
          onCommentAdded={(comment) => setComments((prev) => [...prev, comment])}
        />
      )}
    </div>
  )
}

interface ThreadCardProps {
  thread: ForumThread
  onClick: () => void
  onLike: () => void
}

function ThreadCard({ thread, onClick, onLike }: ThreadCardProps) {
  const category = categories.find((c) => c.value === thread.category)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {thread.isPinned && <Pin className="h-4 w-4 text-genz-purple" />}
              <Badge variant="secondary" className={`${category?.color} text-white`}>
                {category?.label}
              </Badge>
              {thread.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-2 hover:text-genz-purple transition-colors" onClick={onClick}>
              {thread.title}
            </h3>

            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{thread.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{thread.author.name}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(thread.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLike()
                  }}
                  className="h-auto p-1"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {formatNumber(thread.likesCount)}
                </Button>

                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{formatNumber(thread.commentsCount)}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(thread.viewsCount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CreateThreadFormProps {
  onSuccess: () => void
}

function CreateThreadForm({ onSuccess }: CreateThreadFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !category) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/forum/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công!",
          description: "Bài viết đã được tạo thành công",
        })
        onSuccess()
        setTitle("")
        setContent("")
        setCategory("")
        setTags("")
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo bài viết",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Danh mục *</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết nội dung bài viết..."
          rows={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="VD: React, TypeScript, Web Development"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng..." : "Đăng bài"}
        </Button>
      </div>
    </form>
  )
}

interface ThreadDetailModalProps {
  thread: ForumThread
  comments: ForumComment[]
  onClose: () => void
  onCommentAdded: (comment: ForumComment) => void
}

function ThreadDetailModal({ thread, comments, onClose, onCommentAdded }: ThreadDetailModalProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/forum/threads/${thread.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        onCommentAdded(comment)
        setNewComment("")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">{thread.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Thread Content */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={thread.author.avatar || "/placeholder.svg"} />
                <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{thread.author.name}</p>
                <p className="text-sm text-muted-foreground">{formatDate(thread.createdAt)}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="font-semibold">Bình luận ({comments.length})</h3>

            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-muted pl-4 space-y-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
