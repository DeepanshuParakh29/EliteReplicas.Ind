import { users, products, orders, cartItems, type User, type Product, type Order, type CartItem, type InsertUser, type InsertProduct, type InsertOrder, type InsertCartItem } from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(filters?: { search?: string; category?: string; sortBy?: string }): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Cart methods
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: number): Promise<CartItem[]>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Admin methods
  getAdminStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(filters?: { search?: string; category?: string; sortBy?: string }): Promise<Product[]> {
    const conditions = [eq(products.active, true)];
    
    if (filters?.search) {
      conditions.push(like(products.name, `%${filters.search}%`));
    }
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    let query = db.select().from(products).where(and(...conditions));
    
    if (filters?.sortBy === 'price_asc') {
      query = query.orderBy(products.price);
    } else if (filters?.sortBy === 'price_desc') {
      query = query.orderBy(desc(products.price));
    } else {
      query = query.orderBy(desc(products.createdAt));
    }
    
    return await query;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.featured, true), eq(products.active, true)))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(
        and(
          eq(products.active, true),
          like(products.name, `%${query}%`)
        )
      );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.update(products)
      .set({ active: false })
      .where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Cart methods
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db.insert(cartItems).values(insertCartItem).returning();
    return cartItem;
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [cartItem] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return cartItem || undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount > 0;
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  }> {
    const [salesResult] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    }).from(orders);
    
    const [ordersResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(orders);
    
    const [productsResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(products).where(eq(products.active, true));
    
    const [usersResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(users);

    return {
      totalSales: salesResult.total || 0,
      totalOrders: ordersResult.count || 0,
      totalProducts: productsResult.count || 0,
      totalUsers: usersResult.count || 0,
    };
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private cartItems: Map<number, CartItem>;
  private currentUserId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentCartItemId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.cartItems = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentCartItemId = 1;

    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample luxury products
    const sampleProducts: Product[] = [
      {
        id: this.currentProductId++,
        name: "Luxury Timepiece Collection",
        description: "Exquisite replica of a premium Swiss timepiece featuring precision movement, sapphire crystal glass, and premium materials. Crafted with meticulous attention to detail.",
        price: "299.00",
        category: "watches",
        brand: "Premium Swiss Replica",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["luxury", "timepiece", "swiss", "premium"],
        stock: 15,
        featured: true,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Designer Leather Footwear",
        description: "Handcrafted replica of Italian designer shoes made from premium leather with exceptional comfort and style. Perfect for formal and casual occasions.",
        price: "199.00",
        category: "shoes",
        brand: "Italian Craft Replica",
        images: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["designer", "leather", "shoes", "italian"],
        stock: 25,
        featured: true,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Premium Designer Eyewear",
        description: "High-quality replica of luxury sunglasses featuring UV protection, premium frames, and sophisticated design elements.",
        price: "149.00",
        category: "accessories",
        brand: "Luxury Frame Replica",
        images: [
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["sunglasses", "designer", "luxury", "eyewear"],
        stock: 30,
        featured: true,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Artisan Leather Accessories",
        description: "Premium replica leather belt crafted with exceptional attention to detail, featuring durable materials and elegant design.",
        price: "89.00",
        category: "accessories",
        brand: "Artisan Craft Replica",
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1506629905607-45c0e81e4e5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["leather", "belt", "accessories", "artisan"],
        stock: 40,
        featured: true,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Luxury Designer Handbag",
        description: "Sophisticated replica of a premium designer handbag featuring high-quality materials, elegant stitching, and timeless design.",
        price: "450.00",
        category: "bags",
        brand: "Elite Fashion Replica",
        images: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["handbag", "designer", "luxury", "fashion"],
        stock: 12,
        featured: false,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Elite Sports Chronograph",
        description: "Professional replica sports watch with chronograph functionality, water resistance, and premium build quality.",
        price: "350.00",
        category: "watches",
        brand: "Sports Elite Replica",
        images: [
          "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["sports", "chronograph", "watch", "premium"],
        stock: 18,
        featured: false,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Designer Business Portfolio",
        description: "Professional replica briefcase made from premium leather with sophisticated design for the modern executive.",
        price: "275.00",
        category: "bags",
        brand: "Executive Replica",
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["briefcase", "business", "leather", "professional"],
        stock: 8,
        featured: false,
        active: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Premium Casual Sneakers",
        description: "High-quality replica of luxury casual sneakers with premium materials and exceptional comfort.",
        price: "225.00",
        category: "shoes",
        brand: "Luxury Sport Replica",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
        ],
        tags: ["sneakers", "casual", "premium", "sport"],
        stock: 35,
        featured: false,
        active: true,
        createdAt: new Date(),
      }
    ];

    // Add products to storage
    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "user",
      avatar: insertUser.avatar || null,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(filters?: { search?: string; category?: string; sortBy?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values()).filter(p => p.active);

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.category && filters.category !== 'all') {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
          products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price_high':
          products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'newest':
          products.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
          break;
        default:
          products.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    return products;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.featured && p.active);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchLower = query.toLowerCase();
    return Array.from(this.products.values()).filter(p =>
      p.active && (
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    ).slice(0, 10); // Limit search results
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      id,
      name: insertProduct.name,
      description: insertProduct.description,
      price: insertProduct.price,
      category: insertProduct.category,
      brand: insertProduct.brand,
      images: insertProduct.images || [],
      tags: insertProduct.tags || [],
      stock: insertProduct.stock ?? 0,
      featured: insertProduct.featured ?? false,
      active: insertProduct.active ?? true,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...updateData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder,
      status: insertOrder.status || "pending",
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status;
    this.orders.set(id, order);
    return order;
  }

  // Cart methods
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const cartItem: CartItem = { 
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1,
      id,
      createdAt: new Date(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(c => c.userId === userId);
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;

    cartItem.quantity = quantity;
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.entries()).filter(
      ([_, item]) => item.userId === userId
    );
    
    userCartItems.forEach(([id]) => {
      this.cartItems.delete(id);
    });
    
    return true;
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  }> {
    const orders = Array.from(this.orders.values());
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    return {
      totalSales,
      totalOrders: orders.length,
      totalProducts: this.products.size,
      totalUsers: this.users.size,
    };
  }
}

export const storage = new DatabaseStorage();
