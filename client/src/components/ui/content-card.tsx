import { Content, User } from "@shared/schema";
import { Bookmark, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  content: Content;
  creator?: User;
  progress?: number;
  viewed?: boolean;
  isLive?: boolean;
  onBookmark?: (contentId: number) => void;
}

export function ContentCard({
  content,
  creator,
  progress,
  viewed = false,
  isLive = false,
  onBookmark
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format views number with K/M suffix
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} views`;
    }
  };

  // Handle bookmark click without navigating
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(content.id);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/content/${content.id}`}>
        <a className="block">
          <div className="relative pb-[56.25%]">
            {/* Thumbnail */}
            <img 
              src={content.thumbnailUrl || "https://via.placeholder.com/500x281?text=No+Thumbnail"} 
              alt={content.title} 
              className="absolute h-full w-full object-cover"
            />
            
            {/* Duration or LIVE badge */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
              {isLive ? "LIVE" : formatDuration(content.duration || 0)}
            </div>
            
            {/* Premium badge */}
            {content.isPremium && (
              <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded">
                PREMIUM
              </div>
            )}
            
            {/* Bookmark button */}
            <button 
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1.5 hover:bg-opacity-75 transition-colors duration-200"
              onClick={handleBookmarkClick}
            >
              <Bookmark className="h-4 w-4" />
            </button>
            
            {/* Progress bar for previously watched content */}
            {viewed && progress !== undefined && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
          
          <div className="p-3">
            <h3 className="font-medium truncate" title={content.title}>
              {content.title}
            </h3>
            <div className="flex items-center mt-2">
              {creator && (
                <>
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden mr-2">
                    {creator.avatarUrl ? (
                      <img 
                        src={creator.avatarUrl} 
                        alt={creator.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {creator.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {creator.displayName || creator.username}
                  </span>
                </>
              )}
              
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center">
                {viewed ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Watched recently
                  </>
                ) : (
                  formatViews(content.views || 0)
                )}
              </span>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
}
