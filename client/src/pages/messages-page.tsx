import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Send, 
  Loader2, 
  Bell, 
  Info, 
  User as UserIcon,
  MoreVertical,
  Image,
  Paperclip,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get all users (in a real app, would be your contacts or followed users)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // This would be an API call to get all contacts in a real app
      // For this demo, we'll mock some users
      return Array(5).fill(null).map((_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        password: "",
        isOnline: Math.random() > 0.5,
        isPremium: Math.random() > 0.7,
        createdAt: new Date()
      }));
    },
  });
  
  // Get messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
    // This will get all messages for the current user
  });
  
  // Filter messages for selected conversation
  const conversationMessages = selectedUserId ? 
    messages.filter(msg => 
      (msg.senderId === user?.id && msg.receiverId === selectedUserId) || 
      (msg.senderId === selectedUserId && msg.receiverId === user?.id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];
  
  // Get conversations list (grouped by user)
  const conversations = users.map(otherUser => {
    const lastMessage = messages
      .filter(msg => 
        (msg.senderId === user?.id && msg.receiverId === otherUser.id) || 
        (msg.senderId === otherUser.id && msg.receiverId === user?.id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    const unreadCount = messages.filter(msg => 
      msg.senderId === otherUser.id && 
      msg.receiverId === user?.id && 
      !msg.isRead
    ).length;
    
    return {
      user: otherUser,
      lastMessage,
      unreadCount
    };
  }).filter(conv => conv.lastMessage || searchQuery);
  
  // Filter conversations by search
  const filteredConversations = searchQuery ? 
    conversations.filter(conv => 
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.user.displayName && conv.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : conversations;
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    }
  });
  
  // Handle selecting a conversation
  const handleSelectConversation = (userId: number) => {
    setSelectedUserId(userId);
    
    // Mark unread messages as read
    messages
      .filter(msg => msg.senderId === userId && msg.receiverId === user?.id && !msg.isRead)
      .forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId || !user) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText.trim()
    });
  };
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);
  
  // Get selected user info
  const selectedUser = users.find(u => u.id === selectedUserId);
  
  // Format message timestamp
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return format(messageDate, "h:mm a");
    } else {
      return format(messageDate, "MMM d, h:mm a");
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 relative flex flex-col h-full">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10 h-16">
          <div className="flex items-center justify-between h-full px-4">
            <h1 className="text-xl font-bold">Messages</h1>
            
            {/* Right Menu Items */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <p className="text-gray-500 dark:text-gray-400">No conversations found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try a different search
                    </p>
                  )}
                </div>
              ) : (
                <ul>
                  {filteredConversations.map(({ user: conversationUser, lastMessage, unreadCount }) => (
                    <li 
                      key={conversationUser.id}
                      className={cn(
                        "px-4 py-3 flex items-center cursor-pointer transition-colors",
                        selectedUserId === conversationUser.id
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                        unreadCount > 0 && "bg-gray-100 dark:bg-gray-800/60"
                      )}
                      onClick={() => handleSelectConversation(conversationUser.id)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
                          {conversationUser.avatarUrl ? (
                            <img 
                              src={conversationUser.avatarUrl} 
                              alt={conversationUser.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <UserIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        {conversationUser.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium truncate">
                            {conversationUser.displayName || conversationUser.username}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(new Date(lastMessage.createdAt))}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage ? (
                            lastMessage.senderId === user?.id ? (
                              <span className="text-gray-500">You: {lastMessage.content}</span>
                            ) : (
                              lastMessage.content
                            )
                          ) : (
                            "Start a conversation"
                          )}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <div className="ml-2 bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-white text-xs">{unreadCount}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
                        {selectedUser.avatarUrl ? (
                          <img 
                            src={selectedUser.avatarUrl} 
                            alt={selectedUser.username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <UserIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {selectedUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">{selectedUser.displayName || selectedUser.username}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedUser.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                        <MessageSquare className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="font-medium">No messages yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    <>
                      {conversationMessages.map((message, index) => {
                        const isCurrentUser = message.senderId === user?.id;
                        return (
                          <div 
                            key={message.id} 
                            className={cn(
                              "flex",
                              isCurrentUser ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className="flex flex-col max-w-[70%]">
                              <div 
                                className={cn(
                                  "px-4 py-2 rounded-lg",
                                  isCurrentUser 
                                    ? "bg-primary text-white rounded-br-none" 
                                    : "bg-gray-200 dark:bg-gray-800 rounded-bl-none"
                                )}
                              >
                                <p>{message.content}</p>
                              </div>
                              <span 
                                className={cn(
                                  "text-xs mt-1",
                                  isCurrentUser ? "text-right" : "text-left",
                                  "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {formatMessageTime(new Date(message.createdAt))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <Image className="h-5 w-5" />
                    </button>
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <Smile className="h-5 w-5" />
                    </button>
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                  <MessageSquare className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Your Messages</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
                  Select a conversation or start a new one with your favorite creators and friends
                </p>
                <Button>New Message</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
