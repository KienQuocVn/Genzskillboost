// CloudFront CDN utilities for optimized content delivery

interface CloudFrontConfig {
  distributionDomain: string
  region: string
}

const config: CloudFrontConfig = {
  distributionDomain: process.env.CLOUDFRONT_DOMAIN || "",
  region: process.env.AWS_REGION || "us-east-1",
}

export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: "webp" | "jpeg" | "png"
  } = {},
): string {
  if (!config.distributionDomain || !originalUrl) {
    return originalUrl
  }

  const { width, height, quality = 80, format = "webp" } = options

  // Extract the S3 key from the original URL
  const s3Key = originalUrl.split(".com/")[1] || originalUrl

  // Build CloudFront URL with image optimization parameters
  const params = new URLSearchParams()

  if (width) params.append("w", width.toString())
  if (height) params.append("h", height.toString())
  if (quality) params.append("q", quality.toString())
  if (format) params.append("f", format)

  const queryString = params.toString()
  const separator = queryString ? "?" : ""

  return `https://${config.distributionDomain}/${s3Key}${separator}${queryString}`
}

export function getOptimizedVideoUrl(originalUrl: string, quality: "720p" | "480p" | "360p" = "720p"): string {
  if (!config.distributionDomain || !originalUrl) {
    return originalUrl
  }

  const s3Key = originalUrl.split(".com/")[1] || originalUrl

  // For video optimization, you might want to use different quality versions
  // This assumes you have pre-processed videos in different qualities
  const qualityPrefix = quality === "720p" ? "hd" : quality === "480p" ? "md" : "sd"

  return `https://${config.distributionDomain}/${qualityPrefix}/${s3Key}`
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.oncanplaythrough = () => resolve()
    video.onerror = reject
    video.src = src
    video.preload = "metadata"
  })
}

// Image optimization hook
export function useOptimizedImage(originalUrl: string, options: Parameters<typeof getOptimizedImageUrl>[1] = {}) {
  const optimizedUrl = getOptimizedImageUrl(originalUrl, options)

  return {
    src: optimizedUrl,
    srcSet: [
      `${getOptimizedImageUrl(originalUrl, { ...options, width: options.width })} 1x`,
      `${getOptimizedImageUrl(originalUrl, { ...options, width: (options.width || 400) * 2 })} 2x`,
    ].join(", "),
  }
}
