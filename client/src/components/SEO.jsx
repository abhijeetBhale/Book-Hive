import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { 
  generateSEO, 
  generateOGTags, 
  generateTwitterTags,
  generateStructuredData 
} from '../utils/seo';

/**
 * SEO Component - Manages meta tags, Open Graph, Twitter Cards, and Structured Data
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Page keywords
 * @param {string} props.image - Page image URL
 * @param {string} props.url - Page URL
 * @param {string} props.type - Page type (website, article, etc.)
 * @param {Object} props.structuredData - JSON-LD structured data
 * @param {Array} props.breadcrumbs - Breadcrumb items
 */
const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type,
  structuredData,
  breadcrumbs,
  children 
}) => {
  // Generate complete SEO configuration
  const seo = generateSEO({ title, description, keywords, image, url, type });
  
  // Generate Open Graph and Twitter tags
  const ogTags = generateOGTags(seo);
  const twitterTags = generateTwitterTags(seo);

  // Generate breadcrumb structured data if breadcrumbs provided
  const breadcrumbData = breadcrumbs 
    ? generateStructuredData('BreadcrumbList', { items: breadcrumbs })
    : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content={seo.author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seo.url} />
      
      {/* Open Graph Tags */}
      {ogTags.map((tag, index) => (
        <meta key={`og-${index}`} property={tag.property} content={tag.content} />
      ))}
      
      {/* Twitter Card Tags */}
      {twitterTags.map((tag, index) => (
        <meta key={`twitter-${index}`} name={tag.name} content={tag.content} />
      ))}
      
      {/* Structured Data - Organization/Website */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Breadcrumb Structured Data */}
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      
      {/* PWA Meta Tags */}
      <meta name="theme-color" content="#1a87db" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="BookHive" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" href="/src/assets/icons8-bee-100.png" />
      
      {children}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  structuredData: PropTypes.object,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
  children: PropTypes.node,
};

export default SEO;
