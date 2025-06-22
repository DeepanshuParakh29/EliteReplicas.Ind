import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../lib/firebase";

/**
 * Upload a list of image files to Firebase Storage under `product-images/`
 * and return their public download URLs.
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  const urls: string[] = [];

  try {
    // Use server-side upload endpoint instead of direct Firebase upload
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', file);

      console.log(`Uploading ${file.name} via API endpoint`);
      
      try {
        // Use the server API endpoint for upload
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const result = await response.json();
        console.log('Upload successful:', result);
        
        if (result.success && result.fileUrl) {
          console.log('File available at:', result.fileUrl);
          urls.push(result.fileUrl);
        } else {
          throw new Error('Upload succeeded but no URL was returned');
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown error during upload';
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    return urls;
  } catch (error) {
    console.error('Error in uploadImages:', error);
    throw error;
  }
}
