import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Content } from "@shared/schema";
import { ContentCard } from "@/components/ui/content-card";
import { Loader2, MessageSquare, Bell, User as UserIcon, Camera, Settings, Edit } from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
  avatarUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfileMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [imagePreview, setImagePreview] = useState(user?.avatarUrl || "");

  // Get user content
  const { data: userContent = [], isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: [`/api/users/${user?.id}/content`],
    enabled: !!user,
  });

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
    }
  });

  // Handle profile update
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Handle image preview
  const handleImageUrlChange = (url: string) => {
    if (url && url.startsWith("http")) {
      setImagePreview(url);
    } else {
      setImagePreview("");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 relative">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-bold">My Profile</h1>
            
            {/* Right Menu Items */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <main className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 4rem)" }}>
          {/* Profile Header */}
          <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="px-6 py-4 flex flex-col md:flex-row items-center md:items-end -mt-16">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {imagePreview || user.avatarUrl ? (
                    <img 
                      src={imagePreview || user.avatarUrl} 
                      alt={user.displayName || user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark text-white rounded-full p-2 shadow-md">
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                <h2 className="text-2xl font-bold">{user.displayName || user.username}</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.bio || "No bio available"}
                </p>
                <div className="mt-2 flex space-x-4 justify-center md:justify-start">
                  <div>
                    <span className="font-bold">24</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">Following</span>
                  </div>
                  <div>
                    <span className="font-bold">128</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{userContent.length}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">Content</span>
                  </div>
                </div>
              </div>
              <div className="ml-auto mt-4 md:mt-0">
                <Button variant="outline" size="sm" className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Cover
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="content">My Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and how others see you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your display name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell others about yourself..." 
                                className="resize-none h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/your-image.jpg" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleImageUrlChange(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          {updateProfileMutation.isPending ? (
                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>My Content</CardTitle>
                  <CardDescription>
                    Manage your uploaded content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingContent ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-48 animate-pulse"></div>
                      ))}
                    </div>
                  ) : userContent.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userContent.map(content => (
                        <ContentCard 
                          key={content.id} 
                          content={content} 
                          creator={user}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-4">
                        <Settings className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium">No Content Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
                        You haven't uploaded any content yet
                      </p>
                      <Button>Upload New Content</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Privacy Settings</h3>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Profile Visibility</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Control who can see your profile</p>
                      </div>
                      <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2">
                        <option>Public</option>
                        <option>Followers Only</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Message Settings</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Control who can message you</p>
                      </div>
                      <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2">
                        <option>Everyone</option>
                        <option>Followers Only</option>
                        <option>Nobody</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Subscription Status</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="font-medium">
                        {user.isPremium ? "Premium Account" : "Free Account"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {user.isPremium 
                          ? "You have access to all premium content" 
                          : "Upgrade to access premium content"}
                      </p>
                      {!user.isPremium && (
                        <Button variant="outline" size="sm">
                          Upgrade to Premium
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Danger Zone</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                      <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-2">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
