import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload from buffer (for memory storage)
export const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(buffer);
  });
};

// Upload from file path (for disk storage)
export const uploadFileToCloudinary = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    // Set default options
    const uploadOptions = {
      resource_type: 'auto',
      ...options
    };
    
    cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      }
      
      resolve(result);
    });
  });
};

export default cloudinary;