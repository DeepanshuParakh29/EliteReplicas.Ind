import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to a test image (you can change this to point to a real image file)
const testImagePath = path.join(__dirname, 'test-image.jpg');

// Check if test image exists
if (!fs.existsSync(testImagePath)) {
  console.error(`Test image not found at: ${testImagePath}`);
  console.log('Please create a test image file or update the testImagePath.');
  process.exit(1);
}

// Read the test image
const imageBuffer = fs.readFileSync(testImagePath);

// Create form data
const formData = new FormData();
formData.append('image', imageBuffer, {
  filename: 'test-upload.jpg',
  contentType: 'image/jpeg'
});

// Make the request
console.log('Uploading test image...');
fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData,
  headers: formData.getHeaders()
})
.then(async (response) => {
  const data = await response.json();
  console.log('Upload response:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    console.error('Upload failed with status:', response.status);
    process.exit(1);
  }
  
  console.log('✅ Upload successful!');
  console.log('File URL:', data.fileUrl);
})
.catch((error) => {
  console.error('Error during upload:', error);
  process.exit(1);
});
