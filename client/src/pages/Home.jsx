import { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { getFullImageUrl } from '../utils/imageHelpers';
import { hasValidLocation } from '../utils/locationHelpers';
import atomicHabitsCover from '../assets/atomic_habits.png';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { testimonialAPI, usersAPI, booksAPI } from '../utils/api';

// Lazy load heavy components
const Player = lazy(() => import('@lottiefiles/react-lottie-player').then(module => ({ default: module.Player })));
const LocationPermission = lazy(() => import('../components/LocationPermission'));
const TestimonialModal = lazy(() => import('../components/TestimonialModal'));
import {
  BookOpen,
  Users,
  MapPin,
  Heart,
  Shield,
  ArrowRight,
  Eye,
  Globe,
  Star,
  X,
  MessageCircle,
  Calendar,
  UserPlus,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Send
} from 'lucide-react';
import { AvatarCircles } from '../components/ui/avatar-circles';
import { AuroraText } from '../components/ui/aurora-text';
import TiltedCard from '../components/ui/TiltedCard';
import SEO from '../components/SEO';
import { PAGE_SEO, generateStructuredData } from '../utils/seo';
import { InfiniteMovingCards } from '../components/ui/infinite-moving-cards';
import DomeGallery from '../components/ui/DomeGallery';

// Lazy load animation data
let animationData = null;
const loadAnimationData = async () => {
  if (!animationData) {
    const module = await import('../assets/honeybee.json');
    animationData = module.default;
  }
  return animationData;
};

// Authentication Modal Component
const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="auth-modal-header">
          <Users size={48} className="auth-modal-icon" />
          <h2>Join Our Reading Community</h2>
          <p>You need to be logged in to view community member profiles and connect with fellow readers.</p>
        </div>
        <div className="auth-modal-buttons">
          <Link to="/login" className="auth-modal-btn login-btn">
            <BookOpen size={18} />
            Sign In
          </Link>
          <Link to="/register" className="auth-modal-btn signup-btn">
            <Users size={18} />
            Join BookHive
          </Link>
        </div>
        <div className="auth-modal-footer">
          <p>Join thousands of book lovers sharing and discovering great reads!</p>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [lottieData, setLottieData] = useState(null);

  // Get current month name
  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    return months[currentDate.getMonth()];
  };

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [platformBooks, setPlatformBooks] = useState([]);
  const [booksLoaded, setBooksLoaded] = useState(false);

  const quotes = [
    { text: 'Community-Driven Book Sharing', icon: <BookOpen className="badge-icon" /> },
    { text: 'Share Your Favorite Reads', icon: <Heart className="badge-icon" /> },
    { text: 'Discover New Worlds', icon: <Globe className="badge-icon" /> },
    { text: 'Connect With Fellow Readers', icon: <Users className="badge-icon" /> },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 4000);
    
    // Load animation data lazily
    loadAnimationData().then(data => setLottieData(data));
    
    return () => clearInterval(interval);
  }, [quotes.length]);

  // Check if user needs to set location
  useEffect(() => {
    if (user && !hasValidLocation(user)) {
      // Delay showing modal to avoid overwhelming new users
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Load testimonials on component mount
  useEffect(() => {
    if (testimonialsLoaded) return; // Prevent duplicate calls

    const loadTestimonials = async () => {
      try {
        const response = await testimonialAPI.getPublishedTestimonials();
        setTestimonials(response);
        setTestimonialsLoaded(true);
      } catch (error) {
        console.error('Failed to load testimonials:', error);
        setTestimonials([]);
        setTestimonialsLoaded(true);
      }
    };

    loadTestimonials();
  }, [testimonialsLoaded]);

  // Load community users for avatar circles
  useEffect(() => {
    const loadCommunityUsers = async () => {
      try {
        // Try to get users with books first
        const response = await usersAPI.getUsersWithBooks({ limit: 10 });
        const users = response.data.users || [];

        if (users.length > 0) {
          setCommunityUsers(users);
        } else {
          // Fallback: create some placeholder users if no real users available
          const placeholderUsers = [
            { _id: 'placeholder1', name: 'Sarah Johnson', avatar: null },
            { _id: 'placeholder2', name: 'Mike Chen', avatar: null },
            { _id: 'placeholder3', name: 'Emma Davis', avatar: null },
            { _id: 'placeholder4', name: 'Alex Rodriguez', avatar: null },
            { _id: 'placeholder5', name: 'Lisa Wang', avatar: null },
            { _id: 'placeholder6', name: 'David Kim', avatar: null },
          ];
          setCommunityUsers(placeholderUsers);
        }
      } catch (error) {
        console.error('Failed to load community users:', error);
        // Fallback to placeholder users if API fails
        const placeholderUsers = [
          { _id: 'placeholder1', name: 'Sarah Johnson', avatar: null },
          { _id: 'placeholder2', name: 'Mike Chen', avatar: null },
          { _id: 'placeholder3', name: 'Emma Davis', avatar: null },
          { _id: 'placeholder4', name: 'Alex Rodriguez', avatar: null },
          { _id: 'placeholder5', name: 'Lisa Wang', avatar: null },
          { _id: 'placeholder6', name: 'David Kim', avatar: null },
        ];
        setCommunityUsers(placeholderUsers);
      }
    };

    loadCommunityUsers();
  }, []);

  const handleAvatarClick = (avatar) => {
    if (!user) {
      // User not logged in - show auth modal
      setShowAuthModal(true);
    } else {
      // Check if it's a placeholder user
      if (avatar.userId && avatar.userId.startsWith('placeholder')) {
        // For placeholder users, show auth modal encouraging to join community
        setShowAuthModal(true);
      } else {
        // Real user - navigate to profile
        window.location.href = avatar.profileUrl;
      }
    }
  };

  const handleTestimonialSubmit = async (testimonialData) => {
    try {
      await testimonialAPI.createTestimonial(testimonialData);

      // Reload testimonials to show the new one
      try {
        const testimonialsResponse = await testimonialAPI.getPublishedTestimonials();
        setTestimonials(testimonialsResponse);
      } catch (loadError) {
        console.error('Failed to reload testimonials:', loadError);
      }
    } catch (error) {
      console.error('Failed to submit testimonial:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Load books from the platform
  useEffect(() => {
    if (booksLoaded) return; // Prevent duplicate calls

    const loadPlatformBooks = async () => {
      try {
        const response = await booksAPI.getAllBooks();
        const books = response.data || [];
        
        // Filter and format books with valid cover images
        const formattedBooks = books
          .filter(book => book.coverUrl) // Only books with cover images
          .map(book => ({
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            description: book.description || book.summary || `A wonderful book by ${book.author}`,
            _id: book._id
          }))
          .slice(0, 20); // Limit to 20 most recent books

        setPlatformBooks(formattedBooks);
        setBooksLoaded(true);
      } catch (error) {
        console.error('Failed to load platform books:', error);
        setPlatformBooks([]);
        setBooksLoaded(true);
      }
    };

    loadPlatformBooks();
  }, [booksLoaded]);



  // Default books to always show
  const defaultBooks = [
    { 
      title: 'The Midnight Library', 
      author: 'Matt Haig', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=M53SDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U2Lz0_4XfWJHNkQEVOk6UwFhlc96g&w=1280',
      description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.'
    },
    { 
      title: 'Klara and the Sun', 
      author: 'Kazuo Ishiguro', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=u7XrDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U3HiTPjEpy2pi6oGnAQjeNxFXkd4w&w=1280',
      description: 'A thrilling book that offers a look at our changing world through the eyes of an unforgettable narrator, and one that explores the fundamental question: what does it mean to love?'
    },
    { 
      title: 'Project Hail Mary', 
      author: 'Andy Weir', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=_RH2DwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U3cS_iUgoRlkHZBGIDtqK3i0JOBXA&w=1280',
      description: 'A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the author of The Martian.'
    },
    { 
      title: 'Atomic Habits', 
      author: 'James Clear', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=fFCjDQAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U0AbHgCacqSvU34ynU1HMs_Qoqyqg&w=1280',
      description: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. Learn how tiny changes can lead to remarkable results.'
    },
    { 
      title: 'Where the Crawdads Sing', 
      author: 'Delia Owens', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=jVB1DwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U273neFckgV11hRtZTMj6ClDQMPUQ&w=1280',
      description: 'A beautiful and haunting story of a young girl who raises herself in the marshes of North Carolina, becoming part of the natural world around her.'
    },
    { 
      title: 'The Four Winds', 
      author: 'Kristin Hannah', 
      coverUrl: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTN55MNMX5H9X5B2rFjZ2U3d4xWB40nDHxoziu9AIWIkzeiZ9-9&w=1280',
      description: 'An epic novel of love, heroism, and hope, set against the backdrop of one of America\'s most defining eras—the Great Depression.'
    },
    { 
      title: 'Educated', 
      author: 'Tara Westover', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=J20qEAAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U1oY8c5HajTSig_nMgZf2foYGcdQQ&w=1280',
      description: 'A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.'
    },
    { 
      title: 'The Silent Patient', 
      author: 'Alex Michaelides', 
      coverUrl: 'https://books.google.co.in/books/publisher/content?id=a6NnDwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U0sd_ARiItXsE4NzgkoT7C5xKacag&w=1280',
      description: 'A woman\'s act of violence against her husband and her refusal to speak sends shockwaves through a community in this gripping psychological thriller.'
    },
  ];

  // Combine default books with platform books
  // Platform books come first (most recent), then default books fill the rest
  const recentlyAddedBooks = [...platformBooks, ...defaultBooks];

  const bookOfTheMonth = {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    coverUrl: 'https://books.google.co.in/books/publisher/content?id=M53SDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U2Lz0_4XfWJHNkQEVOk6UwFhlc96g&w=1280',
    reason: `A compelling read that has sparked incredible discussions within our community. Its themes of choice and regret resonate deeply, making it our must-read pick for ${getCurrentMonth()}!`,
  };

  // Create avatars from real community users
  const avatars = communityUsers.map(user => ({
    imageUrl: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`,
    profileUrl: `/profile/${user._id}`,
    userId: user._id,
    userName: user.name,
    isVerified: user.isVerified || false
  }));

  const communityStats = [
    { number: '800+', label: 'Books Shared' },
    { number: '200+', label: 'Active Members' },
    { number: '12', label: 'Local Communities' },
  ];

  // Updated data to match the new testimonial card design
  

  const { ref: howItWorksRef, inView: isHowItWorksVisible } = useInView({ threshold: 0.1 });
  const { ref: statsRef, inView: isStatsVisible } = useInView({ threshold: 0.3 });

  return (
    <>
      <SEO
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
        keywords={PAGE_SEO.home.keywords}
        url={PAGE_SEO.home.url}
        structuredData={generateStructuredData('WebSite')}
      />
      <StyledWrapper>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="lottie-background">
            {lottieData && (
              <Suspense fallback={<div style={{ height: '100%', width: '100%', background: 'transparent' }} />}>
                <Player autoplay loop speed={0.49} src={lottieData} style={{ height: '100%', width: '100%' }} />
              </Suspense>
            )}
          </div>
          <div className="background-gradient"></div>
          <div className="content-container">
            <div className="badge-container">
              <div className="badge">
                <div className="animated-badge" key={quoteIndex}>
                  {quotes[quoteIndex].icon}
                  <span className="badge-text">{quotes[quoteIndex].text}</span>
                </div>
              </div>
            </div>
            <h1 className="main-heading">
              {user ? (
                <>
                  Welcome Back, <AuroraText>{user.name ? user.name.split(' ')[0] : 'Reader'}</AuroraText>
                </>
              ) : (
                <>
                  Welcome to <AuroraText>BookHive</AuroraText>
                </>
              )}
            </h1>
            <p className="sub-heading">
              {user ? (
                "Let's discover your next favorite book or connect with readers near you."
              ) : (
                "The community-driven platform that connects book lovers, enables book sharing, and builds reading communities in your neighborhood."
              )}
            </p>
            <div className="button-group">
              {user ? (
                <>
                  <Link to="/users" className="btn primary-btn group">
                    <Users className="btn-icon" />
                    Browse Community
                    <ArrowRight className="arrow-icon" />
                  </Link>
                  <Link to="/books" className="btn secondary-btn group">
                    <Eye className="btn-icon" />
                    View Books
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn primary-btn group">
                    <BookOpen className="btn-icon" />
                    Join BookHive
                    <ArrowRight className="arrow-icon" />
                  </Link>
                  <Link to="/login" className="btn tertiary-btn group">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Recently Added Books Section */}
        <section className="recently-added-section">
          <div className="content-container">
            <div className="section-header">
              <h2 className="section-title">Fresh On The Shelves</h2>
              <p className="section-subtitle">See what books were recently added by members of the community.</p>
            </div>
          </div>
          <div className="dome-gallery-fullwidth">
            <DomeGallery
              images={recentlyAddedBooks.map(book => ({
                src: getFullImageUrl(book.coverUrl),
                alt: `${book.title} by ${book.author}`,
                title: book.title,
                author: book.author,
                description: book.description
              }))}
              fit={0.55}
              fitBasis="width"
              minRadius={400}
              maxRadius={900}
              padFactor={0.15}
              overlayBlurColor="#ffffff"
              imageBorderRadius="16px"
              openedImageBorderRadius="24px"
              openedImageWidth="320px"
              openedImageHeight="520px"
              grayscale={false}
              segments={35}
            />
          </div>
          <div className="content-container">
            <div className="explore-more-container">
              <Link to={user ? '/books' : '/register'} className="btn explore-more-btn group">
                {user ? 'Discover More Books' : 'Explore More'}
                <ArrowRight className="arrow-icon" />
              </Link>
            </div>
          </div>
        </section>

        {/* Book of the Month Section */}
        <section className="book-of-the-month-section">
          <div className="content-container">
            <div className="book-grid">
              <div className="book-cover-wrapper">
                <TiltedCard
                  imageSrc={getFullImageUrl(bookOfTheMonth.coverUrl)}
                  altText={`Cover of ${bookOfTheMonth.title}`}
                  captionText={`${bookOfTheMonth.title} by ${bookOfTheMonth.author}`}
                  containerHeight="500px"
                  containerWidth="100%"
                  imageHeight="500px"
                  imageWidth="350px"
                  rotateAmplitude={12}
                  scaleOnHover={1.1}
                  showMobileWarning={false}
                  showTooltip={true}
                  displayOverlayContent={false}
                />
              </div>
              <div className="book-details">
                <div className="eyebrow-section">
                  <p className="eyebrow-text">
                    <Star className="eyebrow-icon" />
                    Community Pick for {getCurrentMonth()}
                  </p>
                  <div className="community-readers">
                    {avatars.length > 0 ? (
                      <AvatarCircles
                        numPeople={communityUsers.length + 93}
                        avatarUrls={avatars}
                        onAvatarClick={handleAvatarClick}
                      />
                    ) : (
                      <div className="loading-avatars">
                        <div className="avatar-skeleton"></div>
                        <div className="avatar-skeleton"></div>
                        <div className="avatar-skeleton"></div>
                        <span className="loading-text">Loading community...</span>
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="book-title-featured">{bookOfTheMonth.title}</h2>
                <h3 className="book-author-featured">by {bookOfTheMonth.author}</h3>
                <p className="book-reason">{bookOfTheMonth.reason}</p>

                <Link to="/books" className="btn primary-btn group">
                  Find This Book
                  <ArrowRight className="arrow-icon" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section ref={howItWorksRef} className={`how-it-works-section ${isHowItWorksVisible ? 'is-visible' : ''}`}>
          <div className="content-container">
            <div className="section-header">
              <h2 className="section-title">How BookHive Works</h2>
              <p className="section-subtitle">From concept to connection, BookHive streamlines every step of book sharing, allowing you to discover and share books in minutes.</p>
            </div>
            <div className="how-it-works-grid">
              {/* Card 1 - Create an Account */}
            <div className="how-card card-left">
              <div className="how-card-icon">
                <UserPlus size={24} />
              </div>
              <h3 className="how-card-title">Create an Account</h3>
              <div className="how-card-visual">
                
                {/* SMOOTH GOOGLE LOGIN MOCKUP */}
                <div className="login-mockup-card">
                  <div className="login-header">
                    <span className="login-title">Sign in to BookHive</span>
                    <span className="login-subtitle">Welcome back! Please enter your details.</span>
                  </div>
                  
                  <div className="mock-google-btn">
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                      </g>
                    </svg>
                    <span>Sign in with Google</span>
                  </div>

                  <div className="mock-divider">
                    <span>or</span>
                  </div>

                  <div className="mock-input-field">
                    <span className="placeholder">user@gmail.com</span>
                  </div>
                  
                  <div className="mock-input-btn">
                    <span>Continue</span>
                  </div>
                </div>

              </div>
            </div>

              {/* Card 2 - Connect with readers (Featured/Purple) */}
              <div className="how-card card-center">
                <div className="how-card-icon">
                  <Users size={24} />
                </div>
                <h3 className="how-card-title">Connect with readers</h3>
                <p className="how-card-description">
                  Browse our diverse network of readers and choose the ones who best match your needs. Filter readers by demographics, interests, and lifestyle to narrow down who applies. Have someone in mind? You can also invite your favorite readers directly.
                </p>
                <Link to="/users" className="explore-btn">
                  Explore readers
                </Link>
                <div className="how-card-visual-center">
                  <div className="browser-mockup">
                    <div className="browser-header">
                      <div className="browser-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="browser-content">
                      <img
                        src="./community-screenshot.png"
                        alt="BookHive Community Screenshot"
                        className="community-screenshot"
                        onError={(e) => {
                          // Fallback to showing the profile grid if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'grid';
                        }}
                      />
                      <div className="profile-grid" style={{ display: 'none' }}>
                        <div className="profile-card">
                          <div className="profile-avatar" style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                          <div className="profile-bar"></div>
                        </div>
                        <div className="profile-card">
                          <div className="profile-avatar" style={{ backgroundImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}></div>
                          <div className="profile-bar"></div>
                        </div>
                        <div className="profile-card">
                          <div className="profile-avatar" style={{ backgroundImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}></div>
                          <div className="profile-bar"></div>
                        </div>
                        <div className="profile-card">
                          <div className="profile-avatar" style={{ backgroundImage: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}></div>
                          <div className="profile-bar"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 - Borrowing & Lending */}
            <div className="how-card card-right">
              <div className="how-card-icon">
                <BookOpen size={24} />
              </div>
              <h3 className="how-card-title">Borrow & Exchange</h3>
              <p className="how-card-description">
                Found a book you love? Send a request with one tap. Coordinate the exchange via our secure chat and track your lending history effortlessly.
              </p>
              
              <div className="how-card-visual">
                <div className="phone-mockup">
                  <div className="phone-screen">
                    <div className="phone-content">
                      
                      {/* Mini App UI: Book Request Screen */}
                      <div className="app-ui-container">
                        <div className="app-nav">
                          <div className="nav-dot"></div>
                          <div className="nav-line"></div>
                        </div>
                        
                        <div className="app-book-preview">
                          <div className="mini-book-cover">
                            <img
                              src={atomicHabitsCover}
                              alt="Atomic Habits cover art"
                              className="mini-book-cover-image"
                            />
                            <span className="mini-book-spine"></span>
                          </div>
                        </div>

                        <div className="app-book-info">
                          <span className="mini-title">Atomic Habits</span>
                          <span className="mini-author">James Clear</span>
                          <div className="mini-status">
                            <span className="status-dot"></span>
                            Available • 2km away
                          </div>
                        </div>

                        <button className="app-request-btn">
                          Request Book
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="how-it-works-cta">
              <Link to={user ? '/users' : '/register'} className="btn primary-btn group">
                Get started
                <ArrowRight className="arrow-icon" />
              </Link>
            </div>
          </div>
        </section>

        {/* Community Stats Section */}
        <section className="stats-section" ref={statsRef}>
          <div className="content-container">
            <div className="section-header">
              <h2 className="section-title">Our Community By The Numbers</h2>
              <p className="section-subtitle">
                BookHive is more than an app; it's a growing movement of readers connecting and sharing in neighborhoods just like yours.
              </p>
            </div>
            <div className="stats-grid">
              {communityStats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-number">
                    {isStatsVisible && (
                      <CountUp
                        start={0}
                        end={parseInt(stat.number.replace(/,/g, ''))}
                        duration={2.5}
                        separator=","
                        suffix={stat.number.includes('+') ? '+' : ''}
                      />
                    )}
                  </span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Feature Section */}
        <section className="map-feature-section">
          <div className="content-container">
            <div className="map-grid">
              <div className="map-text-container">
                <div className="section-header">
                  <h2 className="section-title">Discover Your Local Reading Community</h2>
                </div>
                <ul className="map-features-list">
                  <li>
                    <MapPin className="list-icon" />
                    <div>
                      <h4>Find Nearby Readers</h4>
                      <p>See the general location of other members to find reading buddies in your area.</p>
                    </div>
                  </li>
                  <li>
                    <BookOpen className="list-icon" />
                    <div>
                      <h4>Locate Available Books</h4>
                      <p>Easily spot books available for borrowing near you and expand your reading list.</p>
                    </div>
                  </li>
                  <li>
                    <Shield className="list-icon" />
                    <div>
                      <h4>Privacy is Paramount</h4>
                      <p>Your exact location is never shared. We only show a generalized area to protect your privacy.</p>
                    </div>
                  </li>
                </ul>
                <Link to={user ? '/map' : '/login'} className="btn primary-btn group">
                  Explore The Community Map
                  <ArrowRight className="arrow-icon" />
                </Link>
              </div>
              <div className="map-visual-container">
                <div className="map-background">
                  <div className="building" style={{ top: '18%', left: '22%' }}></div>
                  <div className="building" style={{ top: '22%', left: '28%' }}></div>
                  <div className="building" style={{ top: '48%', left: '28%' }}></div>
                  <div className="building" style={{ top: '52%', left: '32%' }}></div>
                  <div className="building" style={{ top: '33%', left: '52%' }}></div>
                  <div className="building" style={{ top: '37%', left: '58%' }}></div>
                  <div className="building" style={{ top: '63%', left: '68%' }}></div>
                  <div className="building" style={{ top: '67%', left: '72%' }}></div>
                  <div className="building" style={{ top: '42%', left: '42%' }}></div>
                  <div className="building" style={{ top: '48%', left: '48%' }}></div>
                  <div className="user-pin" style={{ top: '20%', left: '59%' }}></div>
                  <div className="user-pin" style={{ top: '50%', left: '28%' }}></div>
                  <div className="user-pin" style={{ top: '37%', left: '50%' }}></div>
                  <div className="user-pin" style={{ top: '54%', left: '70%' }}></div>
                  <div className="user-pin" style={{ top: '65%', left: '70%' }}></div>
                  <div className="user-pin" style={{ top: '86%', left: '20%' }}></div>
                  <div className="user-pin main-user-pin" style={{ top: '70%', left: '49%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Become an Organizer Section */}
        <section className="become-organizer-section">
          <div className="content-container">
            <div className="organizer-grid">
              <div className="organizer-visual">
                <div className="organizer-image-wrapper">
                  <div className="organizer-icon-large">
                    <Calendar className="icon-large" />
                  </div>
                  <div className="floating-badge badge-1">
                    <BookOpen size={20} />
                    <span>Create Events</span>
                  </div>
                  <div className="floating-badge badge-2">
                    <Users size={20} />
                    <span>Build Community</span>
                  </div>
                  <div className="floating-badge badge-3">
                    <Star size={20} />
                    <span>Get Verified</span>
                  </div>
                </div>
              </div>
              <div className="organizer-content">
                <div className="section-header">
                  <h2 className="section-title">Become an Organizer</h2>
                </div>
                <ul className="organizer-features-list">
                  <li>
                    <div className="feature-icon-wrapper">
                      <BookOpen className="feature-icon" />
                    </div>
                    <div>
                      <h4>Create & Host Events</h4>
                      <p>Organize book clubs, reading sessions, author meetups, and literary discussions in your area.</p>
                    </div>
                  </li>
                  <li>
                    <div className="feature-icon-wrapper">
                      <Users className="feature-icon" />
                    </div>
                    <div>
                      <h4>Grow Your Community</h4>
                      <p>Build a dedicated following of readers who share your interests and passion for literature.</p>
                    </div>
                  </li>
                  {/* <li>
                  <div className="feature-icon-wrapper">
                    <Star className="feature-icon" />
                  </div>
                  <div>
                    <h4>Get Verified Badge</h4>
                    <p>Stand out with an official organizer badge that showcases your commitment to the community.</p>
                  </div>
                </li> */}
                  <li>
                    <div className="feature-icon-wrapper">
                      <Shield className="feature-icon" />
                    </div>
                    <div>
                      <h4>Access Exclusive Tools</h4>
                      <p>Use advanced features to manage events, track attendance, and engage with your community members.</p>
                    </div>
                  </li>
                </ul>
                <Link to={user ? '/become-organizer' : '/register'} className="btn primary-btn group">
                  <Users className="btn-icon" />
                  {user ? 'Become an Organizer' : 'Join to Become an Organizer'}
                  <ArrowRight className="arrow-icon" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="why-choose-us-section">
          <div className="content-container">
            <div className="section-header">
              <h2 className="section-title">
                Why <span className="highlight-text">BookHive</span> is The Right Choice for You
              </h2>
            </div>
            <div className="why-choose-us-grid">
              <div className="why-card card-1">
                <div className="why-icon-wrapper">
                  <Users className="why-icon" />
                </div>
                <h3 className="why-title">Expert Community</h3>
                <p className="why-description">Learn from avid readers and community veterans who bring real-world experience and insights to the platform.</p>
              </div>
              <div className="why-card card-2">
                <div className="why-icon-wrapper">
                  <Heart className="why-icon" />
                </div>
                <h3 className="why-title">Community-Vetted Reads</h3>
                <p className="why-description">Discover books that are highly regarded by the community, helping you enhance your collection and find new favorites.</p>
              </div>
              <div className="why-card card-3">
                <div className="why-icon-wrapper">
                  <BookOpen className="why-icon" />
                </div>
                <h3 className="why-title">1000+ Shared Books</h3>
                <p className="why-description">BookHive offers over 1000 books across diverse genres. Find practical, hands-on opportunities to discover and share.</p>
              </div>
              <div className="why-card card-featured">
                <div className="why-icon-wrapper dark">
                  <Globe className="why-icon" />
                </div>
                <h3 className="why-title">Flexible Connections</h3>
                <p className="why-description">We understand balancing reading with a busy lifestyle. That's why our community is available on-demand, allowing you to connect at your own pace, anytime, and anywhere.</p>
                <Link to="/register" className="btn why-btn group">
                  Start For Free
                  <ArrowRight className="arrow-icon" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* ============ ANIMATED TESTIMONIALS SECTION ============ */}
        {/* ========================================================== */}
        <section className="reviews-section">
          <div className="content-container">
            <div className="section-header">
              <h2 className="section-title">What Our <span className="highlight-text">Community</span> Says</h2>
              <p className="section-subtitle">Real experiences from book lovers who've found their reading community through BookHive.</p>
            </div>

            {/* Infinite Moving Cards Component */}
            {testimonials.length > 0 ? (
              <InfiniteMovingCards
                items={testimonials.map(testimonial => ({
                  photo: testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.user || testimonial.name)}&background=4F46E5&color=ffffff&bold=true`,
                  name: testimonial.user || testimonial.name,
                  title: testimonial.title || '',
                  rating: testimonial.rating || 5,
                  content: testimonial.review || testimonial.content,
                  isVerified: testimonial.isVerified || false
                }))}
                direction="left"
                speed="slow"
                pauseOnHover={true}
                className="my-8"
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No testimonials yet. Be the first to share your experience!</p>
              </div>
            )}

            {/* Add Testimonial Button - Only show if user is logged in */}
            {user ? (
              <div className="testimonial-cta">
                <button
                  className="add-testimonial-btn"
                  onClick={() => setShowTestimonialModal(true)}
                >
                  Add Your Testimonial
                </button>
                <p className="testimonial-cta-text">
                  Share your BookHive experience and help others discover our community!
                </p>
              </div>
            ) : (
              <div className="testimonial-cta">
                <Link to="/login" className="add-testimonial-btn">
                  Login to Add Your Testimonial
                </Link>
                <p className="testimonial-cta-text">
                  Join BookHive to share your experience with our community!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
           {/* Footer Section */}
        <footer className="footer-section">
          <div className="footer-content">
            <div className="footer-top">
              <div className="footer-heading">
                <h2>Ready to Join the BookHive Community?</h2>
                <p>Start sharing your love for books, discover new reads, and connect with fellow readers in your area.</p>
              </div>
              <div className="footer-links-grid">
                <div className="footer-column">
                  <h3>About BookHive</h3>
                  <ul>
                    <li><Link to="/about">Our Story</Link></li>
                    <li><Link to="/team">Team</Link></li>
                    {/* <li><Link to="/careers">Careers</Link></li> */}
                  </ul>
                </div>
                
                <div className="footer-column">
                  <h3>Explore</h3>
                  <ul>
                    <li><Link to="/users">Community</Link></li>
                    <li><Link to="/books">Discover Books</Link></li>
                    <li><Link to="/events">Events</Link></li>
                  </ul>
                </div>
                
                <div className="footer-column">
                  <h3>Support</h3>
                  <ul>
                    <li><Link to="/help">Help Center</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li>
                    <li><Link to="/faq">FAQs</Link></li>
                  </ul>
                </div>
                
                <div className="footer-column">
                  <h3>Stay Connected</h3>
                  <div className="social-links">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <Facebook size={20} />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <Instagram size={20} />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <Linkedin size={20} />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                      <Youtube size={20} />
                    </a>
                  </div>
                  <div className="newsletter">
                    <p className="newsletter-label">Newsletter</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                      <input 
                        type="email" 
                        placeholder="Sign up - email" 
                        className="newsletter-input"
                      />
                      <button type="submit" className="newsletter-submit" aria-label="Subscribe">
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="footer-actions">
              <Link to="/users" className="footer-btn explore-btn">
                <Globe size={20} />
                Explore Community
                <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="footer-btn contact-btn">
                <MessageCircle size={20} />
                Get in Touch
              </Link>
            </div>
            
            <div className="footer-bottom">
              <p>© 2025 BookHive. All rights reserved.</p>
            </div>
          </div>
        </footer>
        </section>

        {/* Location Permission Modal */}
        {showLocationModal && (
          <Suspense fallback={null}>
            <LocationPermission onClose={() => setShowLocationModal(false)} />
          </Suspense>
        )}

        {/* Testimonial Modal - Only show if user is logged in */}
        {showTestimonialModal && user && (
          <Suspense fallback={null}>
            <TestimonialModal
              onClose={() => setShowTestimonialModal(false)}
              onSubmit={handleTestimonialSubmit}
            />
          </Suspense>
        )}

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </StyledWrapper>
    </>
  );
};

// ... (keyframes and styled-components) ...
const scrollLeft = keyframes`
 from {
   transform: translateX(0);
 }
 to {
   transform: translateX(-50%);
 }
`;

const fadeInOut = keyframes`
 0% { opacity: 0; transform: translateY(10px); }
 20% { opacity: 1; transform: translateY(0); }
 80% { opacity: 1; transform: translateY(0); }
 100% { opacity: 0; transform: translateY(-10px); }
`;

const pingPong = keyframes`
 0% { transform: translateX(0); }
 50% { transform: translateX(10px); }
 100% { transform: translateX(0); }
`;

const flipInY = keyframes`
 from { transform: rotateY(90deg); opacity: 0; }
 to { transform: rotateY(0deg); opacity: 1; }
`;

const mapPulse = keyframes`
 0% {
   transform: scale(0.95);
   box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
 }
 70% {
   transform: scale(1);
   box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
 }
 100% {
   transform: scale(0.95);
   box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
 }
`;


const StyledWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden; /* Prevent horizontal scroll */
  margin-top: -30px;

  .content-container {
    position: relative;
    z-index: 2;
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
    @media (min-width: 640px) { padding: 0 1.5rem; }
    @media (min-width: 1024px) { padding: 0 2rem; }
  }

  /* Hero Section */
  .hero-section {
    position: relative;
    padding: 6.2rem 0;
    width: 100%;
    overflow: hidden;
    text-align: center;
    .lottie-background {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
      overflow: hidden;
      > div { height: 100%; width: 100%; object-fit: cover; }
    }
    .background-gradient {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.7), rgba(249, 250, 251, 0.9));
      z-index: 1;
    }
    .badge-container { margin-bottom: 2rem; display: flex; justify-content: center; }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      background-color: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
      border-radius: 9999px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      margin-bottom: 2rem;
      min-width: 300px;
      min-height: 42px;
    }
    .animated-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ${fadeInOut} 4s ease-in-out infinite;
    }
    .badge-icon { height: 1.25rem; width: 1.25rem; color: #4F46E5; margin-right: 0.5rem; }
    .badge-text { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .main-heading {
      font-size: 3.75rem;
      font-weight: 900;
      color: #111827;
      margin-bottom: 2rem;
      line-height: 1.1;
      @media (min-width: 768px) { font-size: 6rem; }
    }
    .highlight-text {
      background-image: linear-gradient(to right, #4F46E5, #a855f7, #3b82f6);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .sub-heading {
      font-size: 1.25rem;
      color: #1f2937;
      margin-bottom: 3rem;
      max-width: 64rem;
      margin-left: auto;
      margin-right: auto;
      font-weight: 500;
      line-height: 1.625;
      @media (min-width: 768px) { font-size: 1.5rem; }
    }
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      justify-content: center;
      align-items: center;
      @media (min-width: 640px) { flex-direction: row; }
    }
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    padding: 1.25rem 2.5rem;
    font-weight: 700;
    border-radius: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    font-size: 1.125rem;
    &:hover {
      box-shadow: 0 20px 25px -5px var(--shadow-color, rgba(0,0,0,0.1)), 0 8px 10px -6px var(--shadow-color, rgba(0,0,0,0.1));
      transform: translateY(-0.25rem);
    }
    .btn-icon { margin-right: 0.75rem; height: 1.5rem; width: 1.5rem; }
    .arrow-icon {
      margin-left: 0.75rem;
      height: 1.5rem;
      width: 1.5rem;
      animation: ${pingPong} 1.5s ease-in-out infinite;
    }
  }
  .primary-btn {
    background-image: linear-gradient(to right, #4F46E5, #a855f7);
    color: white;
    --shadow-color: rgba(79, 70, 229, 0.25);
    &:hover { background-image: linear-gradient(to right, rgba(79, 70, 229, 0.9), rgba(168, 85, 247, 0.9)); }
  }
  .secondary-btn {
    background-image: linear-gradient(to right, #F43F5E, #ec4899);
    color: white;
    --shadow-color: rgba(244, 63, 94, 0.25);
    &:hover { background-image: linear-gradient(to right, rgba(244, 63, 94, 0.9), rgba(236, 72, 153, 0.9)); }
  }
  .tertiary-btn {
    background-color: white;
    color: #111827;
    border: 2px solid #e5e7eb;
    &:hover { background-color: #f9fafb; }
  }
    
/* ======== UPDATED RECENTLY ADDED BOOKS STYLES ======== */
  .recently-added-section {
    padding: 6rem 0;
    background-color: white;
    overflow: hidden; /* Prevent horizontal scroll */

    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 3rem;
      font-weight: 900;
      color: #111827;
      margin-bottom: 1.5rem;
    }
    .section-subtitle {
      font-size: 1.25rem;
      color: #374151;
      max-width: 48rem;
      margin: 0 auto;
      font-weight: 500;
    }
  }

  .books-carousel {
    overflow: hidden;
    -webkit-mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
    mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
    
    &:hover .books-scroller {
      animation-play-state: paused;
    }
  }

  .books-scroller {
    display: flex;
    gap: 1.5rem;
    width: fit-content;
    animation: ${scrollLeft} 40s linear infinite;
  }

  .book-card {
    flex: 0 0 250px; 
    width: 250px;      
    border-radius: 0.75rem;
    overflow: hidden;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
  }

  .book-cover {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
  }

  .book-info {
    padding: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .book-title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .book-author {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* === FULL WIDTH DOME GALLERY CONTAINER === */
  .dome-gallery-fullwidth {
    width: 100%;
    max-width: 100vw;
    height: 700px;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    margin-top: 2rem;
    margin-bottom: 2rem;
    overflow: hidden; /* Prevent horizontal scroll */
    padding: 0 1rem; /* Add padding to prevent edge cutoff */

    @media (min-width: 768px) {
      height: 750px;
      padding: 0 2rem;
    }

    @media (min-width: 1024px) {
      height: 800px;
      padding: 0 3rem;
    }

    @media (min-width: 1536px) {
      height: 850px;
      padding: 0 4rem;
    }
  }

  /* === NEW STYLES FOR EXPLORE MORE BUTTON === */
  .explore-more-container {
    text-align: center;
    margin-top: 3rem;
  }

  .explore-more-btn {
    background-color: white;
    color: #4F46E5;
    border: 1px solid #ddd;
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    font-weight: 600;
    --shadow-color: rgba(79, 70, 229, 0.1);

    .arrow-icon {
      animation: none;
      transition: transform 0.3s ease;
      height: 1.25rem;
      width: 1.25rem;
    }
    
    &:hover .arrow-icon {
      transform: translateX(5px);
    }
  }

  /* ============================================== */
  /* ===== NEW "BOOK OF THE MONTH" STYLES ========= */
  /* ============================================== */
  .book-of-the-month-section {
    padding: 6rem 0;
    background-color: #f9fafb;
  }

  .book-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    align-items: center;
    @media (min-width: 1024px) {
      grid-template-columns: 350px 1fr;
      gap: 5rem;
    }
  }

  .book-cover-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .book-details {
    text-align: center;
    @media (min-width: 1024px) {
      text-align: left;
    }
  }

  .eyebrow-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
    @media (min-width: 1024px) {
      justify-content: flex-start;
      flex-wrap: nowrap;
    }
  }

  .eyebrow-text {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: #4F46E5;
    background-color: #eef2ff;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    margin-bottom: 0;
  }

  .eyebrow-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .book-title-featured {
    font-size: 3rem;
    font-weight: 900;
    color: #111827;
    line-height: 1.1;
    margin-bottom: 0.5rem;
    @media (min-width: 768px) {
      font-size: 3.75rem;
    }
  }

  .book-author-featured {
    font-size: 1.5rem;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 2rem;
  }

  .book-reason {
    font-size: 1.125rem;
    line-height: 1.75;
    color: #374151;
    margin-bottom: 2rem;
  }

  .community-readers {
    display: flex;
    align-items: center;
    margin-bottom: 0;
  }

  .loading-avatars {
    display: flex;
    align-items: center;
    gap: -8px;
  }

  .avatar-skeleton {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border: 3px solid white;
    margin-left: -8px;

    &:first-child {
      margin-left: 0;
    }
  }

  .loading-text {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 1rem;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* How It Works Section */
  .how-it-works-section {
    padding: 6rem 0;
    background-color: #f9fafb;
    width: 100%;
    
    .section-header { 
      text-align: center; 
      margin-bottom: 4rem; 
    }
    
    .section-title { 
      font-size: 3rem; 
      font-weight: 900; 
      color: #111827; 
      margin-bottom: 1rem; 
    }
    
    .section-subtitle { 
      font-size: 1.125rem; 
      color: #6b7280; 
      max-width: 48rem; 
      margin: 0 auto; 
      font-weight: 400; 
      line-height: 1.6; 
    }
    
    .how-it-works-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 3rem;
      
      @media (min-width: 1024px) {
        flex-direction: row;
        height: 600px; /* Fixed height for consistent expansion */
      }
    }
    
    .how-card {
      background-color: #f3f4f6;
      border-radius: 1.5rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      
      /* Animation & Transition */
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      opacity: 0;
      transform: translateY(30px);
      overflow: hidden;
      
      /* Mobile Defaults */
      min-height: 400px;
      
      @media (min-width: 1024px) {
        flex: 1; /* Default state: all equal width */
        min-width: 0;
        height: 100%;
        
        &:hover {
          flex: 3; /* Hovered state: expands horizontally */
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 10;
        }
      }
    }
    
    &.is-visible .how-card {
      animation: fadeInUp 0.6s ease-out forwards;
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.5s; }
    }
    
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .card-center {
      background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
      
      @media (min-width: 1024px) {
        padding: 2.5rem;
      }
    }
    
    .card-left,
    .card-right {
      background-color: #f3f4f6;
    }
    
    .how-card-icon {
      width: 2.5rem;
      height: 2.5rem;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: #374151;
      flex-shrink: 0;
    }
    
    .how-card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
      white-space: nowrap; /* Prevent title wrapping during transition */
    }
    
    .how-card-description {
      text-align: justify;
      font-size: 0.95rem;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    
    .explore-btn {
      background-color: #5b21b6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
      margin-bottom: 1.5rem;
      width: fit-content;
      
      &:hover {
        background-color: #6d28d9;
      }
    }
    
    /* Visual Container for Phone/Browser Mockups */
    .how-card-visual {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      flex: 1;
      overflow: visible;
    }
    
    /* Login Mockup Styles - Stretched & Smoother */
    .login-mockup-card {
      background-color: white;
      border-radius: 1rem; /* Smoother corners */
      padding: 2.5rem 2rem; /* Stretched padding */
      margin-top: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 1.5rem; /* Stretched gap between elements */
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      width: 100%;
      max-width: 400px; /* Ensures it looks good on wide screens */
      margin-left: auto;
      margin-right: auto;
    }

    /* Hover effect for the card itself */
    .how-card:hover .login-mockup-card {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-color: #e5e7eb;
    }

    .login-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .login-title {
      font-size: 1.25rem; /* Larger title */
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.025em;
    }
    
    .login-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .mock-google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 0.875rem; /* Taller button */
      font-size: 0.95rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .mock-google-btn:hover {
      background-color: #f9fafb;
      border-color: #d1d5db;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .mock-divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #9ca3af;
      font-size: 0.875rem;
      width: 100%;
    }

    .mock-divider::before,
    .mock-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e5e7eb;
    }

    .mock-divider span {
      padding: 0 1rem;
    }

    .mock-input-field {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem; /* Taller input */
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }
    
    /* Simulate focus state on hover */
    .how-card:hover .mock-input-field {
      border-color: #d1d5db;
      background-color: white;
    }

    .mock-input-field .placeholder {
      font-size: 0.95rem;
      color: #9ca3af;
    }

    .mock-input-btn {
      background-image: linear-gradient(to right, #4F46E5, #7c3aed);
      color: white;
      border-radius: 0.75rem;
      padding: 0.875rem; /* Taller button */
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    
    .mock-input-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }

    /* Phone App UI Styling */
    .app-ui-container {
      width: 100%;
      height: 100%;
      padding: 2rem 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(to bottom, #f9fafb 0%, white 100%);
      position: relative;
    }

    .app-nav {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .nav-dot { 
      width: 18px; 
      height: 18px; 
      background: #e5e9ebff; 
      border-radius: 50%; 
    }
    
    .nav-line { 
      width: 35px; 
      height: 6px; 
      background: #15d853cb; 
      border-radius: 3px; 
    }

    .app-book-preview {
      margin-bottom: 1.25rem;
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.15));
      transition: transform 0.3s ease;
    }

    .mini-book-cover {
      width: 110px;
      height: 165px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      box-shadow: 
        0 15px 35px rgba(15, 23, 42, 0.2),
        0 5px 15px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .mini-book-cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .mini-book-spine {
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(0, 0, 0, 0.15);
      box-shadow: 1px 0 2px rgba(0, 0, 0, 0.1);
    }

    .app-book-info {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1.5rem;
      padding: 0 0.5rem;
    }

    .mini-title {
      font-weight: 800;
      color: #111827;
      font-size: 0.95rem;
      line-height: 1.2;
    }

    .mini-author {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: -10px;
    }

    .mini-status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 150px;
      margin-top: -40px;
      margin-bottom: -20px;
      gap: 0.35rem;
      font-size: 0.7rem;
      color: #059669;
      background-color: #ecfdf5;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-top: 0.35rem;
      font-weight: 600;
    }

    .status-dot {
      width: 5px;
      height: 5px;
      background-color: #059669;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .app-request-btn {
      width: 100%;
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: white;
      border: none;
      padding: 0.25rem;
      border-radius: 0.75rem;
      font-size: 0.85rem;
      font-weight: 700;
      // cursor: pointer;
      margin-top: auto;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      letter-spacing: 0.025em;
    }

    /* Animation on Hover */
    .card-right:hover .app-request-btn {
      margin-top:5px;
      transform: translateY(-2px);
      background: linear-gradient(135deg, #4F46E5 0%, #6366f1 100%);
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    }
    
    .card-right:hover .app-book-preview {
      transform: translateY(-8px) scale(1.05);
    }
    
    .card-right:hover .mini-book-cover {
      box-shadow: 
        0 20px 45px rgba(15, 23, 42, 0.3),
        0 8px 20px rgba(0, 0, 0, 0.18);
    }

    /* Form Mockup */
    .form-mockup {
      background-color: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    
    .form-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e5e7eb;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .form-label {
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .form-value {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 600;
      background-color: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
    }
    
    /* Browser Mockup */
    .browser-mockup {
      background-color: white;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .browser-header {
      background-color: #f3f4f6;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .browser-dots {
      display: flex;
      gap: 0.5rem;
      
      span {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        background-color: #8c8080ff;
        
        &:nth-child(1) {
          background-color: #ff5f56; /* Red */
        }
        
        &:nth-child(2) {
          background-color: #ffbd2e; /* Yellow */
        }
        
        &:nth-child(3) {
          background-color: #27c93f; /* Green */
        }
      }
    }
    
    .browser-content {
      padding: 0;
      overflow: hidden;
      background-color: #f9fafb;
    }
    
    .community-screenshot {
      width: 100%;
      height: auto;
      max-height: 400px;
      display: block;
      object-fit: contain;
      object-position: top;
      border-radius: 0 0 0.75rem 0.75rem;
    }
    
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 1.5rem;
    }
    
    .profile-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    
    .profile-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #e5e7eb;
    }
    
    .profile-bar {
      width: 100%;
      height: 0.5rem;
      background-color: #e5e7eb;
      border-radius: 0.25rem;
    }
    
    /* iPhone-Style Phone Mockup */
    .phone-mockup {
      margin-top: -30px;
      display: flex;
      justify-content: center;
      perspective: 1000px;
    }
    
    .phone-screen {
      width: 200px;
      height: 400px;
      background: linear-gradient(145deg, #2d3748, #1a202c);
      border-radius: 2.5rem;
      padding: 0.75rem;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.4),
        inset 0 0 0 2px rgba(255, 255, 255, 0.1);
      position: relative;
      transition: transform 0.3s ease;
      
      /* iPhone notch */
      &::before {
        content: '';
        position: absolute;
        top: 0.75rem;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 20px;
        background: #1a202c;
        border-radius: 0 0 1rem 1rem;
        z-index: 10;
      }
      
      /* iPhone home indicator */
      &::after {
        content: '';
        position: absolute;
        bottom: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        z-index: 10;
      }
    }
    
    .card-right:hover .phone-screen {
      transform: rotateY(-5deg) rotateX(5deg) scale(1.02);
    }
    
    .phone-content {
      width: 100%;
      height: 100%;
      border-radius: 2rem;
      overflow: hidden;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .book-preview {
      width: 100%;
      height: 100%;
      background-color: transparent;
      border-radius: 0;
      backdrop-filter: none;
    }
    
    .how-it-works-cta {
      text-align: center;
      margin-top: 3rem;
    }
  }

  /* Stats Section */
  .stats-section {
  background-color: white; 
  padding: 6rem 0; 

  .section-header {
    text-align: center;
    margin-bottom: 4rem; 
    max-width: 48rem;
    margin-left: auto;
    margin-right: auto;
  }
  
  .section-title {
    font-size: 3rem;
    font-weight: 900;
    color: #111827;
    margin-bottom: 1.5rem;
  }
  .section-subtitle {
    font-size: 1.25rem;
    color: #374151;
    font-weight: 500;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, 1fr); 
    }
  }
}

.stat-item {
  background-color: #f9fafb; 
  border: 1px solid #f3f4f6;
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-0.5rem);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
}

.stat-number {
  display: block;
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 0.5rem;
  background-image: linear-gradient(to right, #4F46E5, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-label {
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Map Feature Section */
.map-feature-section {
  padding: 6rem 0;
  background-color: white;

  .map-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
    align-items: center;

    @media (min-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .map-text-container {
    .section-header {
      text-align: left;
      margin-bottom: 2.5rem;
    }
    .section-title {
      font-size: 3rem;
      font-weight: 900;
      color: #111827;
      margin-bottom: 1.5rem;
    }
    .section-subtitle {
      font-size: 1.25rem;
      color: #374151;
      max-width: none;
      margin: 0;
      font-weight: 500;
    }
  }

  .map-features-list {
    list-style: none;
    padding: 0;
    margin: 0 0 2.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .list-icon {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      color: #4F46E5;
      background-color: #eef2ff;
      padding: 0.5rem;
      border-radius: 0.5rem;
    }
    
    h4 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: #374151;
      line-height: 1.625;
      margin: 0;
    }
  }

  .map-visual-container {
    perspective: 1500px;
    @media (max-width: 1023px) {
      order: -1;
    }
  }

  .map-background {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 500px;
    margin: 0 auto;
    background-color: #f4f1ec; 
    background: url('/static-map.png') center center/cover no-repeat;
    border-radius: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
    overflow: hidden;
    transform: rotateX(10deg) rotateY(-15deg) rotateZ(5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotateX(0) rotateY(0) rotateZ(0) scale(1.05);
    }
  }

  .user-pin {
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: #0994eaff;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transform-origin: center;
    animation: ${mapPulse} 2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.3s; }
    &:nth-child(3) { animation-delay: 0.6s; }
    &:nth-child(4) { animation-delay: 0.9s; }
  }
  .main-user-pin {
    background-color: #eb590bff; 
    width: 20px;
    height: 20px;
    animation-duration: 1.5s;
    animation: ${mapPulse} 1.5s infinite;
  }
}

/* Become an Organizer Section */
.become-organizer-section {
  padding: 6rem 0;
  background-color: #f9fafb;

  .organizer-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
    align-items: center;

    @media (min-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .organizer-visual {
    display: flex;
    justify-content: center;
    align-items: center;
    
    @media (min-width: 1024px) {
      order: 2;
    }
  }

  .organizer-image-wrapper {
    position: relative;
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .organizer-icon-large {
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, #4F46E5, #7c3aed);
    border-radius: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.4);
    transform: rotate(-5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotate(0deg) scale(1.05);
    }

    .icon-large {
      width: 100px;
      height: 100px;
      color: white;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  .floating-badge {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 9999px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    animation: float 3s ease-in-out infinite;

    svg {
      color: #4F46E5;
    }

    &.badge-1 {
      top: 10%;
      left: -5%;
      animation-delay: 0s;
    }

    &.badge-2 {
      top: 50%;
      right: -10%;
      animation-delay: 1s;
    }

    &.badge-3 {
      bottom: 15%;
      left: 5%;
      animation-delay: 2s;
    }
  }

  .organizer-content {
    @media (min-width: 1024px) {
      order: 1;
    }

    .section-header {
      text-align: left;
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 3rem;
      font-weight: 900;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .section-subtitle {
      font-size: 1.25rem;
      color: #374151;
      line-height: 1.75;
      font-weight: 500;
      max-width: none;
      margin: 0;
    }
  }

  .organizer-features-list {
    list-style: none;
    padding: 0;
    margin: 0 0 2.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .feature-icon-wrapper {
      flex-shrink: 0;
      width: 3rem;
      height: 3rem;
      background-color: #eef2ff;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background-color: #4F46E5;
        transform: scale(1.1);

        .feature-icon {
          color: white;
        }
      }
    }

    .feature-icon {
      width: 1.5rem;
      height: 1.5rem;
      color: #4F46E5;
      transition: color 0.3s ease;
    }

    h4 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: #374151;
      line-height: 1.625;
      margin: 0;
      font-size: 1rem;
    }
  }
}

.why-choose-us-section {
    padding: 6rem 0;
    background-color: #f9fafb;

    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    
    .section-eyebrow {
      font-size: 1rem;
      font-weight: 700;
      color: #4F46E5;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    
    .section-title {
      font-size: 3rem;
      font-weight: 900;
      color: #111827;
      line-height: 1.2;
      max-width: 40rem;
      margin-left: auto;
      margin-right: auto;

      .highlight-text {
        background-image: linear-gradient(to right, #4F46E5, #a855f7);
        -webkit-background-clip: text; 
        background-clip: text;
        color: transparent; 
      }
    }

    .why-choose-us-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
      
      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto auto;
        grid-template-areas:
          "card1 card2 featured"
          "card3 card3 featured";
        
        .card-1 { grid-area: card1; }
        .card-2 { grid-area: card2; }
        .card-3 { grid-area: card3; }
        .card-featured { grid-area: featured; }
      }
    }

    .why-card {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 1.5rem;
      padding: 2.5rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      
      &:hover {
        transform: translateY(-0.5rem);
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      }
    }

    .why-icon-wrapper {
      width: 4rem;
      height: 4rem;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      background-color: #eef2ff;

      &.dark { background-color: rgba(255, 255, 255, 0.1); }
    }

    .why-icon {
      width: 2rem;
      height: 2rem;
      color: #4F46E5;
    }

    .why-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }

    .why-description {
      font-size: 1rem;
      color: #374151;
      line-height: 1.625;
    }

    .card-featured {
      background-color: #111827;
      color: white;
      display: flex;
      flex-direction: column;

      .why-icon { color: white; }
      .why-title { color: white; }
      .why-description { color: #d1d5db; margin-bottom: 2rem; }

      .btn.why-btn {
        background-color: #805EEE;
        color: white;
        padding: 1rem 2rem;
        font-size: 1rem;
        width: 100%;
        justify-content: center;
        margin-top: auto;

        &:hover { background-color: #16a34a; }

        .arrow-icon {
          animation: none;
          transition: transform 0.3s ease;
        }

        &:hover .arrow-icon { transform: translateX(4px); }
      }
    }
  }

  
  
  /* Community Reviews Section */
  .reviews-section {
    margin-bottom: -6rem;
    padding: 6rem 0;
    background-color: white;

    .section-header {
      margin-bottom: 3rem;
      text-align: center;
    }

    /* --- Add these styles to match other headings --- */
    .section-title {
      font-size: 3rem;
      font-weight: 900;
      color: #111827;
      line-height: 1.2;
      margin-bottom: 1.5rem;
      max-width: 48rem;
      margin-left: auto;
      margin-right: auto;
      .highlight-text {
        background-image: linear-gradient(to right, #4F46E5, #a855f7);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
    .section-subtitle {
      font-size: 1.25rem;
      color: #374151;
      font-weight: 500;
      max-width: 58rem;
      margin: 0 auto;
      line-height: 1.5;
    }
  }
    
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #111827;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      .star-icon {
        width: 1rem;
        height: 1rem;
        color: #f59e0b;
      }
    }
    
    /* Re-purposing the book scroller for testimonials */
    .testimonials-scroller {
        animation-duration: 60s; /* Make it scroll a bit slower */
    }

    .testimonial-card {
      flex: 0 0 380px; /* Fixed width for each card */
      width: 380px;
      height: 100%;
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 1.5rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.07);
      }
    }

    .testimonial-quote-icon {
      width: 2.5rem;
      height: 2.5rem;
      color: #4F46E5; /* Primary brand color */
    }
    
    .testimonial-text {
        font-size: 1.125rem;
        line-height: 1.75;
        color: #374151;
        margin: 0;
        flex-grow: 1; /* Pushes the author to the bottom */
    }

    .testimonial-author {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .testimonial-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }
    
    .testimonial-user {
        font-weight: 700;
        color: #111827;
        margin: 0;
    }

    .testimonial-title {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
    }

    /* Testimonial CTA Section */
    .testimonial-cta {
        text-align: center;
        margin-top: 3rem;
        padding: 2rem;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
    }

    .add-testimonial-btn {
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-size: 1.125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        margin-bottom: 20px;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
            background: linear-gradient(135deg, #4338CA 0%, #6D28D9 100%);
        }

        &:active {
            transform: translateY(0);
        }
    }

    .testimonial-cta-text {
        color: #64748b;
        font-size: 1rem;
        margin-top: 20px;
        line-height: 1.6;
    }
  }
  
  /* Authentication Modal Styles */
  .auth-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .auth-modal-content {
    background: white;
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 480px;
    width: 100%;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    text-align: center;
  }

  .auth-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;

    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }

  .auth-modal-header {
    margin-bottom: 2rem;

    .auth-modal-icon {
      color: #4F46E5;
      margin-bottom: 1rem;
    }

    h2 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1rem;
      color: #6b7280;
      line-height: 1.6;
    }
  }

  .auth-modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;

    @media (min-width: 640px) {
      flex-direction: row;
    }
  }

  .auth-modal-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.2s;
    flex: 1;

    &.login-btn {
      background: #f8fafc;
      color: #374151;
      border: 2px solid #e5e7eb;

      &:hover {
        background: #f1f5f9;
        border-color: #d1d5db;
        transform: translateY(-1px);
      }
    }

    &.signup-btn {
      background: linear-gradient(135deg, #4F46E5, #7c3aed);
      color: white;
      border: 2px solid transparent;

      &:hover {
        background: linear-gradient(135deg, #4338ca, #6d28d9);
        transform: translateY(-1px);
        box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
      }
    }
  }

  .auth-modal-footer {
    p {
      font-size: 0.875rem;
      color: #9ca3af;
      font-style: italic;
    }
  }

  /* Footer Section Styles */
  .footer-section {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%);
    color: white;
    padding: 4rem 0 2rem;
    margin-top: 4rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .footer-top {
    margin-bottom: 3rem;
  }

  .footer-heading {
    text-align: center;
    margin-bottom: 3rem;

    h2 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: white;
    }

    p {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.9);
      max-width: 700px;
      margin: 0 auto;
    }
  }

  .footer-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2.5rem;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .footer-column {
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: white;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 0.75rem;

        a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.2s;
          display: inline-block;

          &:hover {
            color: white;
            transform: translateX(4px);
          }
        }
      }
    }
  }

  .social-links {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;

    a {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.3s;
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-3px);
      }
    }
  }

  .newsletter {
    margin-top: 1rem;

    .newsletter-label {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .newsletter-form {
    display: flex;
    gap: 0.2rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50px;
    padding: 0.25rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);

    .newsletter-input {
      flex: 1;
      background: transparent;
      border: none;
      padding: 0.625rem 1rem;
      color: white;
      font-size: 0.875rem;
      outline: none;
      // margin-top: -10px;
      margin-right: -20px;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .newsletter-submit {
      background: white;
      color: #6366f1;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      flex-shrink: 0;
      
      
      &:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: scale(1.05);
      }
    }
  }

  .footer-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 3rem 0 2rem;
    flex-wrap: wrap;
  }

  .footer-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;
    font-size: 0.95rem;

    &.explore-btn {
      background: white;
      color: #6366f1;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
    }

    &.contact-btn {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-2px);
      }
    }
  }

  .footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    margin-top: 2rem;

    p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      margin: 0;
    }
  }
`;

export default Home;