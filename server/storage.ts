import { 
  type User, 
  type Product, 
  type Order, 
  type CartItem, 
  type InsertUser, 
  type InsertProduct, 
  type InsertOrder, 
  type InsertCartItem 
} from "@shared/schema";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(filters?: {
    search?: string;
    category?: string;
    sortBy?: string;
  }): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(insertProduct: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;

  // Order methods
  createOrder(insertOrder: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Cart methods
  addToCart(insertCartItem: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: string): Promise<CartItem[]>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Admin methods
  getAdminStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  }>;
}

export interface IFileStorage {
  getSignedUrlForUpload(destination: string, contentType: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string>;
}


import { Bucket } from '@google-cloud/storage';

export class FirebaseFileStorage implements IFileStorage {
  private bucket: Bucket;

  constructor(storage: admin.storage.Storage, bucketName: string) {
    this.bucket = storage.bucket(bucketName);
  }

  async getSignedUrlForUpload(destination: string, contentType: string): Promise<string> {
    const file = this.bucket.file(destination);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });
    return url;
  }

  async deleteFile(filePath: string): Promise<void> {
    const file = this.bucket.file(filePath);
    await file.delete();
  }

  async uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string> {
    const file = this.bucket.file(destination);
    await file.save(buffer, { contentType });
    // Make the file publicly readable (optional: adjust based on bucket policy)
    await file.makePublic().catch(() => {/* ignore if already public or policy forbids */});
    return `https://storage.googleapis.com/${this.bucket.name}/${destination}`;
  }
}

export class FirestoreStorage implements IStorage {
  private db: admin.firestore.Firestore;

  constructor(firestore: admin.firestore.Firestore, storage: admin.storage.Storage, bucketName: string) {
    this.db = firestore;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const doc = await this.db.collection("users").doc(id).get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as User) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const snapshot = await this.db
        .collection("users")
        .where("email", "==", username)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return undefined;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const snapshot = await this.db
        .collection("users")
        .where("firebaseUid", "==", firebaseUid)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return undefined;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userData = {
        ...insertUser,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection("users").add(userData);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await this.db.collection("users").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const doc = await this.db.collection("products").doc(id).get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as Product) : undefined;
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async getProducts(filters?: {
    search?: string;
    category?: string;
    sortBy?: string;
  }): Promise<Product[]> {
    try {
      let query: admin.firestore.Query = this.db.collection("products").where("active", "==", true);

      if (filters?.category && filters.category !== 'all') {
        query = query.where("category", "==", filters.category);
      }

      if (filters?.sortBy) {
        const [field, direction] = filters.sortBy.split("_");
        if (field && (direction === "asc" || direction === "desc")) {
          query = query.orderBy(field, direction);
        }
      } else {
        query = query.orderBy("createdAt", "desc");
      }

      const snapshot = await query.get();
      let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));

      // Handle search filtering client-side since Firestore has limited text search
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.brand?.toLowerCase().includes(searchLower) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const snapshot = await this.db
        .collection("products")
        .where("featured", "==", true)
        .where("active", "==", true)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error getting featured products:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      // For better search, you might want to implement Algolia or use Firestore's limited text search
      const snapshot = await this.db
        .collection("products")
        .where("active", "==", true)
        .orderBy("name")
        .startAt(query)
        .endAt(query + '\uf8ff')
        .limit(10)
        .get();
      return snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    try {
      console.log('Received product for creation in FirestoreStorage:', insertProduct);
      const productData = {
        ...insertProduct,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection("products").add(productData);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as Product;
    } catch (error) {
      console.error('Error creating product in FirestoreStorage:', error);
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const docRef = this.db.collection("products").doc(id);
      const updateData = {
        ...product,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await docRef.update(updateData);
      const doc = await docRef.get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as Product) : undefined;
    } catch (error) {
      console.error('Error updating product:', error);
      return undefined;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.db.collection("products").doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const snapshot = await this.db.collection("products").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      const orderData = {
        ...insertOrder,
        status: insertOrder.status || "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection("orders").add(orderData);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    try {
      const snapshot = await this.db
        .collection("orders")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error getting orders by user:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const snapshot = await this.db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    try {
      const docRef = this.db.collection("orders").doc(id);
      await docRef.update({ 
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await docRef.get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as Order) : undefined;
    } catch (error) {
      console.error('Error updating order status:', error);
      return undefined;
    }
  }

  // Cart methods
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    try {
      // Check if item already exists in cart
      const existingSnapshot = await this.db
        .collection("cartItems")
        .where("userId", "==", insertCartItem.userId)
        .where("productId", "==", insertCartItem.productId)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        // Update existing item quantity
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data() as CartItem;
        const newQuantity = (existingData.quantity || 0) + (insertCartItem.quantity || 1);
        
        await existingDoc.ref.update({ 
          quantity: newQuantity,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const updatedDoc = await existingDoc.ref.get();
        return { id: updatedDoc.id, ...updatedDoc.data() } as CartItem;
      } else {
        // Create new cart item
        const cartItemData = {
          ...insertCartItem,
          quantity: insertCartItem.quantity || 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await this.db.collection("cartItems").add(cartItemData);
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() } as CartItem;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const snapshot = await this.db
        .collection("cartItems")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CartItem));
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    try {
      const docRef = this.db.collection("cartItems").doc(id);
      await docRef.update({ 
        quantity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await docRef.get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as CartItem) : undefined;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return undefined;
    }
  }

  async removeFromCart(id: string): Promise<boolean> {
    try {
      await this.db.collection("cartItems").doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      const snapshot = await this.db
        .collection("cartItems")
        .where("userId", "==", userId)
        .get();
      
      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  }> {
    try {
      const [ordersSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
        this.db.collection("orders").get(),
        this.db.collection("products").where("active", "==", true).get(),
        this.db.collection("users").get(),
      ]);

      const totalSales = ordersSnapshot.docs.reduce((sum: number, doc: admin.firestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return sum + (parseFloat(data.total) || 0);
      }, 0);

      return {
        totalSales,
        totalOrders: ordersSnapshot.size,
        totalProducts: productsSnapshot.size,
        totalUsers: usersSnapshot.size,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
      };
    }
  }
}

// Combined Storage class that delegates to appropriate implementations
class Storage {
  private firestoreStorage: FirestoreStorage;
  private fileStorage: FirebaseFileStorage;

  constructor(firestore: admin.firestore.Firestore, storage: admin.storage.Storage, bucketName: string) {
    this.firestoreStorage = new FirestoreStorage(firestore, storage, bucketName);
    this.fileStorage = new FirebaseFileStorage(storage, bucketName);
  }

  // Delegate database operations to FirestoreStorage
  getUser(id: string) {
    return this.firestoreStorage.getUser(id);
  }

  getUserByUsername(username: string) {
    return this.firestoreStorage.getUserByUsername(username);
  }

  getUserByFirebaseUid(firebaseUid: string) {
    return this.firestoreStorage.getUserByFirebaseUid(firebaseUid);
  }

  createUser(insertUser: InsertUser) {
    return this.firestoreStorage.createUser(insertUser);
  }

  getAllUsers() {
    return this.firestoreStorage.getAllUsers();
  }

  getProduct(id: string) {
    return this.firestoreStorage.getProduct(id);
  }

  getProducts(filters?: {
    search?: string;
    category?: string;
    sortBy?: string;
  }) {
    return this.firestoreStorage.getProducts(filters);
  }

  getFeaturedProducts() {
    return this.firestoreStorage.getFeaturedProducts();
  }

  searchProducts(query: string) {
    return this.firestoreStorage.searchProducts(query);
  }

  createProduct(insertProduct: InsertProduct) {
    return this.firestoreStorage.createProduct(insertProduct);
  }

  updateProduct(id: string, product: Partial<InsertProduct>) {
    return this.firestoreStorage.updateProduct(id, product);
  }

  deleteProduct(id: string) {
    return this.firestoreStorage.deleteProduct(id);
  }

  getAllProducts() {
    return this.firestoreStorage.getAllProducts();
  }

  createOrder(insertOrder: InsertOrder) {
    return this.firestoreStorage.createOrder(insertOrder);
  }

  getOrdersByUser(userId: string) {
    return this.firestoreStorage.getOrdersByUser(userId);
  }

  getAllOrders() {
    return this.firestoreStorage.getAllOrders();
  }

  updateOrderStatus(id: string, status: string) {
    return this.firestoreStorage.updateOrderStatus(id, status);
  }

  addToCart(insertCartItem: InsertCartItem) {
    return this.firestoreStorage.addToCart(insertCartItem);
  }

  getCartItems(userId: string) {
    return this.firestoreStorage.getCartItems(userId);
  }

  updateCartItem(id: string, quantity: number) {
    return this.firestoreStorage.updateCartItem(id, quantity);
  }

  removeFromCart(id: string) {
    return this.firestoreStorage.removeFromCart(id);
  }

  clearCart(userId: string) {
    return this.firestoreStorage.clearCart(userId);
  }

  getAdminStats() {
    return this.firestoreStorage.getAdminStats();
  }

  // Delegate file operations to FirebaseFileStorage


  deleteFile(filePath: string) {
    return this.fileStorage.deleteFile(filePath);
  }

  uploadBuffer(destination: string, buffer: Buffer, contentType: string) {
    return this.fileStorage.uploadBuffer(destination, buffer, contentType);
  }
}

// You'll need to initialize this with your Firebase instances
// Example:
// export const storage = new Storage(admin.firestore(), admin.storage());

export { Storage };