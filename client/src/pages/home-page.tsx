import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/content-card";
import { CreatorCard } from "@/components/ui/creator-card";
import { MediaViewerModal } from "@/components/ui/media-viewer-modal";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Content, User } from "@shared/schema";
import { useState, useEffect } from "react";
import { Search, Bell, MessageSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, subscribeMutation } = useAuth();
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get all content
  const { data: allContent = [], isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });
  
  // Get trending content based on views
  const trendingContent = [...allContent]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);
  
  // Get recommended content - would use AI in a real implementation
  const recommendedContent = [...allContent]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  // Get recently viewed content - random for demo
  const recentlyViewedContent = [...allContent]
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
  
  // Get all users for creators
  const { data: creators = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Simulating a users API since we don't have one yet
      return allContent
        .map(content => ({
          id: content.creatorId,
          username: `user${content.creatorId}`,
          displayName: `Creator ${content.creatorId}`,
          password: "",
          isOnline: Math.random() > 0.5,
          isPremium: Math.random() > 0.5,
          createdAt: new Date()
        }))
        .filter((creator, index, self) => 
          self.findIndex(c => c.id === creator.id) === index
        );
    },
    enabled: allContent.length > 0
  });
  
  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("POST", "/api/bookmarks", { contentId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark added",
        description: "Content has been saved to your bookmarks"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to bookmark content",
        variant: "destructive"
      });
    }
  });

  // Find creator by content ID
  const getCreatorForContent = (contentId: number) => {
    const content = allContent.find(c => c.id === contentId);
    if (!content) return null;
    
    return creators.find(creator => creator.id === content.creatorId) || null;
  };

  // Handle content click to open modal
  const handleContentClick = (content: Content) => {
    setSelectedContent(content);
    setSelectedCreator(getCreatorForContent(content.id));
    setIsModalOpen(true);
  };

  // Handle bookmark click
  const handleBookmark = (contentId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to bookmark content",
        variant: "destructive"
      });
      return;
    }
    
    bookmarkMutation.mutate(contentId);
  };

  // Initialize dark mode based on user preference or system preference
  useEffect(() => {
    const darkModePreference = localStorage.getItem('dark-mode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldEnableDarkMode = 
      darkModePreference === 'true' || 
      (!darkModePreference && prefersDarkMode);
    
    if (shouldEnableDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 relative">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Search content, creators, or messages..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
              {!user?.isPremium && (
                <Button
                  onClick={() => subscribeMutation.mutate()}
                  disabled={subscribeMutation.isPending}
                  className="hidden md:block ml-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors duration-200"
                >
                  {subscribeMutation.isPending ? "Processing..." : "Subscribe"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Search (Hidden on desktop) */}
          <div className="block md:hidden px-4 pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 4rem)" }}>
          {/* Trending Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Trending Now</h2>
              <Link href="/trending">
                <a className="text-primary dark:text-primary-light text-sm font-medium hover:underline">
                  View All
                </a>
              </Link>
            </div>
            
            {isLoadingContent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="pb-[56.25%] bg-gray-300 dark:bg-gray-700 relative"></div>
                    <div className="p-3">
                      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mt-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 mr-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="ml-auto h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/5"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trendingContent.map(content => {
                  const creator = creators.find(c => c.id === content.creatorId);
                  return (
                    <div key={content.id} onClick={() => handleContentClick(content)}>
                      <ContentCard 
                        content={content} 
                        creator={creator} 
                        onBookmark={handleBookmark}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recommended Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recommended For You</h2>
              <Link href="/recommended">
                <a className="text-primary dark:text-primary-light text-sm font-medium hover:underline">
                  Refresh
                </a>
              </Link>
            </div>
            
            {isLoadingContent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="pb-[56.25%] bg-gray-300 dark:bg-gray-700 relative"></div>
                    <div className="p-3">
                      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mt-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 mr-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="ml-auto h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/5"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedContent.map(content => {
                  const creator = creators.find(c => c.id === content.creatorId);
                  return (
                    <div key={content.id} onClick={() => handleContentClick(content)}>
                      <ContentCard 
                        content={content} 
                        creator={creator} 
                        onBookmark={handleBookmark}
                        isLive={content.id % 5 === 0}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Popular Creators */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Popular Creators</h2>
              <Link href="/creators">
                <a className="text-primary dark:text-primary-light text-sm font-medium hover:underline">
                  View All
                </a>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {creators.slice(0, 6).map((creator, index) => (
                <CreatorCard 
                  key={creator.id} 
                  creator={creator} 
                  followerCount={Math.floor(Math.random() * 100000)} 
                  isFollowing={index === 2}
                  isLive={index === 5}
                />
              ))}
            </div>
          </section>

          {/* Recently Viewed */}
          {recentlyViewedContent.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recently Viewed</h2>
                <Link href="/history">
                  <a className="text-primary dark:text-primary-light text-sm font-medium hover:underline">
                    View All
                  </a>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentlyViewedContent.map(content => {
                  const creator = creators.find(c => c.id === content.creatorId);
                  return (
                    <div key={content.id} onClick={() => handleContentClick(content)}>
                      <ContentCard 
                        content={content} 
                        creator={creator} 
                        viewed={true}
                        progress={Math.floor(Math.random() * 100)}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        {/* Floating Action Button for Mobile */}
        <button className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg flex items-center justify-center transition-colors duration-200">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        content={selectedContent}
        creator={selectedCreator}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onBookmark={handleBookmark}
      />
    </div>
  );
}
