export const BOOK_CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Fantasy',
    'Biography',
    'History',
    'Science',
    'Technology',
    'Business',
    'Self-Help',
    'Poetry',
    'Drama',
    'Children',
    'Young Adult',
    'Comics',
    'Other'
  ]

export const BOOK_CONDITIONS = [
    'New',
    'Like New',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ]
  
  export const BORROW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DENIED: 'denied',
    BORROWED: 'borrowed',
    RETURNED: 'returned',
    OVERDUE: 'overdue'
  }
  
  export const DEFAULT_COORDINATES = {
    lat: 40.7128,
    lng: -74.0060 // New York City
  }
  
  export const MAP_CONFIG = {
    defaultZoom: 12,
    maxZoom: 18,
    minZoom: 3,
    attribution: '© OpenStreetMap contributors'
  }
  
  export const VALIDATION_RULES = {
    password: {
      minLength: 6,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
  
  export const DEFAULT_BORROW_DAYS = 14