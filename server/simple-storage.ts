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

// Simple in-memory storage implementation
class SimpleStorage implements IStorage {
  private users = new Map<string, any>();
  private products = new Map<string, any>();
  private orders = new Map<string, any>();
  private cartItems = new Map<string, any>();
  private nextId = 1;

  constructor() {
    this.addSampleData();
  }

  private generateId(): string {
    return (this.nextId++).toString();
  }

  private addSampleData() {
    const sampleProducts = [
      {
        id: '1',
        name: 'Premium Cotton T-Shirt',
        description: 'Soft, comfortable cotton t-shirt perfect for everyday wear',
        price: '29.99',
        category: 'Clothing',
        brand: 'EcoWear',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        tags: ['cotton', 'comfortable'],
        stock: 50,
        featured: true,
        active: true,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: '79.99',
        category: 'Electronics',
        brand: 'SoundTech',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        tags: ['wireless', 'bluetooth'],
        stock: 25,
        featured: true,
        active: true,
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'Eco-Friendly Water Bottle',
        description: 'Sustainable stainless steel water bottle',
        price: '24.99',
        category: 'Lifestyle',
        brand: 'EcoLife',
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'],
        tags: ['eco-friendly', 'steel'],
        stock: 100,
        featured: false,
        active: true,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Leather Wallet',
        description: 'Handcrafted genuine leather wallet with RFID protection',
        price: '45.99',
        category: 'Accessories',
        brand: 'LeatherCraft',
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'],
        tags: ['leather', 'rfid'],
        stock: 30,
        featured: true,
        active: true,
        createdAt: new Date()
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
    const newUser = {
      ...user,
      id,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser as User;
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
          products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price_desc':
          products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
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
    const newProduct = {
      ...product,
      id,
      createdAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct as Product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...product
    };
    this.products.set(id, updated);
    return updated as Product;
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
    const newOrder = {
      ...order,
      id,
      createdAt: new Date()
    };
    this.orders.set(id, newOrder);
    return newOrder as Order;
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
    
    const updated = {
      ...existing,
      status
    };
    this.orders.set(id, updated);
    return updated as Order;
  }

  // Cart methods
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const id = this.generateId();
    const newCartItem = {
      ...cartItem,
      id,
      createdAt: new Date()
    };
    this.cartItems.set(id, newCartItem);
    return newCartItem as CartItem;
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const existing = this.cartItems.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      quantity
    };
    this.cartItems.set(id, updated);
    return updated as CartItem;
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
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
    
    return {
      totalSales,
      totalOrders: orders.length,
      totalProducts: this.products.size,
      totalUsers: this.users.size
    };
  }
}

// File storage implementation
class SimpleFileStorage implements IFileStorage {
  private files = new Map<string, string>();

  async uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string> {
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;
    this.files.set(destination, dataUrl);
    
    return `http://localhost:5000/api/files/${encodeURIComponent(destination)}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    this.files.delete(filePath);
  }

  getFile(filePath: string): string | undefined {
    return this.files.get(filePath);
  }
}

export const simpleStorage = new SimpleStorage();
export const simpleFileStorage = new SimpleFileStorage();