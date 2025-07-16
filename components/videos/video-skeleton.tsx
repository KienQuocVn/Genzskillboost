export function VideoSkeleton() {
  return (
    <div className="relative bg-muted rounded-2xl overflow-hidden aspect-[9/16] max-h-[80vh] animate-pulse">
      {/* Video Area */}
      <div className="w-full h-full bg-muted-foreground/10"></div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <div className="flex items-end justify-between">
          {/* Left Side - Video Info */}
          <div className="flex-1 mr-4 space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-3 w-20 bg-white/20 rounded"></div>
                <div className="h-2 w-16 bg-white/20 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-white/20 rounded"></div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-white/20 rounded"></div>
              <div className="h-2 w-1/2 bg-white/20 rounded"></div>
            </div>

            {/* Tags */}
            <div className="flex space-x-2">
              <div className="h-2 w-12 bg-white/20 rounded"></div>
              <div className="h-2 w-16 bg-white/20 rounded"></div>
            </div>

            {/* Stats */}
            <div className="flex space-x-4">
              <div className="h-2 w-16 bg-white/20 rounded"></div>
              <div className="h-2 w-12 bg-white/20 rounded"></div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex flex-col space-y-4">
            <div className="h-12 w-12 bg-white/20 rounded-full"></div>
            <div className="h-12 w-12 bg-white/20 rounded-full"></div>
            <div className="h-12 w-12 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
