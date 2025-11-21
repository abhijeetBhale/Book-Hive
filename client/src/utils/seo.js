/**
 * SEO Utility Functions for BookHive
 * Centralized SEO configuration and helper functions
 */

// Base URL for the application
export const BASE_URL = 'https://book-hive-frontend.onrender.com';

// Default SEO configuration
export const DEFAULT_SEO = {
  title: 'BookHive - Share Your Thoughts | Book Sharing Platform',
  description: 'Join BookHive, the revolutionary platform for book lovers to connect, share, and discover new literary adventures. Borrow books, build your library, and connect with readers nearby.',
  keywords: 'book sharing, book lending, book borrowing, book community, read books, book exchange, local books, book lovers, reading community, share books',
  author: 'BookHive Team',
  image: `${BASE_URL}/src/assets/icons8-bee-100.png`,
  url: BASE_URL,
  type: 'website',
  siteName: 'BookHive',
  twitterHandle: '@bookhive',
};

/**
 * Generate page-specific SEO metadata
 * @param {Object} config - Page-specific SEO configuration
 * @returns {Object} Complete SEO metadata
 */
export const generateSEO = (config = {}) => {
  return {
    title: config.title || DEFAULT_SEO.title,
    description: config.description || DEFAULT_SEO.description,
    keywords: config.keywords || DEFAULT_SEO.keywords,
    author: config.author || DEFAULT_SEO.author,
    image: config.image || DEFAULT_SEO.image,
    url: config.url || DEFAULT_SEO.url,
    type: config.type || DEFAULT_SEO.type,
    siteName: DEFAULT_SEO.siteName,
    twitterHandle: DEFAULT_SEO.twitterHandle,
  };
};

/**
 * Page-specific SEO configurations
 */
export const PAGE_SEO = {
  home: {
    title: 'BookHive - Share Your Thoughts | Connect with Book Lovers',
    description: 'Discover, share, and borrow books from readers in your community. Join BookHive to build your digital library, connect with book lovers, and explore new literary adventures.',
    keywords: 'book sharing platform, borrow books online, book community, local book exchange, reading community, share books nearby',
    url: BASE_URL,
  },
  
  books: {
    title: 'Browse Books | BookHive',
    description: 'Explore thousands of books available for borrowing in your area. Find your next read from our community of book lovers.',
    keywords: 'browse books, available books, borrow books, book catalog, find books nearby',
    url: `${BASE_URL}/books`,
  },
  
  users: {
    title: 'Connect with Readers | BookHive Community',
    description: 'Meet fellow book enthusiasts, follow readers with similar tastes, and build your literary network on BookHive.',
    keywords: 'book community, connect readers, book lovers, reading friends, literary network',
    url: `${BASE_URL}/users`,
  },
  
  map: {
    title: 'Book Map | Find Books Near You | BookHive',
    description: 'Discover available books on an interactive map. Find books to borrow from readers in your neighborhood.',
    keywords: 'book map, books nearby, local books, find books location, book sharing map',
    url: `${BASE_URL}/map`,
  },
  
  login: {
    title: 'Login | BookHive',
    description: 'Sign in to your BookHive account to access your library, messages, and connect with the reading community.',
    keywords: 'login, sign in, book sharing login, bookhive account',
    url: `${BASE_URL}/login`,
  },
  
  register: {
    title: 'Join BookHive | Create Your Account',
    description: 'Create your free BookHive account and start sharing books with readers in your community. Build your digital library today.',
    keywords: 'sign up, register, create account, join bookhive, book sharing signup',
    url: `${BASE_URL}/register`,
  },
  
  contact: {
    title: 'Contact Us | BookHive Support',
    description: 'Get in touch with the BookHive team. We\'re here to help with questions, feedback, or support.',
    keywords: 'contact bookhive, customer support, help, feedback, book sharing support',
    url: `${BASE_URL}/contact`,
  },
  
  terms: {
    title: 'Terms of Service | BookHive',
    description: 'Read BookHive\'s terms of service and user agreement. Learn about our policies for book sharing and community guidelines.',
    keywords: 'terms of service, user agreement, bookhive terms, policies',
    url: `${BASE_URL}/terms`,
  },
  
  privacy: {
    title: 'Privacy Policy | BookHive',
    description: 'Learn how BookHive protects your privacy and handles your data. Read our comprehensive privacy policy.',
    keywords: 'privacy policy, data protection, user privacy, bookhive privacy',
    url: `${BASE_URL}/privacy`,
  },
  
  myBooks: {
    title: 'My Books | BookHive',
    description: 'Manage your personal book collection, track borrowed books, and organize your digital library.',
    keywords: 'my books, book collection, manage books, digital library',
    url: `${BASE_URL}/my-books`,
  },
  
  profile: {
    title: 'My Profile | BookHive',
    description: 'View and edit your BookHive profile, manage your settings, and track your reading activity.',
    keywords: 'user profile, account settings, bookhive profile',
    url: `${BASE_URL}/profile`,
  },
  
  messages: {
    title: 'Messages | BookHive',
    description: 'Chat with other readers, coordinate book exchanges, and stay connected with your reading community.',
    keywords: 'messages, chat, book exchange communication',
    url: `${BASE_URL}/messages`,
  },
  
  friends: {
    title: 'Friends | BookHive',
    description: 'Connect with your reading friends, see their activity, and discover new books through your network.',
    keywords: 'friends, reading network, book connections',
    url: `${BASE_URL}/friends`,
  },
  
  calendar: {
    title: 'Reading Calendar | BookHive',
    description: 'Track your reading schedule, manage book due dates, and plan your literary journey.',
    keywords: 'reading calendar, book schedule, due dates, reading planner',
    url: `${BASE_URL}/calendar`,
  },
};

/**
 * Generate structured data (JSON-LD) for a page
 * @param {string} type - Type of structured data
 * @param {Object} data - Data for structured markup
 * @returns {Object} JSON-LD structured data
 */
export const generateStructuredData = (type, data = {}) => {
  const structuredData = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'Organization':
      return {
        ...structuredData,
        '@type': 'Organization',
        name: 'BookHive',
        description: DEFAULT_SEO.description,
        url: BASE_URL,
        logo: DEFAULT_SEO.image,
        sameAs: [
          // Add social media links here when available
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          email: 'support@bookhive.com',
        },
      };

    case 'WebSite':
      return {
        ...structuredData,
        '@type': 'WebSite',
        name: 'BookHive',
        description: DEFAULT_SEO.description,
        url: BASE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${BASE_URL}/books?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };

    case 'Book':
      return {
        ...structuredData,
        '@type': 'Book',
        name: data.title,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        isbn: data.isbn,
        bookFormat: 'Paperback',
        description: data.description,
        image: data.image,
        genre: data.genre,
      };

    case 'Review':
      return {
        ...structuredData,
        '@type': 'Review',
        itemReviewed: {
          '@type': 'Person',
          name: data.reviewedUser,
        },
        author: {
          '@type': 'Person',
          name: data.reviewer,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: data.rating,
          bestRating: '5',
        },
        reviewBody: data.comment,
      };

    case 'BreadcrumbList':
      return {
        ...structuredData,
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };

    default:
      return structuredData;
  }
};

/**
 * Generate Open Graph meta tags
 * @param {Object} seo - SEO configuration
 * @returns {Array} Array of Open Graph meta tags
 */
export const generateOGTags = (seo) => {
  return [
    { property: 'og:type', content: seo.type },
    { property: 'og:title', content: seo.title },
    { property: 'og:description', content: seo.description },
    { property: 'og:url', content: seo.url },
    { property: 'og:image', content: seo.image },
    { property: 'og:site_name', content: seo.siteName },
    { property: 'og:locale', content: 'en_US' },
  ];
};

/**
 * Generate Twitter Card meta tags
 * @param {Object} seo - SEO configuration
 * @returns {Array} Array of Twitter Card meta tags
 */
export const generateTwitterTags = (seo) => {
  return [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: seo.twitterHandle },
    { name: 'twitter:creator', content: seo.twitterHandle },
    { name: 'twitter:title', content: seo.title },
    { name: 'twitter:description', content: seo.description },
    { name: 'twitter:image', content: seo.image },
  ];
};
