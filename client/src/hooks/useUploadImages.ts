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
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }

      const uniqueName = `${Date.now()}-${file.name.replace(/[^\w.]+/g, '-')}`;
      const storageRef = ref(storage, `product-images/${uniqueName}`);
      
      console.log(`Uploading ${file.name} to ${storageRef.fullPath}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type,
        });
        console.log('Upload successful:', snapshot);
        
        const url = await getDownloadURL(storageRef);
        console.log('File available at:', url);
        urls.push(url);
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
