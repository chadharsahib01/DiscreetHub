import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Bookmark, 
  User, 
  FileText, 
  Film, 
  Image, 
  Video, 
  FileQuestion, 
  Settings, 
  Moon, 
  Sun, 
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Set initial dark mode state based on user preference or system preference
  useEffect(() => {
    const darkModePreference = localStorage.getItem('dark-mode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldEnableDarkMode = 
      darkModePreference === 'true' || 
      (!darkModePreference && prefersDarkMode);
    
    setIsDarkMode(shouldEnableDarkMode);
    
    if (shouldEnableDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('dark-mode', newDarkMode.toString());
  };

  // Categories for the sidebar
  const categories = [
    { name: "Videos", icon: <Film className="w-5 h-5" /> },
    { name: "Photos", icon: <Image className="w-5 h-5" /> },
    { name: "Live Streams", icon: <Video className="w-5 h-5" /> },
    { name: "Articles", icon: <FileQuestion className="w-5 h-5" /> }
  ];

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menuToggle');
      
      if (window.innerWidth < 768 && sidebar && menuToggle) {
        const isClickInside = sidebar.contains(event.target as Node) || 
                              menuToggle.contains(event.target as Node);
        
        if (!isClickInside && isMobileOpen) {
          setIsMobileOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        id="menuToggle" 
        onClick={toggleMobileSidebar}
        className="md:hidden fixed top-4 left-4 z-30 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside 
        id="sidebar" 
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-lg dark:shadow-xl",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-primary dark:text-primary-light">DiscreetHub</h1>
          </div>
          
          {/* User Profile Summary */}
          {user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={`${user.username}'s profile`} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-full h-full p-2 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">{user.displayName || user.username}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.isPremium ? 'Premium Member' : 'Free Member'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-1">
            <Link href="/">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <Home className="mr-3 h-5 w-5 text-primary" />
                <span>Home</span>
              </a>
            </Link>
            
            <Link href="/explore">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/explore" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <Compass className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Explore</span>
              </a>
            </Link>
            
            <Link href="/messages">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/messages" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <MessageSquare className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Messages</span>
                <span className="ml-auto bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">3</span>
              </a>
            </Link>
            
            <Link href="/bookmarks">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/bookmarks" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <Bookmark className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Bookmarks</span>
              </a>
            </Link>
            
            <Link href="/profile">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/profile" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <User className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>My Profile</span>
              </a>
            </Link>
            
            <Link href="/my-content">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/my-content" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <FileText className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>My Content</span>
              </a>
            </Link>
            
            <Link href="/subscribe">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-md group transition-colors duration-200",
                location === "/subscribe" 
                  ? "text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}>
                <CreditCard className="mr-3 h-5 w-5 text-pink-500" />
                <span>{user?.isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}</span>
                {!user?.isPremium && (
                  <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">New</span>
                )}
              </a>
            </Link>
            
            {/* Categories Section */}
            <div className="pt-4 pb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categories
              </h3>
            </div>
            
            {categories.map((category, index) => (
              <Link key={index} href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <a className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md group transition-colors duration-200">
                  {category.icon}
                  <span className="ml-3">{category.name}</span>
                </a>
              </Link>
            ))}
          </nav>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/settings">
              <a className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md group transition-colors duration-200">
                <Settings className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Settings</span>
              </a>
            </Link>
            
            <button 
              onClick={toggleDarkMode}
              className="w-full mt-2 flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md group transition-colors duration-200"
            >
              {isDarkMode ? (
                <>
                  <Sun className="mr-3 h-5 w-5 text-gray-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="mr-3 h-5 w-5 text-gray-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button 
              onClick={() => logoutMutation.mutate()}
              className="w-full mt-2 flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md group transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
