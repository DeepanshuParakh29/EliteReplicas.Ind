import { v4 as uuidv4 } from 'uuid';

// Define a minimal user type that only requires the methods we need
interface MinimalUser {
  getIdToken(forceRefresh?: boolean): Promise<string>;
  uid: string;
}

// Type guard to check if an object has getIdToken method
function hasGetIdToken(user: any): user is { getIdToken: () => Promise<string> } {
  return user && typeof user.getIdToken === 'function';
}

// For backward compatibility
type UserType = MinimalUser;

interface UploadResponse {
  success: boolean;
  url: string;
  error?: string;
}

interface UploadImagesOptions {
  user?: UserType | null;
}

/**
 * Custom hook to handle image uploads via the server-side API
 */
export function useUploadImages({ user }: UploadImagesOptions = {}) {
  /**
   * Upload a list of image files using the server-side API
   * and return their public download URLs.
   */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    const currentUser = user || (window as any).auth?.currentUser;
    
    if (!currentUser || !hasGetIdToken(currentUser)) {
      throw new Error('You must be logged in to upload images');
    }
    
    // Get the ID token for authentication
    const idToken = await currentUser.getIdToken();
    
    if (!idToken) {
      throw new Error('Failed to get authentication token');
    }
    
    const uploadPromises = files
      .filter(file => file.type.startsWith('image/'))
      .map(async (file, index) => {
        try {
          const formData = new FormData();
          formData.append('image', file, file.name);
          
          const response = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
            body: formData,
          });
          
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
          }
          
          const data = await response.json();
          if (!data || !data.url) {
            throw new Error('No URL returned from server');
          }
          return data.url as string;
        } catch (error) {
          console.error(`Error uploading image ${index + 1}:`, error);
          throw new Error(`Image ${index + 1}: ${error instanceof Error ? error.message : 'Upload failed'}`);
        }
      });
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result, index) => `Image ${index + 1}: ${result.reason?.message || 'Unknown error'}`);
      
      if (errors.length > 0) {
        throw new Error(`Failed to upload some images: ${errors.join('; ')}`);
      }
      
      // Filter out any undefined values and return the successful uploads
      return results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled' && !!result.value)
        .map(result => result.value);
    } catch (error) {
      console.error('Error in uploadImages:', error);
      throw error;
    }
  };

  return { uploadImages };
}

/**
 * Upload images using the server-side API
 * @deprecated Use the useUploadImages hook instead
 */
export const uploadImages = async (files: File[], user: MinimalUser): Promise<string[]> => {
  // Use the direct upload function instead of the hook
  return uploadImagesDirectly(files, user);
}

/**
 * Utility function to upload images without using the hook
 * Use this outside of React components
 * @deprecated Use useUploadImages hook instead
 */
export async function uploadImagesDirectly(files: File[], user: MinimalUser): Promise<string[]> {
  if (!files.length) return [];

  const imageFiles = files.filter(file => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    console.warn('No valid image files found');
    return [];
  }

  const idToken = await user.getIdToken();

  const uploadPromises = imageFiles.map(async (file) => {
    const formData = new FormData();
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    formData.append('file', file, uniqueFilename);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Upload failed:', error);
        throw new Error(error.message || 'Failed to upload image');
      }

      const result: UploadResponse = await response.json();

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to get image URL');
      }

      return result.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}
