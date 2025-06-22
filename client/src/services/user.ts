import { User, BaseEntity } from "@/types";

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

async function callApi<T = any>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T> & { status: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'An API error occurred');
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return { ...data, status: response.status };
  } catch (error: any) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
}

export interface CreateUserInput {
  email: string;
  firebaseUid: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'super_admin';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UpdateUserInput extends Partial<Omit<CreateUserInput, 'email' | 'firebaseUid'>> {
  id?: string; // Make id optional since it's passed as a separate parameter
}

export const userService = {
  /**
   * Get user by Firebase UID
   */
  getUserByFirebaseUid: async (uid: string): Promise<User> => {
    const response = await callApi<{ user: User }>(`/users/firebase/${uid}`);
    if (!response.data?.user) {
      throw new Error('User not found');
    }
    return response.data.user;
  },

  /**
   * Create a new user
   */
  createUser: async (userData: CreateUserInput): Promise<User> => {
    const response = await callApi<{ user: User }>('/users', { 
      method: 'POST', 
      body: JSON.stringify(userData) 
    });
    
    if (!response.data?.user) {
      throw new Error('Failed to create user');
    }
    
    return response.data.user;
  },

  /**
   * Update an existing user
   */
  updateUser: async (id: string, userData: Omit<UpdateUserInput, 'id'>): Promise<User> => {
    const response = await callApi<{ user: User }>(`/users/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({
        ...userData,
        id // Ensure id is included in the request body if needed by the API
      }) 
    });
    
    if (!response.data?.user) {
      throw new Error('Failed to update user');
    }
    
    return response.data.user;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await callApi<{ user: User }>('/users/me');
      return response.data?.user || null;
    } catch (error: any) {
      if (error.status === 401) {
        return null; // Not authenticated
      }
      throw error;
    }
  },
};