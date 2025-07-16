"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Grid, List, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
// import { ProjectCard } from "./project-card"
// import { ProjectListItem } from "./project-list-item"
import { useDebounce } from "@/hooks/use-debounce"
import type { Project, ProjectCategory } from "@/types"

interface SearchFilters {
  categories: ProjectCategory[]
  tags: string[]
  sortBy: "newest" | "oldest" | "most-liked" | "most-viewed"
}

const categories: { value: ProjectCategory; label: string }[] = [
  { value: "web-development", label: "Phát triển Web" },
  { value: "mobile-development", label: "Phát triển Mobile" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "content-creation", label: "Sáng tạo nội dung" },
  { value: "business", label: "Kinh doanh" },
  { value: "other", label: "Khác" },
]

const popularTags = [
  "React",
  "TypeScript",
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Python",
  "JavaScript",
  "UI/UX",
  "Mobile App",
  "E-commerce",
  "AI/ML",
  "Blockchain",
  "Game Development",
  "Data Science",
]

export function ProjectSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    tags: [],
    sortBy: "newest",
  })

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/projects/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: debouncedSearchQuery,
            filters,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [debouncedSearchQuery, filters])

  // Filter and sort projects
  const sortedAndFilteredProjects = useMemo(() => {
    const filtered = [...projects]

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "most-liked":
        filtered.sort((a, b) => b.likesCount - a.likesCount)
        break
      case "most-viewed":
        filtered.sort((a, b) => b.viewsCount - a.viewsCount)
        break
    }

    return filtered
  }, [projects, filters.sortBy])

  const handleCategoryChange = (category: ProjectCategory, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, category] : prev.categories.filter((c) => c !== category),
    }))
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag),
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      sortBy: "newest",
    })
  }

  const activeFiltersCount = filters.categories.length + filters.tags.length

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm dự án, người dùng, hoặc công nghệ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden bg-transparent">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Lọc
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
                <SheetDescription>Tùy chỉnh kết quả tìm kiếm theo ý muốn</SheetDescription>
              </SheetHeader>
              <FilterContent
                filters={filters}
                onCategoryChange={handleCategoryChange}
                onTagChange={handleTagChange}
                onSortChange={(sortBy) => setFilters((prev) => ({ ...prev, sortBy }))}
                onClearFilters={clearFilters}
              />
            </SheetContent>
          </Sheet>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 8).map((tag) => (
            <Button
              key={tag}
              variant={filters.tags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => handleTagChange(tag, !filters.tags.includes(tag))}
              className="h-8"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden md:block w-80 space-y-6">
          <FilterContent
            filters={filters}
            onCategoryChange={handleCategoryChange}
            onTagChange={handleTagChange}
            onSortChange={(sortBy) => setFilters((prev) => ({ ...prev, sortBy }))}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {loading ? "Đang tìm kiếm..." : `Tìm thấy ${sortedAndFilteredProjects.length} dự án`}
            </div>
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => setFilters((prev) => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="most-liked">Nhiều like nhất</SelectItem>
                <SelectItem value="most-viewed">Nhiều lượt xem nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Grid/List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48"></div>
                </div>
              ))}
            </div>
          ) : sortedAndFilteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy dự án nào phù hợp</p>
                <p className="text-sm">Thử thay đổi từ khóa hoặc bộ lọc</p>
              </div>
              <Button onClick={clearFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {/* {sortedAndFilteredProjects.map((project) =>
                viewMode === "grid" ? (
                  <ProjectCard key={project.id} project={project} />
                ) : (
                  <ProjectListItem key={project.id} project={project} />
                ),
              )} */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FilterContentProps {
  filters: SearchFilters
  onCategoryChange: (category: ProjectCategory, checked: boolean) => void
  onTagChange: (tag: string, checked: boolean) => void
  onSortChange: (sortBy: SearchFilters["sortBy"]) => void
  onClearFilters: () => void
}

function FilterContent({ filters, onCategoryChange, onTagChange, onSortChange, onClearFilters }: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bộ lọc</h3>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Xóa tất cả
        </Button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Danh mục</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={category.value}
                checked={filters.categories.includes(category.value)}
                onCheckedChange={(checked) => onCategoryChange(category.value, checked as boolean)}
              />
              <Label htmlFor={category.value} className="text-sm">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Tags phổ biến</h4>
        <div className="space-y-2">
          {popularTags.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={tag}
                checked={filters.tags.includes(tag)}
                onCheckedChange={(checked) => onTagChange(tag, checked as boolean)}
              />
              <Label htmlFor={tag} className="text-sm">
                {tag}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Sắp xếp theo</h4>
        <Select value={filters.sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="most-liked">Nhiều like nhất</SelectItem>
            <SelectItem value="most-viewed">Nhiều lượt xem nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
