import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SessionProviderWrapper } from "@/components/session-provider-wrapper" // Import wrapper

const inter = Inter({ subsets: ["latin", "vietnamese"] })

export const metadata: Metadata = {
  title: "GenZSkillBoost - Nền tảng kỹ năng và giải trí cho Gen Z Việt Nam",
  description:
    "Kết nối, học hỏi và giải trí cùng cộng đồng Gen Z Việt Nam. Chia sẻ dự án, tìm kiếm cơ hội và khám phá video ngắn thú vị.",
  keywords: "GenZ, kỹ năng, freelancer, video ngắn, cộng đồng, Việt Nam",
  authors: [{ name: "GenZSkillBoost Team" }],
  openGraph: {
    title: "GenZSkillBoost",
    description: "Nền tảng kỹ năng và giải trí cho Gen Z Việt Nam",
    type: "website",
    locale: "vi_VN",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}