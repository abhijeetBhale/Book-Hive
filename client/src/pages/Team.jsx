import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Github, Linkedin, Mail, Globe } from 'lucide-react';
import SEO from '../components/SEO';
import ProfileCard from '../components/ui/ProfileCard';
import profilePhoto from '../assets/Abhiijeet.png';

const Team = () => {
  return (
    <>
      <SEO 
        title="Meet the Team - BookHive"
        description="Meet the passionate team behind BookHive, dedicated to building the world's best book-sharing community."
        keywords="bookhive team, about us, founders, developers"
        url="/team"
      />
      <StyledWrapper>
        <div className="team-container">
          {/* <div className="back-link">
            <Link to="/">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div> */}

          {/* Hero Section */}
          {/* <section className="hero-section">
            <h1 className="main-title">Meet the Team</h1>
            <p className="hero-subtitle">
              The passionate individuals building BookHive and connecting book lovers worldwide
            </p>
          </section> */}

          {/* Profile Card Section */}
          <section className="profile-card-section">
            <div className="profile-card-container">
              <ProfileCard
                name="Abhijeet Bhale"
                title="Software Developer"
                handle="isocyanideisgood"
                status="Developing BookHive"
                contactText="Get in Touch"
                avatarUrl={profilePhoto}
                miniAvatarUrl={profilePhoto}
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={false}
                onContactClick={() => window.location.href = 'mailto:abhijeetbhale7@gmail.com'}
              />
            </div>
          </section>

          {/* Bio Section */}
          <section className="bio-section">
            <div className="bio-content">
              <h2 className="section-title">About The Founder</h2>
              <div className="bio-text">
                <p>
                  Hi! I'm Abhijeet Bhale, the founder of BookHive, a passionate developer and book enthusiast who believes 
                  in the power of community and shared knowledge. I created BookHive to solve a simple problem: 
                  connecting book lovers and making literature more accessible to everyone.
                </p>
                <p>
                  With a background in full-stack development and a love for reading, I combined my technical 
                  skills with my passion for books to build a platform that brings people together. BookHive 
                  is more than just a project - it's a mission to revive the joy of community reading and 
                  make every book count.
                </p>
                <p>
                  When I'm not coding or working on BookHive, you'll find me exploring new books, attending 
                  local book clubs, or brainstorming new features to enhance the BookHive experience.
                </p>
              </div>

              {/* <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-number">2025</span>
                  <span className="stat-label">Founded</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">200+</span>
                  <span className="stat-label">Books Shared</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Active Users</span>
                </div>
              </div> */}

              <div className="social-links">
                <a href="mailto:abhijeetbhale7@gmail.com" className="social-link" aria-label="Email">
                  <Mail size={24} />
                </a>
                <a href="https://github.com/abhijeetBhale" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                  <Github size={24} />
                </a>
                <a href="https://www.linkedin.com/in/abhijeetbhale7/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                  <Linkedin size={24} />
                </a>
                <a href="https://abhijeetbhale.github.io/Portfolio/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Website">
                  <Globe size={24} />
                </a>
              </div>
            </div>
          </section>

          {/* Mission Statement */}
          <section className="mission-section">
            <div className="mission-content">
              <h2 className="section-title">Our Mission</h2>
              <p className="mission-text">
                At BookHive, we're on a mission to create the world's largest community-driven book-sharing platform. 
                We believe that books have the power to connect people, spark conversations, and build stronger communities. 
                Through technology and passion, we're making literature more accessible and bringing readers together, 
                one book at a time.
              </p>
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

  .team-container {
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

  .profile-card-section {
    padding: 2rem 0 4rem;

    .profile-card-container {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 500px;
      margin: 0 auto;
    }
  }

  .bio-section {
    padding: 4rem 0;
    // background: #f9fafb;
    margin: 0 -2rem;
    padding: 4rem 2rem;

    .bio-content {
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

      .bio-text {
        margin-bottom: 3rem;

        p {
          font-size: 1.125rem;
          text-align: justify;
          line-height: 1.8;
          color: #4b5563;
          margin-bottom: 1.5rem;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        margin-bottom: 3rem;

        @media (max-width: 640px) {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .stat-card {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(79, 70, 229, 0.15);
          }

          .stat-number {
            display: block;
            font-size: 2.5rem;
            font-weight: 800;
            color: #4F46E5;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            display: block;
            font-size: 1rem;
            color: #6b7280;
            font-weight: 500;
          }
        }
      }

      .social-links {
        display: flex;
        gap: 1.5rem;
        justify-content: center;

        .social-link {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          color: #6b7280;
          transition: all 0.3s;
          text-decoration: none;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

          &:hover {
            background: #4F46E5;
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
          }
        }
      }
    }
  }

  .mission-section {
    padding: 4rem 0;
    // background: #f9fafb;
    margin: 0 -2rem;
    padding: 4rem 2rem;

    .mission-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;

      .section-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 1.5rem;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .mission-text {
        text-align: justify;
        font-size: 1.125rem;
        line-height: 1.8;
        color: #4b5563;
      }
    }
  }

  .join-section {
    padding: 6rem 0;
    text-align: center;

    .join-content {
      max-width: 700px;
      margin: 0 auto;

      .join-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 1rem;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .join-text {
        font-size: 1.125rem;
        color: #6b7280;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .join-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .join-btn {
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

export default Team;
