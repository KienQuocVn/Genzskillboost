import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProjectUpload } from "@/components/skills/project-upload"
import { uploadToS3 } from "@/lib/aws-s3"
import jest from "jest" // Import jest to declare it

// Mock dependencies
jest.mock("@/lib/aws-s3")
jest.mock("@/hooks/use-toast")

const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>

describe("ProjectUpload", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    mockUploadToS3.mockResolvedValue("https://s3.amazonaws.com/test-image.jpg")
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders project upload form", () => {
    render(<ProjectUpload />)

    expect(screen.getByText("Đăng dự án mới 🚀")).toBeInTheDocument()
    expect(screen.getByLabelText("Tiêu đề dự án *")).toBeInTheDocument()
    expect(screen.getByLabelText("Danh mục *")).toBeInTheDocument()
    expect(screen.getByLabelText("Mô tả dự án *")).toBeInTheDocument()
    expect(screen.getByText("Hình ảnh dự án *")).toBeInTheDocument()
  })

  it("validates required fields", async () => {
    const user = userEvent.setup()
    render(<ProjectUpload />)

    const submitButton = screen.getByText("Đăng dự án")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Tiêu đề là bắt buộc")).toBeInTheDocument()
      expect(screen.getByText("Vui lòng chọn danh mục")).toBeInTheDocument()
      expect(screen.getByText("Mô tả phải có ít nhất 10 ký tự")).toBeInTheDocument()
    })
  })

  it("handles image upload", async () => {
    const user = userEvent.setup()
    render(<ProjectUpload />)

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    const fileInput = screen.getByLabelText("Chọn hình ảnh")

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByAltText("Preview 1")).toBeInTheDocument()
    })
  })

  it("adds and removes tags correctly", async () => {
    const user = userEvent.setup()
    render(<ProjectUpload />)

    const tagInput = screen.getByPlaceholderText("VD: React, TypeScript, E-commerce")
    const addButton = screen.getByText("Thêm")

    await user.type(tagInput, "React")
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText("React")).toBeInTheDocument()
    })

    // Remove tag
    const removeButton = screen.getByRole("button", { name: /remove/i })
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText("React")).not.toBeInTheDocument()
    })
  })

  it("submits form successfully", async () => {
    const user = userEvent.setup()

    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "project-1" }),
    })

    render(<ProjectUpload />)

    // Fill form
    await user.type(screen.getByLabelText("Tiêu đề dự án *"), "Test Project")
    await user.selectOptions(screen.getByLabelText("Danh mục *"), "web-development")
    await user.type(
      screen.getByLabelText("Mô tả dự án *"),
      "This is a test project description with more than 10 characters",
    )

    // Add image
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    const fileInput = screen.getByLabelText("Chọn hình ảnh")
    await user.upload(fileInput, file)

    // Add tag
    await user.type(screen.getByPlaceholderText("VD: React, TypeScript, E-commerce"), "React")
    await user.click(screen.getByText("Thêm"))

    // Submit form
    const submitButton = screen.getByText("Đăng dự án")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUploadToS3).toHaveBeenCalledWith(file, expect.stringContaining("projects/"))
      expect(global.fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Project",
          description: "This is a test project description with more than 10 characters",
          category: "web-development",
          images: ["https://s3.amazonaws.com/test-image.jpg"],
          tags: ["React"],
        }),
      })
    })
  })

  it("handles upload errors gracefully", async () => {
    const user = userEvent.setup()

    // Mock failed upload
    mockUploadToS3.mockRejectedValue(new Error("Upload failed"))

    render(<ProjectUpload />)

    // Fill form
    await user.type(screen.getByLabelText("Tiêu đề dự án *"), "Test Project")
    await user.selectOptions(screen.getByLabelText("Danh mục *"), "web-development")
    await user.type(screen.getByLabelText("Mô tả dự án *"), "This is a test project description")

    // Add image
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    const fileInput = screen.getByLabelText("Chọn hình ảnh")
    await user.upload(fileInput, file)

    // Submit form
    const submitButton = screen.getByText("Đăng dự án")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Có lỗi xảy ra khi tạo dự án. Vui lòng thử lại.")).toBeInTheDocument()
    })
  })
})
