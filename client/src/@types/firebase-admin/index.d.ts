declare module 'firebase-admin/app' {
  import { App as FirebaseApp } from 'firebase-admin/app';
  
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
  export function initializeApp(options: {
    credential: any;
    databaseURL?: string;
  }, name?: string): FirebaseApp;
  
  export function cert(serviceAccountPathOrObject: string | object): any;
  
  export interface App {
    name: string;
    options: {
      credential: any;
      databaseURL?: string;
    };
  }
}

declare module 'firebase-admin/firestore' {
  import { Firestore as FirebaseFirestore } from 'firebase-admin/firestore';
  
  export function getFirestore(app?: any): FirebaseFirestore;
  
  export interface Firestore {
    collection(collectionPath: string): CollectionReference;
    doc(documentPath: string): DocumentReference;
    settings(settings: { ignoreUndefinedProperties: boolean }): void;
    // Add other Firestore methods as needed
  }
  
  export interface CollectionReference {
    doc(documentPath?: string): DocumentReference;
    get(): Promise<QuerySnapshot>;
    // Add other CollectionReference methods as needed
  }
  
  export interface DocumentReference {
    get(): Promise<DocumentSnapshot>;
    set(data: any, options?: { merge?: boolean }): Promise<void>;
    // Add other DocumentReference methods as needed
  }
  
  export interface DocumentSnapshot {
    exists: boolean;
    data(): any;
    // Add other DocumentSnapshot methods as needed
  }
  
  export interface QuerySnapshot {
    docs: QueryDocumentSnapshot[];
    // Add other QuerySnapshot methods as needed
  }
  
  export interface QueryDocumentSnapshot extends DocumentSnapshot {
    id: string;
    // Add other QueryDocumentSnapshot methods as needed
  }
}

declare module 'firebase-admin/auth' {
  import { Auth as FirebaseAuth } from 'firebase-admin/auth';
  
  export function getAuth(app?: any): FirebaseAuth;
  
  export interface Auth {
    verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
    getUser(uid: string): Promise<UserRecord>;
    // Add other Auth methods as needed
  }
  
  export interface DecodedIdToken {
    uid: string;
    email?: string;
    [key: string]: any;
  }
  
  export interface UserRecord {
    uid: string;
    email?: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    metadata: {
      creationTime?: string;
      lastSignInTime?: string;
    };
    customClaims?: {
      [key: string]: any;
    };
    // Add other UserRecord properties as needed
  }
}

declare module 'firebase-admin' {
  export * from 'firebase-admin/app';
  export * from 'firebase-admin/firestore';
  export * from 'firebase-admin/auth';
}
