import sharp from 'sharp';
import axios from 'axios';

class ImageOptimizer {
  constructor() {
    this.maxWidth = 800;
    this.maxHeight = 1200;
    this.quality = 85;
    this.format = 'webp';
  }

  // Download and optimize image from URL
  async optimizeImageFromUrl(imageUrl, options = {}) {
    try {
      const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = this.quality,
        format = this.format
      } = options;

      // Download image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'BookHive/1.0 (Book Cover Optimizer)'
        }
      });

      const imageBuffer = Buffer.from(response.data);

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      
      // Only optimize if image is larger than target size or not in optimal format
      const needsOptimization = 
        metadata.width > maxWidth || 
        metadata.height > maxHeight || 
        metadata.format !== format ||
        (response.headers['content-length'] && parseInt(response.headers['content-length']) > 500000); // > 500KB

      if (!needsOptimization) {
        return {
          optimized: false,
          originalUrl: imageUrl,
          buffer: imageBuffer,
          metadata,
          size: imageBuffer.length
        };
      }

      // Optimize image
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        optimized: true,
        originalUrl: imageUrl,
        buffer: optimizedBuffer,
        metadata: optimizedMetadata,
        size: optimizedBuffer.length,
        originalSize: imageBuffer.length,
        compressionRatio: ((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length * 100).toFixed(2)
      };

    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  // Optimize uploaded image buffer
  async optimizeImageBuffer(buffer, options = {}) {
    try {
      const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = this.quality,
        format = this.format
      } = options;

      const metadata = await sharp(buffer).metadata();

      const optimizedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        optimized: true,
        buffer: optimizedBuffer,
        metadata: optimizedMetadata,
        size: optimizedBuffer.length,
        originalSize: buffer.length,
        compressionRatio: ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2)
      };

    } catch (error) {
      console.error('Buffer optimization error:', error);
      throw new Error(`Failed to optimize image buffer: ${error.message}`);
    }
  }

  // Generate multiple sizes for responsive images
  async generateResponsiveSizes(imageUrl, sizes = [400, 600, 800]) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      const imageBuffer = Buffer.from(response.data);
      const results = {};

      for (const size of sizes) {
        const optimizedBuffer = await sharp(imageBuffer)
          .resize(size, Math.round(size * 1.5), {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: this.quality })
          .toBuffer();

        results[`${size}w`] = {
          buffer: optimizedBuffer,
          size: optimizedBuffer.length,
          width: size
        };
      }

      return results;

    } catch (error) {
      console.error('Responsive sizes generation error:', error);
      throw new Error(`Failed to generate responsive sizes: ${error.message}`);
    }
  }

  // Validate image URL and get metadata
  async validateAndAnalyzeImage(imageUrl) {
    try {
      const response = await axios.head(imageUrl, { timeout: 5000 });
      
      const contentType = response.headers['content-type'];
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      // Try to get actual image dimensions
      let metadata = null;
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'Range': 'bytes=0-2048' // Only download first 2KB to get metadata
          }
        });
        
        const buffer = Buffer.from(imageResponse.data);
        metadata = await sharp(buffer).metadata();
      } catch (metadataError) {
        console.log('Could not extract image metadata:', metadataError.message);
      }

      return {
        valid: response.status === 200,
        contentType,
        size: contentLength,
        isImage: contentType && contentType.startsWith('image/'),
        isHighQuality: contentLength > 50000, // > 50KB
        metadata,
        recommendations: this.getOptimizationRecommendations(contentLength, metadata)
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get optimization recommendations
  getOptimizationRecommendations(fileSize, metadata) {
    const recommendations = [];

    if (fileSize > 1000000) { // > 1MB
      recommendations.push('Image is very large, consider optimization');
    }

    if (metadata) {
      if (metadata.width > 1200 || metadata.height > 1800) {
        recommendations.push('Image resolution is higher than needed for web display');
      }

      if (metadata.format === 'png' && fileSize > 200000) {
        recommendations.push('Consider converting PNG to WebP for better compression');
      }

      if (metadata.format === 'jpeg' && metadata.density && metadata.density > 150) {
        recommendations.push('Image DPI is higher than needed for web display');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Image appears to be well optimized');
    }

    return recommendations;
  }

  // Enhance Google Books cover URL for better quality
  enhanceGoogleBooksUrl(url) {
    if (!url || !url.includes('books.google')) return url;

    let enhancedUrl = url.replace('http:', 'https:');
    
    // Remove size restrictions
    enhancedUrl = enhancedUrl.replace(/&zoom=\d+/, '&zoom=1');
    enhancedUrl = enhancedUrl.replace(/&w=\d+/, '');
    enhancedUrl = enhancedUrl.replace(/&h=\d+/, '');
    
    // Add high quality parameters
    if (!enhancedUrl.includes('fife=')) {
      enhancedUrl += enhancedUrl.includes('?') ? '&' : '?';
      enhancedUrl += 'fife=w800-h1200';
    }

    return enhancedUrl;
  }

  // Enhance Open Library cover URL for better quality
  enhanceOpenLibraryUrl(url) {
    if (!url || !url.includes('covers.openlibrary.org')) return url;

    // Convert to large size if not already
    if (url.includes('-S.jpg')) {
      return url.replace('-S.jpg', '-L.jpg');
    }
    if (url.includes('-M.jpg')) {
      return url.replace('-M.jpg', '-L.jpg');
    }

    return url;
  }

  // Get the best available cover URL from multiple sources
  async getBestCoverUrl(coverOptions) {
    const validatedCovers = [];

    for (const cover of coverOptions) {
      try {
        const validation = await this.validateAndAnalyzeImage(cover.url);
        if (validation.valid && validation.isImage) {
          validatedCovers.push({
            ...cover,
            validation,
            score: this.calculateCoverScore(validation)
          });
        }
      } catch (error) {
        console.log(`Skipping invalid cover: ${cover.url}`);
      }
    }

    // Sort by score (higher is better)
    validatedCovers.sort((a, b) => b.score - a.score);

    return validatedCovers.length > 0 ? validatedCovers[0].url : null;
  }

  // Calculate a quality score for cover images
  calculateCoverScore(validation) {
    let score = 0;

    // Size score (larger is generally better, but not too large)
    if (validation.size > 100000) score += 30; // > 100KB
    if (validation.size > 200000) score += 20; // > 200KB
    if (validation.size > 500000) score += 10; // > 500KB
    if (validation.size > 2000000) score -= 20; // > 2MB (too large)

    // Metadata score
    if (validation.metadata) {
      const { width, height } = validation.metadata;
      
      // Ideal dimensions for book covers
      if (width >= 400 && width <= 800) score += 25;
      if (height >= 600 && height <= 1200) score += 25;
      
      // Aspect ratio (books are typically taller than wide)
      const aspectRatio = height / width;
      if (aspectRatio >= 1.3 && aspectRatio <= 1.6) score += 20;
      
      // Format preference
      if (validation.metadata.format === 'webp') score += 15;
      else if (validation.metadata.format === 'jpeg') score += 10;
      else if (validation.metadata.format === 'png') score += 5;
    }

    return score;
  }
}

export default ImageOptimizer;