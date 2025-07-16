"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Video, Users, TrendingUp } from "lucide-react"

export function WelcomeSection() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-genz-purple to-genz-pink bg-clip-text text-transparent">
          Chào mừng đến với GenZSkillBoost! 🚀
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nền tảng kết nối Gen Z Việt Nam - Nơi bạn có thể chia sẻ kỹ năng, tìm kiếm cơ hội và giải trí cùng cộng đồng
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-genz-purple/10 rounded-lg flex items-center justify-center mb-2">
                <Briefcase className="h-6 w-6 text-genz-purple" />
              </div>
              <CardTitle>Kỹ năng & Dự án</CardTitle>
              <CardDescription>Chia sẻ dự án, tìm kiếm freelancer và kết nối với các công ty</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-genz-pink/10 rounded-lg flex items-center justify-center mb-2">
                <Video className="h-6 w-6 text-genz-pink" />
              </div>
              <CardTitle>Video giải trí</CardTitle>
              <CardDescription>Xem và chia sẻ video ngắn thú vị, kết nối với bạn bè</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-genz-cyan/10 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-genz-cyan" />
              </div>
              <CardTitle>Cộng đồng</CardTitle>
              <CardDescription>Tham gia diễn đàn, thảo luận và học hỏi từ cộng đồng</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-genz-yellow/10 rounded-lg flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-genz-yellow" />
              </div>
              <CardTitle>Phát triển</CardTitle>
              <CardDescription>Nâng cao kỹ năng và mở rộng cơ hội nghề nghiệp</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center space-y-4"
      >
        <h2 className="text-2xl font-semibold">Sẵn sàng bắt đầu?</h2>
        <div className="flex justify-center space-x-4">
          <Button className="bg-genz-purple hover:bg-genz-purple/90">Khám phá kỹ năng</Button>
          <Button variant="outline" className="border-genz-pink text-genz-pink hover:bg-genz-pink/10 bg-transparent">
            Xem video
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
