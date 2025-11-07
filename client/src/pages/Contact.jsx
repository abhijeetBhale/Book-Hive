import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { contactAPI } from '../utils/api';
import { Mail, Phone, MapPin, Send, ArrowLeft } from 'lucide-react';

const Contact = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    budget: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await contactAPI.submitContactForm(contactForm);
      alert(response.message || 'Thank you for contacting us! We will get back to you soon.');
      
      // Reset form
      setContactForm({
        name: '',
        email: '',
        phone: '',
        service: '',
        budget: '',
        message: ''
      });
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      alert(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="contact-container">
        <div className="back-link">
          <Link to="/">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="contact-content">
          <div className="contact-left">
            <h1 className="main-title">GET IN TOUCH</h1>
            <p className="subtitle">Contact us if you have any projects in mind</p>

            <div className="contact-info-section">
              <div className="info-item">
                <Mail className="info-icon" />
                <div>
                  <h3>Email</h3>
                  <a href="mailto:elontomars7@gmail.com">elontomars7@gmail.com</a>
                </div>
              </div>

              <div className="info-item">
                <Phone className="info-icon" />
                <div>
                  <h3>Phone</h3>
                  <a href="tel:+919171119237">+91 9171119237</a>
                </div>
              </div>

              <div className="info-item">
                <MapPin className="info-icon" />
                <div>
                  <h3>Location</h3>
                  <p>BookHive HQ, Indore, Madhya Pradesh</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-right">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="NAME"
                  value={contactForm.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="EMAIL"
                  value={contactForm.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  placeholder="PHONE (Optional)"
                  value={contactForm.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <select
                    name="service"
                    value={contactForm.service}
                    onChange={handleChange}
                  >
                    <option value="">SERVICE</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group half">
                  <select
                    name="budget"
                    value={contactForm.budget}
                    onChange={handleChange}
                  >
                    <option value="">PROJECT BUDGET</option>
                    <option value="small">Small ($0 - $1,000)</option>
                    <option value="medium">Medium ($1,000 - $5,000)</option>
                    <option value="large">Large ($5,000+)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <textarea
                  name="message"
                  placeholder="MESSAGE"
                  value={contactForm.message}
                  onChange={handleChange}
                  required
                  rows="5"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'SENDING...' : 'GET IN TOUCH'}
              </button>
            </form>
          </div>
        </div>

        <footer className="contact-footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-links">
                <Link to="/">ABOUT</Link>
                {/* <Link to="/">SERVICES</Link> */}
                {/* <Link to="/books">OUR WORK</Link> */}
                {/* <Link to="/contact">GET IN TOUCH</Link> */}
                <Link to="/terms">TERMS</Link>
                <Link to="/privacy">PRIVACY POLICY</Link>
              </div>
              <p className="copyright">BookHive 2025. All rights reserved</p>
            </div>

            <div className="footer-right">
              <a href="mailto:elontomars7@gmail.com" className="footer-email">
                elontomars7@gmail.com
              </a>
              <div className="social-links">
                <a href="#" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  background: white;
  color: #374151;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  .contact-container {
    max-width: 1400px;
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
        color: #5446E6;
      }
    }
  }

  .contact-content {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 4rem;
    margin-bottom: 4rem;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: 3rem;
    }
  }

  .contact-left {
    .main-title {
      font-size: 4rem;
      font-weight: 900;
      background: linear-gradient(135deg, #5446E6 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      line-height: 1.1;

      @media (max-width: 768px) {
        font-size: 3rem;
      }
    }

    .subtitle {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 3rem;
    }

    .contact-info-section {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;

      .info-icon {
        width: 24px;
        height: 24px;
        color: #5446E6;
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #9ca3af;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      a, p {
        color: #374151;
        text-decoration: none;
        font-size: 1.125rem;
        transition: color 0.2s;

        &:hover {
          color: #5446E6;
        }
      }

      p {
        margin: 0;
      }
    }
  }

  .contact-right {
    .contact-form {
      .form-group {
        margin-bottom: 1.5rem;

        &.half {
          margin-bottom: 0;
        }

        input,
        textarea,
        select {
          width: 100%;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: all 0.3s;
          font-family: inherit;

          &::placeholder {
            color: #9ca3af;
            text-transform: uppercase;
          }

          &:focus {
            outline: none;
            border-color: #5446E6;
            background: white;
            box-shadow: 0 0 0 3px rgba(84, 70, 230, 0.1);
          }
        }

        select {
          cursor: pointer;
          text-transform: uppercase;
          color: #6b7280;

          option {
            background: white;
            color: #374151;
          }
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 1.5rem;

        @media (max-width: 640px) {
          grid-template-columns: 1fr;
        }
      }

      .submit-btn {
        width: 100%;
        padding: 1.25rem 2rem;
        background: linear-gradient(135deg, #5446E6 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 0.875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 10px 30px rgba(84, 70, 230, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(84, 70, 230, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }

  .contact-footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 3rem;
    margin-top: 4rem;

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 2rem;
      }
    }

    .footer-left {
      .footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        margin-bottom: 2rem;

        a {
          color: #6b7280;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s;

          &:hover {
            color: #5446E6;
          }
        }
      }

      .copyright {
        color: #9ca3af;
        font-size: 0.875rem;
      }
    }

    .footer-right {
      text-align: right;

      @media (max-width: 768px) {
        text-align: left;
      }

      .footer-email {
        display: block;
        color: #374151;
        text-decoration: none;
        font-size: 1.125rem;
        margin-bottom: 1rem;
        transition: color 0.2s;

        &:hover {
          color: #5446E6;
        }
      }

      .social-links {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;

        @media (max-width: 768px) {
          justify-content: flex-start;
        }

        a {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 50%;
          color: #6b7280;
          transition: all 0.3s;

          &:hover {
            background: #5446E6;
            color: white;
            transform: translateY(-2px);
          }
        }
      }
    }
  }
`;

export default Contact;
