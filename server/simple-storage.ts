import { Readable } from 'stream';
import { storage, db } from './lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '@shared/schema';

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || '';
const BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o`;

export interface IFileStorage {
  saveFile(
    filename: string,
    data: Buffer | Readable,
    mimeType: string
  ): Promise<{ url: string }>;
  
  getSignedUrl(filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getPublicUrl(filename: string): string;
  /**
   * Retrieve previously uploaded file. For now we simply return the public URL for the object.
   */
  getFile(filename: string): string | undefined;
  getSignedUrlForUpload(filename: string, contentType: string): Promise<{ signedUrl: string; filePath: string }>;
}

// Firebase Storage implementation
class FirebaseFileStorage implements IFileStorage, IStorage {
  // IStorage implementation
  async getUser(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async getUserByUsername(username: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async getUserByFirebaseUid(uid: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async createUser(userData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async updateUser(id: string, userData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async deleteUser(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async getProducts(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  
  async getProductById(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async createProduct(productData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async updateProduct(id: string, productData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async deleteProduct(id: string): Promise<boolean> {
    // In a real implementation, this would delete the product from Firestore
    // For now, just return true to indicate success
    return true;
  }
  
  // Additional IStorage methods
  async getAllProducts(): Promise<any[]> {
    return [];
  }
  
  async getOrdersByUser(userId: string): Promise<any[]> {
    return [];
  }
  
  async getAllOrders(): Promise<any[]> {
    return [];
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    // In a real implementation, this would update the order status in Firestore
    // For now, return a mock order object
    return {
      id: orderId,
      createdAt: new Date(),
      status,
      userId: '',
      items: [],
      total: '0',
      shippingAddress: {}
    };
  }
  
  async getOrderByPaymentId(paymentId: string): Promise<any> {
    return null;
  }
  
  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentId?: string): Promise<boolean> {
    return true;
  }
  
  async getProductsByIds(ids: string[]): Promise<any[]> {
    return [];
  }
  
  async updateProductStock(productId: string, quantity: number): Promise<boolean> {
    return true;
  }
  
  // Cart methods
  async addToCart(cartItem: { id: string; userId: string; productId: string; createdAt?: Date | null; quantity?: number }): Promise<{ id: string; createdAt: Date | null; userId: string; productId: string; quantity: number }> {
    return {
      id: cartItem.id,
      userId: cartItem.userId,
      productId: cartItem.productId,
      quantity: cartItem.quantity || 1,
      createdAt: cartItem.createdAt || new Date()
    };
  }
  
  async getCartItems(userId: string): Promise<{ id: string; createdAt: Date | null; userId: string; productId: string; quantity: number }[]> {
    return [];
  }
  
  async updateCartItem(id: string, quantity: number): Promise<{ id: string; createdAt: Date | null; userId: string; productId: string; quantity: number } | undefined> {
    // In a real implementation, this would update the cart item in Firestore
    // For now, return a mock cart item
    return {
      id,
      userId: '',
      productId: '',
      quantity,
      createdAt: new Date()
    };
  }
  
  async removeFromCart(id: string): Promise<boolean> {
    // In a real implementation, this would remove the cart item from Firestore
    return true;
  }
  
  async clearCart(userId: string): Promise<boolean> {
    // In a real implementation, this would remove all cart items for the user from Firestore
    return true;
  }
  
  async getOrders(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  
  async getOrderById(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async createOrder(orderData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async updateOrder(id: string, orderData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async getAdminStats(): Promise<any> {
    // Return mock stats for now
    return {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: []
    };
  }

  // Additional IStorage methods
  async getAllUsers(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getProduct(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getFeaturedProducts(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async searchProducts(query: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getProductsByCategory(categoryId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getCategories(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getCategory(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createCategory(categoryData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async updateCategory(id: string, categoryData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async deleteCategory(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // IFileStorage implementation
  private sanitizeFilename(filename: string): string {
    // Replace any character that's not alphanumeric, ., -, or _ with _
    return filename.replace(/[^\w\-.]/g, '_');
  }

  private getFileRef(filename: string) {
    const sanitized = this.sanitizeFilename(filename);
    return storage.file(sanitized);
  }

  async saveFile(
    filename: string,
    data: Buffer | Readable,
    mimeType: string
  ): Promise<{ url: string }> {
    const file = this.getFileRef(filename);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
      public: true,
    });

    return new Promise((resolve, reject) => {
      if (Buffer.isBuffer(data)) {
        writeStream.end(data, () => {
          resolve({ url: this.getPublicUrl(filename) });
        });
      } else {
        data.pipe(writeStream)
          .on('error', reject)
          .on('finish', () => {
            resolve({ url: this.getPublicUrl(filename) });
          });
      }

      writeStream.on('error', reject);
    });
  }

  async getSignedUrl(filename: string): Promise<string> {
    const file = this.getFileRef(filename);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
  }

  async deleteFile(filename: string): Promise<void> {
    const file = this.getFileRef(filename);
    await file.delete();
  }

  getPublicUrl(filename: string): string {
    const encodedFilename = encodeURIComponent(this.sanitizeFilename(filename));
    return `${BASE_URL}/${encodedFilename}?alt=media`;
  }

  /**
   * Lightweight retrieval helper used by the /api/files/:filename route. We simply
   * construct the public URL – callers can redirect to it or fetch the data.
   */
  getFile(filename: string): string | undefined {
    try {
      return this.getPublicUrl(filename);
    } catch {
      return undefined;
    }
  }

  async getSignedUrlForUpload(filename: string, contentType: string): Promise<{ signedUrl: string; filePath: string }> {
    const file = this.getFileRef(filename);
    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });
    
    return {
      signedUrl,
      filePath: filename
    };
  }
  
  async uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string> {
    const file = this.getFileRef(destination);
    await file.save(buffer, {
      metadata: {
        contentType: contentType || 'application/octet-stream',
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });
    
    await file.makePublic();
    return this.getPublicUrl(destination);
  }
}

// Export a singleton instance
export const simpleFileStorage = new FirebaseFileStorage();

// For backward compatibility
export const simpleStorage = simpleFileStorage;
