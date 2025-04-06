import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertContentSchema, insertMessageSchema, insertBookmarkSchema, insertFollowerSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Create Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Content routes
  app.get("/api/content", async (req, res) => {
    const content = await storage.getAllContent();
    res.json(content);
  });

  app.get("/api/content/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }

    const content = await storage.getContentById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // Increment view count
    await storage.incrementContentViews(id);
    res.json(content);
  });

  app.post("/api/content", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent({
        ...contentData,
        creatorId: req.user.id
      });
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // User content
  app.get("/api/users/:id/content", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const content = await storage.getContentByCreatorId(id);
    res.json(content);
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await storage.getUserMessages(req.user.id);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await storage.markMessageAsRead(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.json(message);
  });

  // Bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookmarks = await storage.getUserBookmarks(req.user.id);
    res.json(bookmarks);
  });

  app.post("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const bookmarkData = insertBookmarkSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const bookmark = await storage.createBookmark(bookmarkData);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:contentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const contentId = parseInt(req.params.contentId);
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }

    const success = await storage.deleteBookmark(req.user.id, contentId);
    if (!success) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.status(204).end();
  });

  // Followers
  app.get("/api/users/:id/followers", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const followers = await storage.getUserFollowers(id);
    res.json(followers);
  });

  app.get("/api/users/:id/following", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const following = await storage.getUserFollowing(id);
    res.json(following);
  });

  app.post("/api/follow", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const followerData = insertFollowerSchema.parse({
        followerId: req.user.id,
        followedId: req.body.followedId
      });
      
      // Check if already following
      const following = await storage.getUserFollowing(req.user.id);
      const alreadyFollowing = following.some(user => user.id === followerData.followedId);
      
      if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      const follower = await storage.createFollower(followerData);
      res.status(201).json(follower);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid follow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/follow/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const followedId = parseInt(req.params.id);
    if (isNaN(followedId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const success = await storage.deleteFollower(req.user.id, followedId);
    if (!success) {
      return res.status(404).json({ message: "Not following this user" });
    }
    res.status(204).end();
  });

  // Update user profile
  app.put("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updates = {
        displayName: req.body.displayName,
        bio: req.body.bio,
        avatarUrl: req.body.avatarUrl
      };
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose the password hash
      const { password, ...userToReturn } = updatedUser;
      
      res.json(userToReturn);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Create a payment intent for subscription
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Create a payment intent for $9.99 subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 999, // $9.99 in cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString(),
          subscriptionType: "premium"
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Confirm subscription after payment success
  app.post("/api/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      // Verify payment intent was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Verify this is for the correct user
      if (paymentIntent.metadata.userId !== req.user.id.toString()) {
        return res.status(403).json({ message: "Payment intent does not match user" });
      }

      // Mark user as premium
      const updatedUser = await storage.updateUser(req.user.id, { 
        isPremium: true,
        stripeCustomerId: paymentIntent.customer as string || null
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose the password hash
      const { password, ...userToReturn } = updatedUser;
      
      res.json(userToReturn);
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to process subscription: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}