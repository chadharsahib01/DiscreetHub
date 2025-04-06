import { Content, User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { X, ThumbsUp, ThumbsDown, Share, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaViewerModalProps {
  content?: Content | null;
  creator?: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBookmark?: (contentId: number) => void;
}

export function MediaViewerModal({
  content,
  creator,
  isOpen,
  onOpenChange,
  onBookmark
}: MediaViewerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(content?.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = async () => {
    if (!content || !user) return;
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await apiRequest("DELETE", `/api/bookmarks/${content.id}`);
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Content removed from your bookmarks"
        });
      } else {
        // Add bookmark
        await apiRequest("POST", "/api/bookmarks", { contentId: content.id });
        setIsBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Content added to your bookmarks"
        });
      }
      
      // Invalidate bookmarks query if it exists
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      
      if (onBookmark) {
        onBookmark(content.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };

  // Format likes number with K/M suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  };

  // Placeholder if no content
  if (!content) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-900">
        <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <DialogTitle className="text-lg font-medium">{content.title}</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>
        
        {/* Media Player */}
        <div className="relative flex-1 min-h-[300px] bg-black flex items-center justify-center">
          {content.contentUrl ? (
            content.contentUrl.includes('video') || content.contentUrl.includes('mp4') ? (
              <video 
                className="max-w-full max-h-[70vh]" 
                controls 
                autoPlay 
                src={content.contentUrl} 
              />
            ) : (
              <img 
                className="max-w-full max-h-[70vh] object-contain" 
                src={content.contentUrl} 
                alt={content.title} 
              />
            )
          ) : (
            <div className="text-white text-lg">Content not available</div>
          )}
        </div>
        
        {/* Content Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            {/* Creator Info */}
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
              {creator?.avatarUrl ? (
                <img 
                  src={creator.avatarUrl} 
                  alt={creator.username} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg font-bold">
                  {creator?.username.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{creator?.displayName || creator?.username || 'Unknown Creator'}</h3>
                {creator && user && creator.id !== user.id && (
                  <Button size="sm" variant="default" className="rounded-full">
                    Subscribe
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{content.description || 'No description available.'}</p>
              
              <div className="flex items-center space-x-4 mt-3">
                <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  <span>{formatNumber(likes)}</span>
                </button>
                <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <ThumbsDown className="mr-1 h-4 w-4" />
                  <span>{formatNumber(24)}</span>
                </button>
                <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Share className="mr-1 h-4 w-4" />
                  <span>Share</span>
                </button>
                <button 
                  onClick={handleBookmark}
                  className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <Bookmark className="mr-1 h-4 w-4" />
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
