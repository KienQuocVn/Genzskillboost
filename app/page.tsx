import { MainLayout } from "@/components/layout/main-layout"
import { WelcomeSection } from "@/components/sections/welcome-section"

export default function HomePage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-hidden">
        <WelcomeSection />
      </div>
    </MainLayout>
  )
}
