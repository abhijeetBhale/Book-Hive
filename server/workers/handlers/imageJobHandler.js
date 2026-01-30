import sharp from 'sharp';
import { uploadToCloudinary } from '../../config/cloudinary.js';
import fs from 'fs/promises';
import path from 'path';

// Optimize image
const optimizeImage = async (data) => {
  const { imagePath, options = {} } = data;
  
  try {
    const {
      quality = 80,
      width = null,
      height = null,
      format = 'jpeg',
    } = options;
    
    // Read the original image
    let pipeline = sharp(imagePath);
    
    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Set format and quality
    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    }
    
    // Generate optimized image
    const optimizedBuffer = await pipeline.toBuffer();
    
    // Save optimized image
    const optimizedPath = imagePath.replace(/\.[^/.]+$/, `_optimized.${format}`);
    await fs.writeFile(optimizedPath, optimizedBuffer);
    
    return {
      success: true,
      originalPath: imagePath,
      optimizedPath,
      originalSize: (await fs.stat(imagePath)).size,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: ((await fs.stat(imagePath)).size - optimizedBuffer.length) / (await fs.stat(imagePath)).size,
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
};

// Generate thumbnails
const generateThumbnails = async (data) => {
  const { imagePath, sizes = [150, 300, 600] } = data;
  
  try {
    const thumbnails = [];
    const originalImage = sharp(imagePath);
    const metadata = await originalImage.metadata();
    
    for (const size of sizes) {
      const thumbnailBuffer = await originalImage
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Save thumbnail
      const thumbnailPath = imagePath.replace(
        /\.[^/.]+$/, 
        `_thumb_${size}.jpg`
      );
      
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
      
      thumbnails.push({
        size,
        path: thumbnailPath,
        dimensions: `${size}x${size}`,
        fileSize: thumbnailBuffer.length,
      });
    }
    
    return {
      success: true,
      originalPath: imagePath,
      originalDimensions: `${metadata.width}x${metadata.height}`,
      thumbnails,
    };
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw new Error(`Failed to generate thumbnails: ${error.message}`);
  }
};

// Upload optimized image to Cloudinary
const uploadOptimizedImage = async (data) => {
  const { imagePath, folder = 'books', publicId = null } = data;
  
  try {
    // First optimize the image
    const optimized = await optimizeImage({
      imagePath,
      options: {
        quality: 85,
        width: 1200, // Max width for book covers
        format: 'jpeg',
      },
    });
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      optimized.optimizedPath,
      folder,
      publicId
    );
    
    // Clean up local files
    try {
      await fs.unlink(imagePath);
      await fs.unlink(optimized.optimizedPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup local files:', cleanupError);
    }
    
    return {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      compressionRatio: optimized.compressionRatio,
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(`Failed to upload optimized image: ${error.message}`);
  }
};

// Batch process multiple images
const batchProcessImages = async (data) => {
  const { imagePaths, options = {} } = data;
  
  try {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await optimizeImage({ imagePath, options });
        results.push({
          path: imagePath,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          path: imagePath,
          success: false,
          error: error.message,
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      success: true,
      processed: imagePaths.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error('Batch image processing failed:', error);
    throw new Error(`Failed to batch process images: ${error.message}`);
  }
};

export default {
  optimizeImage,
  generateThumbnails,
  uploadOptimizedImage,
  batchProcessImages,
};