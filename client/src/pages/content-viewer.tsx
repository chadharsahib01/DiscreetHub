import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Content, User } from "@shared/schema";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ui/content-card";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share, 
  Bookmark, 
  MessageSquare, 
  Bell, 
  Loader2, 
  User as UserIcon,
  Play, 
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function ContentViewer() {
  const { id } = useParams<{ id: string }>();
  const contentId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Get content by ID
  const { 
    data: content, 
    isLoading: isLoadingContent, 
    error: contentError 
  } = useQuery<Content>({
    queryKey: [`/api/content/${contentId}`],
    enabled: !isNaN(contentId),
  });
  
  // Get content creator
  const { 
    data: creator, 
    isLoading: isLoadingCreator 
  } = useQuery<User>({
    queryKey: [`/api/users/${content?.creatorId}`],
    enabled: !!content?.creatorId,
    queryFn: async () => {
      // In a real app, you'd have a proper API for this
      // For this demo, we're creating a mock creator
      return {
        id: content!.creatorId,
        username: `creator${content!.creatorId}`,
        displayName: `Creator ${content!.creatorId}`,
        bio: "Professional content creator",
        avatarUrl: "",
        isOnline: true,
        isPremium: true,
        password: "",
        createdAt: new Date()
      };
    }
  });
  
  // Get recommended content
  const { data: recommendedContent = [] } = useQuery<Content[]>({
    queryKey: ["/api/content"],
    select: (data) => {
      // Filter out current content and take up to 4 items
      return data
        .filter(item => item.id !== contentId)
        .slice(0, 4);
    },
    enabled: !isNaN(contentId),
  });
  
  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      if (action === 'add') {
        const res = await apiRequest("POST", "/api/bookmarks", { contentId });
        return await res.json();
      } else {
        const res = await apiRequest("DELETE", `/api/bookmarks/${contentId}`);
        return true;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setIsBookmarked(variables === 'add');
      toast({
        title: variables === 'add' ? "Bookmark added" : "Bookmark removed",
        description: variables === 'add' 
          ? "Content has been saved to your bookmarks" 
          : "Content removed from your bookmarks"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  });

  // Like content mutation (simplified)
  const likeMutation = useMutation({
    mutationFn: async () => {
      // In a real app, you'd have a proper API for this
      // This is just a placeholder
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      if (content) {
        queryClient.setQueryData([`/api/content/${contentId}`], {
          ...content,
          likes: isLiked ? content.likes - 1 : content.likes + 1
        });
      }
    }
  });

  // Follow creator mutation (simplified)
  const followMutation = useMutation({
    mutationFn: async () => {
      // In a real app, you'd have a proper API for this
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Following",
        description: `You are now following ${creator?.displayName || creator?.username}`
      });
    }
  });
  
  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to bookmark content",
        variant: "destructive"
      });
      return;
    }
    
    bookmarkMutation.mutate(isBookmarked ? 'remove' : 'add');
  };
  
  // Handle like toggle
  const handleLikeToggle = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to like content",
        variant: "destructive"
      });
      return;
    }
    
    likeMutation.mutate();
  };
  
  // Get bookmarks to check if current content is bookmarked
  useEffect(() => {
    if (user && contentId) {
      // In a real app, you'd have a proper API for this
      // This is just a placeholder to simulate checking bookmarks
      setIsBookmarked(Math.random() > 0.7); // randomly set bookmarked status for demo
    }
  }, [user, contentId]);
  
  // Check if content is premium and user doesn't have access
  const isPremiumLocked = content?.isPremium && !user?.isPremium;
  
  // Format views count
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  };
  
  if (isLoadingContent) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!content || contentError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
          <Play className="h-12 w-12 text-gray-500 dark:text-gray-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Content Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The content you're looking for doesn't exist or has been removed
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 relative flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <Link href="/">
                <a className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mr-3">
                  <ArrowLeft className="h-5 w-5" />
                </a>
              </Link>
              <h1 className="text-xl font-bold truncate max-w-md">{content.title}</h1>
            </div>
            
            {/* Right Menu Items */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <Link href="/messages">
                <a className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
                </a>
              </Link>
            </div>
          </div>
        </header>

        {/* Content Viewer */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Content Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-6 relative">
              {isPremiumLocked ? (
                <div className="relative pb-[56.25%] bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                    <div className="bg-primary/20 rounded-full p-6 mb-4">
                      <Play className="h-12 w-12 text-primary-light" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Premium Content</h2>
                    <p className="text-gray-300 mb-6 max-w-md">
                      This content is available exclusively for premium subscribers.
                      Upgrade your account to get access to all premium content.
                    </p>
                    <Button className="bg-primary hover:bg-primary-dark text-white">
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              ) : content.contentUrl ? (
                content.contentUrl.includes('video') || content.contentUrl.includes('mp4') ? (
                  <div className="relative pb-[56.25%]">
                    <video 
                      className="absolute inset-0 w-full h-full object-contain bg-black" 
                      controls 
                      autoPlay 
                      src={content.contentUrl} 
                    />
                  </div>
                ) : (
                  <div className="relative pb-[56.25%] bg-black flex items-center justify-center">
                    <img 
                      className="absolute inset-0 w-full h-full object-contain" 
                      src={content.contentUrl} 
                      alt={content.title} 
                    />
                  </div>
                )
              ) : (
                <div className="relative pb-[56.25%] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-white text-lg">Content not available</div>
                </div>
              )}
            </div>
            
            {/* Content Info */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatCount(content.views || 0)} views</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                  {content.isPremium && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded">PREMIUM</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex flex-col md:flex-row md:items-start">
                {/* Creator Info */}
                <div className="flex items-start mb-4 md:mb-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
                      {isLoadingCreator ? (
                        <div className="animate-pulse w-full h-full bg-gray-300 dark:bg-gray-700"></div>
                      ) : creator?.avatarUrl ? (
                        <img 
                          src={creator.avatarUrl} 
                          alt={creator.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    {creator?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <h3 className="font-medium">
                      {isLoadingCreator ? (
                        <div className="animate-pulse w-32 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      ) : (
                        creator?.displayName || creator?.username || 'Unknown Creator'
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isLoadingCreator ? (
                        <div className="animate-pulse w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded mt-1"></div>
                      ) : (
                        creator?.isPremium ? 'Premium Creator' : 'Creator'
                      )}
                    </p>
                  </div>
                  
                  {creator && user && creator.id !== user.id && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="ml-4"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Follow"
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 md:ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(isLiked && "bg-primary/10")}
                    onClick={handleLikeToggle}
                  >
                    <ThumbsUp className={cn("mr-1 h-4 w-4", isLiked && "text-primary")} />
                    <span>{formatCount(content.likes || 0)}</span>
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="mr-1 h-4 w-4" />
                    <span>Dislike</span>
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share className="mr-1 h-4 w-4" />
                    <span>Share</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(isBookmarked && "bg-primary/10")}
                    onClick={handleBookmarkToggle}
                    disabled={bookmarkMutation.isPending}
                  >
                    {bookmarkMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className={cn("mr-1 h-4 w-4", isBookmarked && "text-primary")} />
                    )}
                    <span>{isBookmarked ? "Saved" : "Save"}</span>
                  </Button>
                </div>
              </div>
              
              {/* Description */}
              {content.description && (
                <div className="p-4 pt-0 mt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                    {content.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Recommended Content */}
            {recommendedContent.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommendedContent.map(content => (
                    <ContentCard 
                      key={content.id} 
                      content={content} 
                      creator={creator}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
