"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")

    socketInstance.on("connect", () => {
      console.log("Connected to socket server")
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return socket
}
