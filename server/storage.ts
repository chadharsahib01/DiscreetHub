import { users, content, messages, bookmarks, followers } from "@shared/schema";
import type { User, InsertUser, Content, InsertContent, Message, InsertMessage, Bookmark, InsertBookmark, Follower, InsertFollower } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  
  // Content operations
  getAllContent(): Promise<Content[]>;
  getContentById(id: number): Promise<Content | undefined>;
  getContentByCreatorId(creatorId: number): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  incrementContentViews(id: number): Promise<Content | undefined>;
  
  // Message operations
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Bookmark operations
  getUserBookmarks(userId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, contentId: number): Promise<boolean>;
  
  // Follower operations
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  createFollower(follower: InsertFollower): Promise<Follower>;
  deleteFollower(followerId: number, followedId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private content: Map<number, Content>;
  private messages: Map<number, Message>;
  private bookmarks: Map<number, Bookmark>;
  private followers: Map<number, Follower>;
  private userIdCounter: number;
  private contentIdCounter: number;
  private messageIdCounter: number;
  private bookmarkIdCounter: number;
  private followerIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.messages = new Map();
    this.bookmarks = new Map();
    this.followers = new Map();
    this.userIdCounter = 1;
    this.contentIdCounter = 1;
    this.messageIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.followerIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, isOnline: false, isPremium: false, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: data.stripeCustomerId, 
      stripeSubscriptionId: data.stripeSubscriptionId,
      isPremium: true
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Content operations
  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentById(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getContentByCreatorId(creatorId: number): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.creatorId === creatorId
    );
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.contentIdCounter++;
    const createdAt = new Date();
    const content: Content = { 
      ...insertContent,
      id, 
      views: 0, 
      likes: 0, 
      createdAt 
    };
    this.content.set(id, content);
    return content;
  }

  async incrementContentViews(id: number): Promise<Content | undefined> {
    const content = this.content.get(id);
    if (!content) return undefined;
    
    const updatedContent = { ...content, views: content.views + 1 };
    this.content.set(id, updatedContent);
    return updatedContent;
  }

  // Message operations
  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const createdAt = new Date();
    const message: Message = { ...insertMessage, id, isRead: false, createdAt };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Bookmark operations
  async getUserBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.userId === userId
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;
    const createdAt = new Date();
    const bookmark: Bookmark = { ...insertBookmark, id, createdAt };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: number, contentId: number): Promise<boolean> {
    const bookmarks = Array.from(this.bookmarks.values());
    const bookmark = bookmarks.find(
      (b) => b.userId === userId && b.contentId === contentId
    );
    
    if (!bookmark) return false;
    return this.bookmarks.delete(bookmark.id);
  }

  // Follower operations
  async getUserFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.followers.values())
      .filter((follower) => follower.followedId === userId)
      .map((follower) => follower.followerId);
    
    return Array.from(this.users.values()).filter((user) => 
      followerIds.includes(user.id)
    );
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.followers.values())
      .filter((follower) => follower.followerId === userId)
      .map((follower) => follower.followedId);
    
    return Array.from(this.users.values()).filter((user) => 
      followingIds.includes(user.id)
    );
  }

  async createFollower(insertFollower: InsertFollower): Promise<Follower> {
    const id = this.followerIdCounter++;
    const createdAt = new Date();
    const follower: Follower = { ...insertFollower, id, createdAt };
    this.followers.set(id, follower);
    return follower;
  }

  async deleteFollower(followerId: number, followedId: number): Promise<boolean> {
    const followers = Array.from(this.followers.values());
    const follower = followers.find(
      (f) => f.followerId === followerId && f.followedId === followedId
    );
    
    if (!follower) return false;
    return this.followers.delete(follower.id);
  }
}

export const storage = new MemStorage();
