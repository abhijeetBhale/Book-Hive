import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { BookOpen, Users, Heart, Globe, ArrowLeft, Target, Eye, Lightbulb } from 'lucide-react';
import SEO from '../components/SEO';

const About = () => {
  return (
    <>
      <SEO 
        title="About BookHive - Our Story"
        description="Learn about BookHive's mission to connect book lovers and build reading communities through book sharing."
        keywords="about bookhive, book sharing platform, reading community, our story"
        url="/about"
      />
      <StyledWrapper>
        <div className="about-container">
          <div className="back-link">
            <Link to="/">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>

          {/* Hero Section */}
          <section className="hero-section">
            <h1 className="main-title">Our Story</h1>
            <p className="hero-subtitle">
              Building a community where book lovers connect, share, and discover their next favorite read
            </p>
          </section>

          {/* Mission Section */}
          <section className="content-section">
            <div className="section-grid">
              <div className="section-icon-wrapper">
                <Target className="section-icon" />
              </div>
              <div className="section-content">
                <h2 className="section-title">Our Mission</h2>
                <p className="section-text">
                  BookHive was born from a simple idea: books should bring people together, not gather dust on shelves. 
                  We believe that every book has a story to tell and every reader has a story to share. Our mission is 
                  to create a vibrant community where book lovers can connect, exchange their favorite reads, and build 
                  meaningful relationships through the shared love of literature.
                </p>
                <p className="section-text">
                  In a world where digital connections often feel shallow, BookHive offers something different - real 
                  connections built around tangible books and genuine conversations. We're not just a book-sharing platform; 
                  we're a movement to revive the joy of community reading and make literature accessible to everyone.
                </p>
              </div>
            </div>
          </section>

          {/* Vision Section */}
          <section className="content-section alternate">
            <div className="section-grid reverse">
              <div className="section-icon-wrapper">
                <Eye className="section-icon" />
              </div>
              <div className="section-content">
                <h2 className="section-title">Our Vision</h2>
                <p className="section-text">
                  We envision a world where every neighborhood has a thriving reading community, where books circulate 
                  freely among neighbors, and where the love of reading brings people together across all boundaries. 
                  BookHive aims to be the catalyst for these connections, making book sharing as natural as recommending 
                  a good restaurant to a friend.
                </p>
                <p className="section-text">
                  Our vision extends beyond just sharing books. We want to create local reading hubs, organize community 
                  events, and foster a culture where literature is celebrated and accessible to all. Through BookHive, 
                  we're building the future of community-driven reading.
                </p>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="values-section">
            <h2 className="section-title centered">What We Stand For</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon-wrapper">
                  <Users className="value-icon" />
                </div>
                <h3 className="value-title">Community First</h3>
                <p className="value-text">
                  We believe in the power of community. Every feature we build is designed to bring readers closer 
                  together and foster meaningful connections.
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon-wrapper">
                  <Heart className="value-icon" />
                </div>
                <h3 className="value-title">Sharing is Caring</h3>
                <p className="value-text">
                  Books are meant to be shared. We make it easy and rewarding to share your favorite reads with 
                  others in your community.
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon-wrapper">
                  <Globe className="value-icon" />
                </div>
                <h3 className="value-title">Accessibility</h3>
                <p className="value-text">
                  Everyone deserves access to great books. We're committed to making literature accessible to all, 
                  regardless of economic barriers.
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon-wrapper">
                  <Lightbulb className="value-icon" />
                </div>
                <h3 className="value-title">Innovation</h3>
                <p className="value-text">
                  We continuously innovate to improve the book-sharing experience, combining technology with the 
                  timeless joy of reading.
                </p>
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="story-section">
            <div className="story-content">
              <h2 className="section-title">How It All Started</h2>
              <div className="story-text">
                <p>
                  BookHive began in 2025 when our founder noticed a common problem: shelves full of books that had 
                  been read once and forgotten, while neighbors were buying the same books new. The idea was simple - 
                  what if there was an easy way to share these books with people nearby?
                </p>
                <p>
                  What started as a small neighborhood initiative quickly grew into something bigger. People didn't 
                  just want to exchange books; they wanted to discuss them, meet fellow readers, and build a community 
                  around their shared passion for literature.
                </p>
                <p>
                  Today, BookHive serves thousands of readers across multiple cities, facilitating book exchanges, 
                  organizing reading events, and helping people discover their next favorite book through trusted 
                  recommendations from their community.
                </p>
                <p>
                  We're just getting started. Join us in building the world's largest community-driven book-sharing 
                  platform, one neighborhood at a time.
                </p>
              </div>
            </div>
          </section>
          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-content">
              <BookOpen className="cta-icon" size={48} />
              <h2 className="cta-title">Ready to Join Our Community?</h2>
              <p className="cta-text">
                Be part of a growing movement of book lovers sharing, discovering, and connecting through literature.
              </p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-btn primary">
                  Get Started
                </Link>
                <Link to="/team" className="cta-btn secondary">
                  Meet the Team
                </Link>
              </div>
            </div>
          </section>
        </div>
      </StyledWrapper>
    </>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  background: white;
  color: #374151;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  .about-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .back-link {
    margin-bottom: 2rem;

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;

      &:hover {
        color: #4F46E5;
      }
    }
  }

  .hero-section {
    text-align: center;
    padding: 4rem 0;
    margin-bottom: 4rem;

    .main-title {
      font-size: 4rem;
      font-weight: 900;
      background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1.5rem;
      line-height: 1.1;

      @media (max-width: 768px) {
        font-size: 3rem;
      }
    }

    .hero-subtitle {
      font-size: 1.5rem;
      color: #6b7280;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;

      @media (max-width: 768px) {
        font-size: 1.25rem;
      }
    }
  }

  .content-section {
    padding: 4rem 0;
    border-top: 1px solid #e5e7eb;

    &.alternate {
      background: #f9fafb;
      margin: 0 -2rem;
      padding: 4rem 2rem;
    }

    .section-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 3rem;
      align-items: start;

      &.reverse {
        @media (min-width: 768px) {
          direction: rtl;
          > * {
            direction: ltr;
          }
        }
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    .section-icon-wrapper {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.3);

      @media (max-width: 768px) {
        width: 60px;
        height: 60px;
      }
    }

    .section-icon {
      width: 40px;
      height: 40px;
      color: white;

      @media (max-width: 768px) {
        width: 30px;
        height: 30px;
      }
    }

    .section-content {
      .section-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 1.5rem;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .section-text {
        font-size: 1.125rem;
        line-height: 1.8;
        color: #4b5563;
        margin-bottom: 1.5rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .values-section {
    padding: 6rem 0;

    .section-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 3rem;

      &.centered {
        text-align: center;
      }

      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }

    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .value-card {
      padding: 2rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border-color: #4F46E5;
      }

      .value-icon-wrapper {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .value-icon {
        width: 30px;
        height: 30px;
        color: white;
      }

      .value-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 1rem;
      }

      .value-text {
        font-size: 1rem;
        line-height: 1.6;
        color: #6b7280;
      }
    }
  }

  .story-section {
    padding: 6rem 0;
    background: #f9fafb;
    margin: 0 -2rem;
    padding: 6rem 2rem;

    .story-content {
      max-width: 800px;
      margin: 0 auto;

      .section-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 2rem;
        text-align: center;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .story-text {
        p {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #4b5563;
          margin-bottom: 1.5rem;
          text-align: justify;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .cta-section {
    padding: 6rem 0;
    text-align: center;

    .cta-content {
      max-width: 600px;
      margin: 0 auto;

      .cta-icon {
        color: #4F46E5;
        margin-bottom: 1.5rem;
      }

      .cta-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 1rem;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .cta-text {
        font-size: 1.125rem;
        color: #6b7280;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .cta-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .cta-btn {
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s;
        font-size: 1rem;

        &.primary {
          background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(79, 70, 229, 0.3);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(79, 70, 229, 0.4);
          }
        }

        &.secondary {
          background: white;
          color: #4F46E5;
          border: 2px solid #4F46E5;

          &:hover {
            background: #4F46E5;
            color: white;
          }
        }
      }
    }
  }
`;

export default About;
