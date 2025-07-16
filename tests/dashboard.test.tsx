import type React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"
import { SkillsDashboard } from "@/components/skills/dashboard"
import { useSocket } from "@/hooks/use-socket"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock dependencies
jest.mock("@/hooks/use-socket")
jest.mock("next-auth/react")

const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>

const mockSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
  },
}

const MockSessionProvider = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={mockSession}>{children}</SessionProvider>
)

describe("SkillsDashboard", () => {
  beforeEach(() => {
    mockUseSocket.mockReturnValue(null)
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders dashboard with default recommendations tab", () => {
    render(
      <MockSessionProvider>
        <SkillsDashboard />
      </MockSessionProvider>,
    )

    expect(screen.getByText("Kỹ năng & Cộng đồng")).toBeInTheDocument()
    expect(screen.getByText("Gợi ý")).toBeInTheDocument()
    expect(screen.getByText("Khám phá")).toBeInTheDocument()
    expect(screen.getByText("Đang theo dõi")).toBeInTheDocument()
    expect(screen.getByText("Hoạt động")).toBeInTheDocument()
    expect(screen.getByText("Hồ sơ")).toBeInTheDocument()
  })

  it("switches between sidebar items correctly", async () => {
    render(
      <MockSessionProvider>
        <SkillsDashboard />
      </MockSessionProvider>,
    )

    const exploreButton = screen.getByText("Khám phá")
    fireEvent.click(exploreButton)

    await waitFor(() => {
      expect(exploreButton.closest("button")).toHaveClass("bg-genz-purple/10")
    })
  })

  it("displays correct content for each sidebar item", async () => {
    render(
      <MockSessionProvider>
        <SkillsDashboard />
      </MockSessionProvider>,
    )

    // Test switching to Profile tab
    const profileButton = screen.getByText("Hồ sơ")
    fireEvent.click(profileButton)

    await waitFor(() => {
      // Profile content should be rendered
      expect(profileButton.closest("button")).toHaveClass("bg-genz-purple/10")
    })
  })

  it("handles socket connection properly", () => {
    const mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }
    mockUseSocket.mockReturnValue(mockSocket as any)

    render(
      <MockSessionProvider>
        <SkillsDashboard />
      </MockSessionProvider>,
    )

    expect(mockSocket.emit).toHaveBeenCalledWith("authenticate", {
      userId: "user-1",
      token: expect.any(String),
    })
  })

  it("renders mobile-friendly layout", () => {
    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(
      <MockSessionProvider>
        <SkillsDashboard />
      </MockSessionProvider>,
    )

    const sidebar = screen.getByRole("complementary")
    expect(sidebar).toHaveClass("w-80")
  })
})
