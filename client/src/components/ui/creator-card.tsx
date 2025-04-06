import { User } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  creator: User;
  followerCount?: number;
  isFollowing?: boolean;
  isLive?: boolean;
}

export function CreatorCard({
  creator,
  followerCount = 0,
  isFollowing = false,
  isLive = false
}: CreatorCardProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Format follower count with K/M suffix
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subs`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K subs`;
    } else {
      return `${count} subs`;
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to follow creators",
        variant: "destructive"
      });
      return;
    }

    if (user.id === creator.id) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (following) {
        // Unfollow
        await apiRequest("DELETE", `/api/follow/${creator.id}`);
        setFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${creator.displayName || creator.username}`
        });
      } else {
        // Follow
        await apiRequest("POST", "/api/follow", { followedId: creator.id });
        setFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${creator.displayName || creator.username}`
        });
      }
      
      // Invalidate user followers query if it exists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/user/${creator.id}`}>
      <a className="block">
        <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 text-center p-4">
          <div className="relative mx-auto mb-3">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-2 ring-primary">
              {creator.avatarUrl ? (
                <img 
                  src={creator.avatarUrl}
                  alt={creator.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl font-bold">
                  {creator.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {creator.isOnline && (
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            )}
            {isLive && (
              <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                LIVE
              </div>
            )}
          </div>
          <h3 className="font-medium truncate" title={creator.displayName || creator.username}>
            {creator.displayName || creator.username}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {formatFollowers(followerCount)}
          </p>
          <button 
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-1 text-sm rounded-full transition-colors duration-200",
              following 
                ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200" 
                : "bg-primary hover:bg-primary-dark text-white"
            )}
          >
            {isLoading ? "..." : following ? "Following" : "Follow"}
          </button>
        </div>
      </a>
    </Link>
  );
}
