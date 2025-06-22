import {
  type IStorage,
  type IFileStorage,
  type User,
  type Product,
  type Order,
  type CartItem,
  type InsertUser,
  type InsertProduct,
  type InsertOrder,
  type InsertCartItem,
} from '@shared/schema';

// In-memory storage implementation
class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private nextId = 1;

  constructor() {
    this.addSampleData();
  }

  private generateId(): string {
    return (this.nextId++).toString();
  }

  private addSampleData() {
    const sampleProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Cotton T-Shirt',
        description: 'Soft, comfortable cotton t-shirt perfect for everyday wear',
        price: '29.99',
        category: 'Clothing',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 79.99,
        category: 'Electronics',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Eco-Friendly Water Bottle',
        description: 'Sustainable stainless steel water bottle',
        price: '24.99',
        category: 'Lifestyle',
        stock: 100,
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Leather Wallet',
        description: 'Handcrafted genuine leather wallet with RFID protection',
        price: '45.99',
        category: 'Accessories',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.firebaseUid === firebaseUid) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.generateId();
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(filters?: {
    search?: string;
    category?: string;
    sortBy?: string;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'name':
          products.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return products;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.featured);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ search: query });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.generateId();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date().toISOString()
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.generateId();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated: Order = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Cart methods
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const id = this.generateId();
    const newCartItem: CartItem = {
      ...cartItem,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const existing = this.cartItems.get(id);
    if (!existing) return undefined;
    
    const updated: CartItem = {
      ...existing,
      quantity,
      updatedAt: new Date().toISOString()
    };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<boolean> {
    const userItems = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.userId === userId);
    
    userItems.forEach(([id]) => this.cartItems.delete(id));
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
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    
    return {
      totalSales,
      totalOrders: orders.length,
      totalProducts: this.products.size,
      totalUsers: this.users.size
    };
  }
}

// File storage implementation
class MemoryFileStorage implements IFileStorage {
  private files: Map<string, string> = new Map();

  async uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string> {
    // Convert buffer to base64 for storage
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;
    this.files.set(destination, dataUrl);
    
    // Return a mock URL
    return `http://localhost:5000/api/files/${encodeURIComponent(destination)}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    this.files.delete(filePath);
  }

  getFile(filePath: string): string | undefined {
    return this.files.get(filePath);
  }
}

export const memoryStorage = new MemoryStorage();
export const memoryFileStorage = new MemoryFileStorage();