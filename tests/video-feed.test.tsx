import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { VideoFeed } from "@/components/videos/video-feed"
import { useInView } from "react-intersection-observer"
import jest from "jest" // Import jest to declare the variable

// Mock dependencies
jest.mock("react-intersection-observer")
jest.mock("@/hooks/use-toast")

const mockUseInView = useInView as jest.MockedFunction<typeof useInView>

const mockVideos = [
  {
    id: "video-1",
    title: "Test Video 1",
    description: "Test description",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    duration: 30,
    tags: ["test", "video"],
    user: {
      id: "user-1",
      username: "testuser",
      fullName: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
    },
    likesCount: 10,
    commentsCount: 5,
    viewsCount: 100,
    createdAt: "2024-01-01T00:00:00Z",
    isLiked: false,
  },
]

describe("VideoFeed", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    mockUseInView.mockReturnValue({
      ref: jest.fn(),
      inView: false,
      entry: undefined,
    })

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders video feed with initial videos", () => {
    render(<VideoFeed initialVideos={mockVideos} />)

    expect(screen.getByText("Test Video 1")).toBeInTheDocument()
    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("@testuser")).toBeInTheDocument()
  })

  it("displays empty state when no videos", () => {
    render(<VideoFeed initialVideos={[]} />)

    expect(screen.getByText("Chưa có video nào")).toBeInTheDocument()
    expect(screen.getByText("Hãy là người đầu tiên chia sẻ video thú vị!")).toBeInTheDocument()
  })

  it("loads more videos when scrolling", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          videos: [
            {
              ...mockVideos[0],
              id: "video-2",
              title: "Test Video 2",
            },
          ],
        }),
    } as Response)

    // Mock inView as true to trigger loading
    mockUseInView.mockReturnValue({
      ref: jest.fn(),
      inView: true,
      entry: undefined,
    })

    render(<VideoFeed initialVideos={mockVideos} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/videos?page=1&limit=10&type=for-you")
    })
  })

  it("handles like action", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          likesCount: 11,
          isLiked: true,
        }),
    } as Response)

    render(<VideoFeed initialVideos={mockVideos} />)

    const likeButton = screen.getByRole("button", { name: /like/i })
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/videos/video-1/like", {
        method: "POST",
      })
    })
  })

  it("handles share action", async () => {
    // Mock navigator.share
    Object.assign(navigator, {
      share: jest.fn().mockResolvedValue(undefined),
    })

    render(<VideoFeed initialVideos={mockVideos} />)

    const shareButton = screen.getByRole("button", { name: /share/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalledWith({
        title: "Test Video 1",
        text: "Test description",
        url: expect.stringContaining("/videos/video-1"),
      })
    })
  })

  it("handles comment action", () => {
    // Mock window.location.href
    delete (window as any).location
    window.location = { href: "" } as any

    render(<VideoFeed initialVideos={mockVideos} />)

    const commentButton = screen.getByRole("button", { name: /comment/i })
    fireEvent.click(commentButton)

    expect(window.location.href).toBe("/videos/video-1")
  })

  it("shows loading skeletons while fetching", () => {
    mockUseInView.mockReturnValue({
      ref: jest.fn(),
      inView: true,
      entry: undefined,
    })

    render(<VideoFeed initialVideos={[]} />)

    // Should show loading skeletons
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(3)
  })

  it("shows end of feed message when no more videos", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          videos: [], // No more videos
        }),
    } as Response)

    mockUseInView.mockReturnValue({
      ref: jest.fn(),
      inView: true,
      entry: undefined,
    })

    render(<VideoFeed initialVideos={mockVideos} />)

    await waitFor(() => {
      expect(screen.getByText("🎉 Bạn đã xem hết video rồi!")).toBeInTheDocument()
    })
  })
})
