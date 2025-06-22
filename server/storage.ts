// Firebase Admin Initialization
import { getApps, initializeApp, cert } from 'firebase-admin/app';

import * as adminFirestore from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';
import { getStorage, Storage as FirebaseStorage } from 'firebase-admin/storage';

import {
  type User,
  type Product,
  type Order,
  type CartItem,
  type InsertUser,
  type InsertProduct,
  type InsertOrder,
  type InsertCartItem,
} from '@shared/schema';

const serviceAccount = require('../../me.json');
// Destructure commonly used members from the firestore namespace
const { getFirestore } = adminFirestore;
const { FieldValue, Timestamp } = admin.firestore;

if (getApps().length === 0) {
  const appOptions: admin.AppOptions & { storageBucket: string } = {
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  };
  initializeApp(appOptions);
}

const db = getFirestore();
const storage = getStorage();

/* FirestoreService handles Firestore-related operations */
class FirestoreService {
  constructor(private db: adminFirestore.Firestore) {}

  // User Methods
  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.db.collection('users').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as User : undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const snap = await this.db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(data: InsertUser): Promise<User> {
    const ref = await this.db.collection('users').add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as User;
  }

  // Product Methods
  async createProduct(data: InsertProduct): Promise<Product> {
    const ref = await this.db.collection('products').add({
      ...data,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as Product;
  }

  async getAllProducts(): Promise<Product[]> {
    const snap = await this.db.collection('products').where('active', '==', true).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.db.collection('products').doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Cart Methods
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const ref = this.db.collection('cartItems');
    const snap = await ref
      .where('userId', '==', item.userId)
      .where('productId', '==', item.productId)
      .limit(1)
      .get();

    if (!snap.empty) {
      const existing = snap.docs[0];
      const data = existing.data() as CartItem;
      await existing.ref.update({
        quantity: (data.quantity || 0) + (item.quantity || 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const updated = await existing.ref.get();
      return { id: updated.id, ...updated.data() } as CartItem;
    }

    const docRef = await ref.add({
      ...item,
      quantity: item.quantity || 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as CartItem;
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    const snap = await this.db.collection('cartItems').where('userId', '==', userId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
  }

  async clearCart(userId: string): Promise<boolean> {
    const snap = await this.db.collection('cartItems').where('userId', '==', userId).get();
    const batch = this.db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return true;
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const ref = await this.db.collection('orders').add({
      ...order,
      status: order.status || 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as Order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const snap = await this.db.collection('orders').where('userId', '==', userId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  }
}

/* FirebaseFileService handles file storage */
class FirebaseFileService {
  constructor(private storage: FirebaseStorage, private bucketName: string) {}

  async uploadBuffer(destination: string, buffer: Buffer, contentType: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(destination);
    await file.save(buffer, { contentType });
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const file = this.storage.bucket(this.bucketName).file(filePath);
    await file.delete();
  }
}

/* StorageService combines Firestore + File logic */
class StorageService {
  private firestoreService: FirestoreService;
  private fileService: FirebaseFileService;

  constructor(firestore: adminFirestore.Firestore, storage: FirebaseStorage, bucketName: string) {
    this.firestoreService = new FirestoreService(firestore);
    this.fileService = new FirebaseFileService(storage, bucketName);
  }

  // Firestore Delegates
  getUser(id: string) {
    return this.firestoreService.getUser(id);
  }

  getUserByFirebaseUid(uid: string) {
    return this.firestoreService.getUserByFirebaseUid(uid);
  }

  createUser(user: InsertUser) {
    return this.firestoreService.createUser(user);
  }

  createProduct(product: InsertProduct) {
    return this.firestoreService.createProduct(product);
  }

  getAllProducts() {
    return this.firestoreService.getAllProducts();
  }

  deleteProduct(id: string) {
    return this.firestoreService.deleteProduct(id);
  }

  addToCart(item: InsertCartItem) {
    return this.firestoreService.addToCart(item);
  }

  getCartItems(userId: string) {
    return this.firestoreService.getCartItems(userId);
  }

  clearCart(userId: string) {
    return this.firestoreService.clearCart(userId);
  }

  createOrder(order: InsertOrder) {
    return this.firestoreService.createOrder(order);
  }

  getOrdersByUser(userId: string) {
    return this.firestoreService.getOrdersByUser(userId);
  }

  // File Delegates
  uploadBuffer(destination: string, buffer: Buffer, contentType: string) {
    return this.fileService.uploadBuffer(destination, buffer, contentType);
  }

  deleteFile(path: string) {
    return this.fileService.deleteFile(path);
  }
}

// Exported instance
const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET!;
export const storageService = new StorageService(db, storage, bucketName);
// Back-compat re-exports for existing code that still imports these names
export { FirestoreService as FirestoreStorage, FirebaseFileService as FirebaseFileStorage };
