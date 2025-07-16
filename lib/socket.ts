// import type { Server as NetServer } from "http"
// import { Server as ServerIO } from "socket.io"
// import { supabase } from "./supabase"

// export type NextApiResponseServerIO = {
//   socket: {
//     server: NetServer & {
//       io: ServerIO
//     }
//   }
// }

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// }

// interface SocketUser {
//   id: string
//   username: string
//   fullName: string
//   avatarUrl?: string
// }

// interface NotificationData {
//   id: string
//   type: string
//   title: string
//   message: string
//   data: any
//   userId: string
//   createdAt: string
// }

// interface MessageData {
//   id: string
//   content: string
//   senderId: string
//   receiverId: string
//   conversationId: string
//   createdAt: string
//   sender: SocketUser
// }

// export function initializeSocket(server: NetServer) {
//   if (!server.io) {
//     console.log("Initializing Socket.io server...")

//     const io = new ServerIO(server, {
//       path: "/api/socket",
//       addTrailingSlash: false,
//       cors: {
//         origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
//         methods: ["GET", "POST"],
//       },
//     })

//     // Store connected users
//     const connectedUsers = new Map<string, { socketId: string; user: SocketUser }>()

//     io.on("connection", (socket) => {
//       console.log(`Socket connected: ${socket.id}`)

//       // Enhanced user presence tracking
//       const userPresence = new Map<
//         string,
//         {
//           user: SocketUser
//           lastSeen: Date
//           status: "online" | "away" | "busy"
//           currentRoom?: string
//         }
//       >()

//       // Typing indicators for conversations
//       const typingUsers = new Map<string, Set<string>>() // conversationId -> Set of userIds

//       // Handle user authentication
//       socket.on("authenticate", async (data: { userId: string; token: string }) => {
//         try {
//           // Verify JWT token here if needed
//           const { data: user, error } = await supabase
//             .from("users")
//             .select("id, username, full_name, avatar_url")
//             .eq("id", data.userId)
//             .single()

//           if (error || !user) {
//             socket.emit("auth_error", { message: "Authentication failed" })
//             return
//           }

//           const userData: SocketUser = {
//             id: user.id,
//             username: user.username,
//             fullName: user.full_name,
//             avatarUrl: user.avatar_url,
//           }

//           connectedUsers.set(data.userId, {
//             socketId: socket.id,
//             user: userData,
//           })

//           userPresence.set(data.userId, {
//             user: userData,
//             lastSeen: new Date(),
//             status: "online",
//           })

//           socket.userId = data.userId
//           socket.join(`user:${data.userId}`)

//           socket.emit("authenticated", { user: userData })

//           // Broadcast user online status
//           socket.broadcast.emit("user_online", { userId: data.userId, user: userData })

//           console.log(`User authenticated: ${userData.fullName} (${userData.id})`)
//         } catch (error) {
//           console.error("Authentication error:", error)
//           socket.emit("auth_error", { message: "Authentication failed" })
//         }
//       })

//       // Handle user presence updates
//       socket.on("update_presence", (data: { status: "online" | "away" | "busy" }) => {
//         if (socket.userId) {
//           const presence = userPresence.get(socket.userId)
//           if (presence) {
//             presence.status = data.status
//             presence.lastSeen = new Date()

//             // Broadcast presence update to relevant users
//             socket.broadcast.emit("user_presence_updated", {
//               userId: socket.userId,
//               status: data.status,
//               lastSeen: presence.lastSeen,
//             })
//           }
//         }
//       })

//       // Handle joining rooms
//       socket.on("join_room", (roomId: string) => {
//         socket.join(roomId)
//         console.log(`Socket ${socket.id} joined room: ${roomId}`)
//       })

//       socket.on("leave_room", (roomId: string) => {
//         socket.leave(roomId)
//         console.log(`Socket ${socket.id} left room: ${roomId}`)
//       })

//       // Handle real-time notifications
//       socket.on("send_notification", async (data: Omit<NotificationData, "id" | "createdAt">) => {
//         try {
//           const { data: notification, error } = await supabase
//             .from("notifications")
//             .insert({
//               user_id: data.userId,
//               type: data.type,
//               title: data.title,
//               message: data.message,
//               data: data.data,
//             })
//             .select()
//             .single()

//           if (error) {
//             console.error("Error creating notification:", error)
//             return
//           }

//           // Send to specific user
//           io.to(`user:${data.userId}`).emit("notification", {
//             ...notification,
//             createdAt: notification.created_at,
//           })

//           console.log(`Notification sent to user ${data.userId}`)
//         } catch (error) {
//           console.error("Error sending notification:", error)
//         }
//       })

//       // Handle real-time messages
//       socket.on("send_message", async (data: Omit<MessageData, "id" | "createdAt" | "sender">) => {
//         try {
//           const senderData = connectedUsers.get(data.senderId)
//           if (!senderData) {
//             socket.emit("error", { message: "Sender not authenticated" })
//             return
//           }

//           const { data: message, error } = await supabase
//             .from("messages")
//             .insert({
//               content: data.content,
//               sender_id: data.senderId,
//               receiver_id: data.receiverId,
//               conversation_id: data.conversationId,
//             })
//             .select()
//             .single()

//           if (error) {
//             console.error("Error creating message:", error)
//             socket.emit("error", { message: "Failed to send message" })
//             return
//           }

//           const messageData: MessageData = {
//             id: message.id,
//             content: message.content,
//             senderId: message.sender_id,
//             receiverId: message.receiver_id,
//             conversationId: message.conversation_id,
//             createdAt: message.created_at,
//             sender: senderData.user,
//           }

//           // Send to conversation room
//           io.to(`conversation:${data.conversationId}`).emit("new_message", messageData)

//           // Send notification to receiver if they're not in the conversation
//           const receiverConnection = connectedUsers.get(data.receiverId)
//           if (receiverConnection) {
//             io.to(`user:${data.receiverId}`).emit("message_notification", {
//               type: "new_message",
//               title: `Tin nhắn mới từ ${senderData.user.fullName}`,
//               message: data.content,
//               data: {
//                 conversationId: data.conversationId,
//                 senderId: data.senderId,
//               },
//             })
//           }

//           console.log(`Message sent in conversation ${data.conversationId}`)
//         } catch (error) {
//           console.error("Error sending message:", error)
//           socket.emit("error", { message: "Failed to send message" })
//         }
//       })

//       // Enhanced typing indicators with user info
//       socket.on("typing_start", (data: { conversationId: string; userId: string }) => {
//         if (!typingUsers.has(data.conversationId)) {
//           typingUsers.set(data.conversationId, new Set())
//         }

//         typingUsers.get(data.conversationId)?.add(data.userId)

//         const userData = connectedUsers.get(data.userId)
//         socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
//           userId: data.userId,
//           user: userData?.user,
//           isTyping: true,
//           conversationId: data.conversationId,
//         })

//         // Auto-stop typing after 3 seconds
//         setTimeout(() => {
//           typingUsers.get(data.conversationId)?.delete(data.userId)
//           socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
//             userId: data.userId,
//             user: userData?.user,
//             isTyping: false,
//             conversationId: data.conversationId,
//           })
//         }, 3000)
//       })

//       socket.on("typing_stop", (data: { conversationId: string; userId: string }) => {
//         typingUsers.get(data.conversationId)?.delete(data.userId)

//         const userData = connectedUsers.get(data.userId)
//         socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
//           userId: data.userId,
//           user: userData?.user,
//           isTyping: false,
//           conversationId: data.conversationId,
//         })
//       })

//       // New follower notifications with real-time updates
//       socket.on("new_follower", async (data: { followerId: string; followedId: string }) => {
//         try {
//           const { data: followerData } = await supabase
//             .from("users")
//             .select("id, username, full_name, avatar_url")
//             .eq("id", data.followerId)
//             .single()

//           if (followerData) {
//             // Send notification to followed user
//             const notification = {
//               type: "follow",
//               title: "Người theo dõi mới! 🎉",
//               message: `${followerData.full_name} đã bắt đầu theo dõi bạn`,
//               data: {
//                 followerId: data.followerId,
//                 followerUsername: followerData.username,
//                 followerAvatar: followerData.avatar_url,
//               },
//             }

//             // Save to database
//             await supabase.from("notifications").insert({
//               user_id: data.followedId,
//               type: notification.type,
//               title: notification.title,
//               message: notification.message,
//               data: notification.data,
//             })

//             io.to(`user:${data.followedId}`).emit("notification", notification)
//           }
//         } catch (error) {
//           console.error("Error handling new follower:", error)
//         }
//       })

//       // Handle project/video interactions
//       socket.on("project_liked", (data: { projectId: string; userId: string; likesCount: number }) => {
//         socket.broadcast.emit("project_updated", {
//           projectId: data.projectId,
//           likesCount: data.likesCount,
//         })
//       })

//       socket.on("video_liked", (data: { videoId: string; userId: string; likesCount: number }) => {
//         socket.broadcast.emit("video_updated", {
//           videoId: data.videoId,
//           likesCount: data.likesCount,
//         })
//       })

//       socket.on("new_comment", (data: { contentId: string; contentType: string; commentsCount: number }) => {
//         socket.broadcast.emit(`${data.contentType}_updated`, {
//           [`${data.contentType}Id`]: data.contentId,
//           commentsCount: data.commentsCount,
//         })
//       })

//       // Handle forum events
//       socket.on("thread_created", (threadData: any) => {
//         socket.broadcast.emit("new_thread", threadData)
//       })

//       socket.on("thread_comment", (data: { threadId: string; comment: any }) => {
//         io.to(`thread:${data.threadId}`).emit("new_thread_comment", data.comment)
//       })

//       // Handle disconnection
//       socket.on("disconnect", () => {
//         console.log(`Socket disconnected: ${socket.id}`)

//         if (socket.userId) {
//           connectedUsers.delete(socket.userId)
//           userPresence.delete(socket.userId)
//           socket.broadcast.emit("user_offline", { userId: socket.userId })
//         }
//       })

//       // Handle errors
//       socket.on("error", (error) => {
//         console.error("Socket error:", error)
//       })
//     })

//     server.io = io
//   }

//   return server.io
// }

// // Utility functions for sending notifications
// export async function sendNotificationToUser(
//   userId: string,
//   notification: Omit<NotificationData, "id" | "createdAt" | "userId">,
// ) {
//   try {
//     const { data, error } = await supabase
//       .from("notifications")
//       .insert({
//         user_id: userId,
//         type: notification.type,
//         title: notification.title,
//         message: notification.message,
//         data: notification.data,
//       })
//       .select()
//       .single()

//     if (error) {
//       console.error("Error creating notification:", error)
//       return
//     }

//     // If socket server is available, send real-time notification
//     if (global.io) {
//       global.io.to(`user:${userId}`).emit("notification", {
//         ...data,
//         createdAt: data.created_at,
//       })
//     }

//     return data
//   } catch (error) {
//     console.error("Error sending notification:", error)
//   }
// }

// export async function broadcastToRoom(roomId: string, event: string, data: any) {
//   if (global.io) {
//     global.io.to(roomId).emit(event, data)
//   }
// }
