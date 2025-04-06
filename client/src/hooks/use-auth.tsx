import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  updateProfileMutation: UseMutationResult<SelectUser, Error, UpdateProfileData>;
  subscribeMutation: UseMutationResult<SelectUser, Error, SubscribeData>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

type UpdateProfileData = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
};

type SubscribeData = {
  paymentIntentId: string;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as any,
  logoutMutation: {} as any,
  registerMutation: {} as any,
  updateProfileMutation: {} as any,
  subscribeMutation: {} as any,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<SelectUser | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          // Not authenticated is not an error
          setUser(null);
        } else {
          throw new Error('Failed to fetch user');
        }
      } catch (e) {
        console.error("Error fetching user:", e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.displayName || userData.username}!`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Login failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome to DiscreetHub, ${userData.displayName || userData.username}!`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Registration failed",
        description: err.message || "Username may already be taken",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Logout failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiRequest("PUT", "/api/user", data);
      return await res.json();
    },
    onSuccess: (updatedUser: SelectUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Profile update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: SubscribeData) => {
      const res = await apiRequest("POST", "/api/subscribe", data);
      return await res.json();
    },
    onSuccess: (updatedUser: SelectUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Subscription successful",
        description: "You now have access to premium content!",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Subscription failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        subscribeMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
