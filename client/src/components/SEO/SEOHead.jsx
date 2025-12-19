import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  author,
  publishedTime,
  modifiedTime 
}) => {
  const location = useLocation();
  
  // Default values
  const defaultTitle = 'BookHive - Share Books, Build Community';
  const defaultDescription = 'Join thousands of book lovers on BookHive. Share your library, discover new reads, and connect with fellow readers in your community.';
  const defaultImage = 'https://bookhive.vercel.app/og-image.png';
  const baseUrl = 'https://bookhive.vercel.app';
  
  const finalTitle = title ? `${title} | BookHive` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalUrl = url || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    
    // Open Graph tags
    updateMetaTag('og:title', finalTitle, 'property');
    updateMetaTag('og:description', finalDescription, 'property');
    updateMetaTag('og:image', finalImage, 'property');
    updateMetaTag('og:url', finalUrl, 'property');
    updateMetaTag('og:type', type, 'property');
    
    // Twitter tags
    updateMetaTag('twitter:title', finalTitle, 'property');
    updateMetaTag('twitter:description', finalDescription, 'property');
    updateMetaTag('twitter:image', finalImage, 'property');
    updateMetaTag('twitter:url', finalUrl, 'property');
    
    // Article specific tags
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, 'property');
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, 'property');
    }
    
    // Update canonical URL
    updateCanonicalUrl(finalUrl);
    
  }, [finalTitle, finalDescription, finalImage, finalUrl, type, keywords, author, publishedTime, modifiedTime]);

  return null; // This component doesn't render anything
};

// Helper function to update meta tags
const updateMetaTag = (name, content, attribute = 'name') => {
  if (!content) return;
  
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
};

// Helper function to update canonical URL
const updateCanonicalUrl = (url) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  
  if (canonical) {
    canonical.setAttribute('href', url);
  } else {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', url);
    document.head.appendChild(canonical);
  }
};

export default SEOHead;