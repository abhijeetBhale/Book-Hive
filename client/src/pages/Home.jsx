import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { getFullImageUrl } from '../utils/imageHelpers';
import { hasValidLocation } from '../utils/locationHelpers';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../assets/honeybee.json';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import LocationPermission from '../components/LocationPermission';
import TestimonialModal from '../components/TestimonialModal';
import { testimonialAPI } from '../utils/api';
import {
  BookOpen,
  Users,
  MapPin,
  Share2,
  Heart,
  Shield,
  ArrowRight,
  PlusCircle,
  Globe,
  ChevronDown,
  Star,
  Quote,
} from 'lucide-react';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);

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
        setTestimonials(response.data);
        setTestimonialsLoaded(true);
      } catch (error) {
        console.error('Failed to load testimonials:', error);
        // Use default testimonials if API fails
        setTestimonials(communityReviews);
        setTestimonialsLoaded(true);
      }
    };

    loadTestimonials();
  }, [testimonialsLoaded]);

  const handleTestimonialSubmit = async (testimonialData) => {
    await testimonialAPI.createTestimonial(testimonialData);
    // Optionally reload testimonials after submission
    // const response = await testimonialAPI.getPublishedTestimonials();
    // setTestimonials(response.data);
  };

  const recentlyAddedBooks = [
    { title: 'The Midnight Library', author: 'Matt Haig', coverUrl: 'https://books.google.co.in/books/publisher/content?id=M53SDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U2Lz0_4XfWJHNkQEVOk6UwFhlc96g&w=1280' },
    { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', coverUrl: 'https://books.google.co.in/books/publisher/content?id=u7XrDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U3HiTPjEpy2pi6oGnAQjeNxFXkd4w&w=1280' },
    { title: 'Project Hail Mary', author: 'Andy Weir', coverUrl: 'https://books.google.co.in/books/publisher/content?id=_RH2DwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U3cS_iUgoRlkHZBGIDtqK3i0JOBXA&w=1280' },
    { title: 'Atomic Habits', author: 'James Clear', coverUrl: 'https://books.google.co.in/books/publisher/content?id=fFCjDQAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U0AbHgCacqSvU34ynU1HMs_Qoqyqg&w=1280' },
    { title: 'Where the Crawdads Sing', author: 'Delia Owens', coverUrl: 'https://books.google.co.in/books/publisher/content?id=jVB1DwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U273neFckgV11hRtZTMj6ClDQMPUQ&w=1280' },
    { title: 'The Four Winds', author: 'Kristin Hannah', coverUrl: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTN55MNMX5H9X5B2rFjZ2U3d4xWB40nDHxoziu9AIWIkzeiZ9-9&w=1280' },
    { title: 'Educated', author: 'Tara Westover', coverUrl: 'https://books.google.co.in/books/publisher/content?id=J20qEAAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U1oY8c5HajTSig_nMgZf2foYGcdQQ&w=1280' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', coverUrl: 'https://books.google.co.in/books/publisher/content?id=a6NnDwAAQBAJ&pg=PA1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U0sd_ARiItXsE4NzgkoT7C5xKacag&w=1280' },
  ];

  const bookOfTheMonth = {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    coverUrl: 'https://books.google.co.in/books/publisher/content?id=M53SDwAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&bul=1&sig=ACfU3U2Lz0_4XfWJHNkQEVOk6UwFhlc96g&w=1280',
    reason: `A compelling read that has sparked incredible discussions within our community. Its themes of choice and regret resonate deeply, making it our must-read pick for September!`,
  };

  const howItWorks = [
    { step: '1', title: 'Join BookHive', description: 'Create your account and set up your profile with your location and reading preferences.' },
    { step: '2', title: 'Add Your Books', description: "Upload your book collection with details like title, author, condition, and whether it's available for borrowing." },
    { step: '3', title: 'Discover Readers', description: 'Browse other users in your area, see their book collections, and connect with fellow book lovers.' },
    { step: '4', title: 'Borrow & Share', description: 'Request to borrow books from others and lend your books to the community. Build lasting friendships through reading.' },
  ];

  const communityStats = [
    { number: '800+', label: 'Books Shared' },
    { number: '200+', label: 'Active Members' },
    { number: '12', label: 'Local Communities' },
  ];

  // Updated data to match the new testimonial card design
  const communityReviews = [
    {
      user: 'Priya Sharma',
      title: 'Avid Reader, Indore',
      avatar: 'https://i.pravatar.cc/150?img=48', // Using a specific image seed
      review: "Absolutely love this platform! It helped me discover so many local readers and hidden gems in my own city. A must-have for every book lover.",
    },
    {
      user: 'Rohan Patel',
      title: 'President, Mumbai Readers Club',
      avatar: 'https://i.pravatar.cc/150?img=67', // Using a specific image seed
      review: "BookHive is a game-changer for our book club. Managing borrows and discovering new books for discussion has never been easier.",
    },
    {
      user: 'Anjali Menon',
      title: 'Community Organizer, Delhi',
      avatar: 'https://i.pravatar.cc/150?img=25', // Using a specific image seed
      review: "A fantastic initiative that truly builds a community around the love for reading. It's safe, easy to use, and full of wonderful people.",
    },
    {
      user: 'Vikram Singh',
      title: 'Top Contributor, Bengaluru',
      avatar: 'https://i.pravatar.cc/150?img=53', // Using a specific image seed
      review: "As someone who loves sharing books, the process is seamless. The map feature is brilliant for finding books nearby. Highly recommended!",
    },
  ];

  const { ref: howItWorksRef, inView: isHowItWorksVisible } = useInView({ threshold: 0.1 });
  const { ref: statsRef, inView: isStatsVisible } = useInView({ threshold: 0.3 });

  return (
    <StyledWrapper>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="lottie-background">
          <Player autoplay loop speed={0.49} src={animationData} style={{ height: '100%', width: '100%' }} />
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
                Welcome back, <span className="highlight-text">{user.name ? user.name.split(' ')[0] : 'Reader'}</span>
              </>
            ) : (
              <>
                Welcome to <span className="highlight-text">BookHive</span>
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
                <Link to="/my-books" className="btn secondary-btn group">
                  <PlusCircle className="btn-icon" />
                  Add Your Books
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
            <h2 className="section-title">Fresh on the Shelves</h2>
            <p className="section-subtitle">See what books were recently added by members of the community.</p>
          </div>
          <div className="books-carousel">
            <div className="books-scroller">
              {[...recentlyAddedBooks, ...recentlyAddedBooks].map((book, index) => (
                <Link to="/register" key={index} className="book-card">
                  <img src={getFullImageUrl(book.coverUrl)} alt={`Cover of ${book.title}`} className="book-cover" />
                  <div className="book-info">
                    <h4 className="book-title">{book.title}</h4>
                    <p className="book-author">{book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="explore-more-container">
            <Link to={user ? '/users' : '/register'} className="btn explore-more-btn group">
              {user ? 'Discover Readers' : 'Explore More'}
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
              <img src={getFullImageUrl(bookOfTheMonth.coverUrl)} alt={`Cover of ${bookOfTheMonth.title}`} className="book-cover-image" />
            </div>
            <div className="book-details">
              <p className="eyebrow-text">
                <Star className="eyebrow-icon" />
                Community Pick for September
              </p>
              <h2 className="book-title-featured">{bookOfTheMonth.title}</h2>
              <h3 className="book-author-featured">by {bookOfTheMonth.author}</h3>
              <p className="book-reason">{bookOfTheMonth.reason}</p>
              <Link to={user ? '/users' : '/register'} className="btn primary-btn group">
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
            <p className="section-subtitle">Get started with BookHive in just a few simple steps and join a thriving community of book lovers.</p>
          </div>
          <div className="steps-grid">
            {howItWorks.map((item) => (
              <div key={item.step} className="step-card group">
                <div className="step-number">{item.step}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="stats-section" ref={statsRef}>
        <div className="content-container">
          <div className="section-header">
            <h2 className="section-title">Our Community by the Numbers</h2>
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
              <Link to="/login" className="btn primary-btn group">
                Explore The Community Map
                <ArrowRight className="arrow-icon" />
              </Link>
            </div>
            <div className="map-visual-container">
              <div className="map-background">
                <div className="road road-h-1"></div>
                <div className="road road-h-2"></div>
                <div className="road road-v-1"></div>
                <div className="road road-v-2"></div>
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
      {/* ============ UPDATED "COMMUNITY REVIEWS" SECTION ============ */}
      {/* ========================================================== */}
      <section className="reviews-section">
        <div className="content-container">
          <div className="section-header">
            <h2 className="section-title">What Our Community Says</h2>
            <p className="section-subtitle">Real experiences from book lovers who've found their reading community through BookHive.</p>
          </div>

          {/* Reusing the existing books carousel for a consistent horizontal scroll */}
          <div className="books-carousel">
            <div className="books-scroller testimonials-scroller">
              {/* Use dynamic testimonials if available, otherwise fallback to static ones */}
              {(testimonials.length > 0 ? [...testimonials, ...testimonials] : [...communityReviews, ...communityReviews]).map((review, index) => (
                <div key={index} className="testimonial-card">
                  <Quote className="testimonial-quote-icon" />
                  <p className="testimonial-text">{review.review}</p>
                  <div className="testimonial-author">
                    <img src={review.avatar} alt={review.user} className="testimonial-avatar" />
                    <div className="testimonial-author-info">
                      <p className="testimonial-user">{review.user}</p>
                      <p className="testimonial-title">{review.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Testimonial Button */}
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-overlay"></div>
        <div className="content-container cta-content">
          <h2 className="cta-title">Ready to Join the BookHive Community?</h2>
          <p className="cta-subtitle">Start sharing your love for books, discover new reads, and connect with fellow readers in your area.</p>
          <div className="button-group">
            {user ? (
              <Link to="/users" className="btn cta-btn group">
                <Globe className="btn-icon" />
                Explore Community
                <ArrowRight className="arrow-icon" />
              </Link>
            ) : (
              <Link to="/register" className="btn cta-btn group">
                <BookOpen className="btn-icon" />
                Get Started Today
                <ArrowRight className="arrow-icon" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Location Permission Modal */}
      {showLocationModal && (
        <LocationPermission onClose={() => setShowLocationModal(false)} />
      )}

      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <TestimonialModal
          onClose={() => setShowTestimonialModal(false)}
          onSubmit={handleTestimonialSubmit}
        />
      )}
    </StyledWrapper>
  );
};

// ... (keyframes remain the same) ...
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
    perspective: 1000px;
    display: flex;
    justify-content: center;
  }

  .book-cover-image {
    width: 100%;
    max-width: 350px;
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    transition: transform 0.4s ease;
    transform: rotateY(-15deg) rotateX(5deg);

    &:hover {
      transform: rotateY(0) rotateX(0) scale(1.05);
    }
  }

  .book-details {
    text-align: center;
    @media (min-width: 1024px) {
      text-align: left;
    }
  }

  .eyebrow-text {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: #4F46E5;
    margin-bottom: 1.5rem;
    background-color: #eef2ff;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
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
    margin-bottom: 2.5rem;
  }

  /* How It Works Section */
  .how-it-works-section {
    padding: 6rem 0;
    background-color: #f8f8f8;
    width: 100%;
    .section-header { text-align: center; margin-bottom: 4rem; }
    .section-title { font-size: 2.75rem; font-weight: 800; color: #333; margin-bottom: 1rem; }
    .section-subtitle { font-size: 1.1rem; color: #666; max-width: 45rem; margin: 0 auto; font-weight: 400; line-height: 1.5; }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 1.5rem;
      perspective: 1000px;
      @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }
      @media (min-width: 1024px) { grid-template-columns: repeat(4, 1fr); }
    }
    .step-card {
      text-align: center;
      padding: 2rem;
      border-radius: 0.75rem;
      background-color: white;
      border: 1px solid #eee;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      backface-visibility: hidden;
      opacity: 0;
      transform: rotateY(90deg);
      transition: opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.3s ease, border-color 0.3s ease;
      &:hover {
        border-color: #ddd;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        transform: translateY(-0.25rem) rotateY(0);
      }
    }
    &.is-visible .step-card {
      animation: ${flipInY} 0.7s ease-in-out forwards;
      &:nth-child(1) { animation-delay: 0.2s; }
      &:nth-child(2) { animation-delay: 0.4s; }
      &:nth-child(3) { animation-delay: 0.6s; }
      &:nth-child(4) { animation-delay: 0.8s; }
    }
    .step-number {
      width: 4rem; height: 4rem;
      background-color: #e0e0e0; color: #555;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700;
      margin: 0 auto 1.5rem;
      transition: transform 0.3s ease, background-color 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      .group:hover & { transform: scale(1.05); background-color: #d0d0d0; }
    }
    .step-title { font-size: 1.35rem; font-weight: 700; color: #333; margin-bottom: 0.75rem; }
    .step-description { color: #666; line-height: 1.5; font-size: 0.95rem; }
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
    border-radius: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
    overflow: hidden;
    transform: rotateX(10deg) rotateY(-15deg) rotateZ(5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotateX(0) rotateY(0) rotateZ(0) scale(1.05);
    }

    &::before {
      content: '';
      position: absolute;
      width: 80%;
      height: 50%;
      top: -15%;
      left: -20%;
      background: #aadaff; 
      border-radius: 0 0 50% 50%;
      transform: rotate(-25deg);
    }

    &::after {
      content: '';
      position: absolute;
      width: 50%;
      height: 35%;
      bottom: 5%;
      right: -10%;
      background: #d1e8d2; 
      border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%;
      transform: rotate(10deg);
    }
  }

  .road {
    position: absolute;
    background: #fff;
    box-shadow: 0 0 0 1px #ddd;
    z-index: 1; 
  }

  .road-h-1 { width: 120%; height: 10px; top: 35%; left: -10%; transform: rotate(-10deg); }
  .road-h-2 { width: 120%; height: 12px; top: 75%; left: -10%; transform: rotate(-15deg); }
  
  .road-v-1 { width: 10px; height: 120%; top: -10%; left: 25%; transform: rotate(-12deg); }
  .road-v-2 { width: 12px; height: 120%; top: -10%; left: 65%; transform: rotate(-18deg); }


  .user-pin {
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: #4F46E5;
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
    background-color: #F43F5E; 
    width: 20px;
    height: 20px;
    animation-duration: 1.5s;
    animation: ${mapPulse} 1.5s infinite;
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

  /* CTA Section */
  .cta-section {
    padding: 6rem 0;
    background-image: linear-gradient(to bottom right, #4F46E5, #a855f7, #3b82f6);
    position: relative;
    overflow: hidden;
    width: 100%;
    .cta-overlay { position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.1); }
    .cta-content { position: relative; text-align: center; }
    .cta-title { font-size: 3rem; font-weight: 900; color: white; margin-bottom: 2rem; }
    .cta-subtitle { font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 3rem; font-weight: 500; }
    .cta-btn {
      background-color: white;
      color: #4F46E5;
      --shadow-color: rgba(255, 255, 255, 0.25);
      &:hover { background-color: #f9fafb; }
    }
  }
  
  /* Community Reviews Section */
  .reviews-section {
    padding: 6rem 0;
    background-color: white;

    .section-header {
      margin-bottom: 3rem;
      text-align: center;
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
        margin-bottom: 1rem;

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
        margin: 0;
        line-height: 1.6;
    }
  }
`;

export default Home;