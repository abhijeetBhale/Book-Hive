import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { organizerAPI } from '../utils/api';
import styled from 'styled-components';
import { Building2, Mail, Phone, Globe, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const BecomeOrganizer = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'community',
    contactEmail: user?.email || '',
    contactPhone: '',
    website: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      await organizerAPI.applyAsOrganizer(formData);
      toast.success('Application submitted successfully! We will review it shortly.');
      navigate('/');
    } catch (error) {
      console.error('Application failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="container">
        <div className="header">
          <h1>Become an Event Organizer</h1>
          <p>Join our community of event organizers and start hosting book-related events</p>
        </div>

        <div className="content">
          <div className="info-section">
            <h2>Why Become an Organizer?</h2>
            <ul>
              <li>Create and manage book-related events</li>
              <li>Reach a community of passionate readers</li>
              <li>Track registrations and attendance</li>
              <li>Build your organization's presence</li>
              <li>Connect with book lovers in your area</li>
            </ul>

            <div className="requirements">
              <h3>Requirements</h3>
              <p>To become an organizer, you need to:</p>
              <ul>
                <li>Represent a legitimate organization or community group</li>
                <li>Provide valid contact information</li>
                <li>Agree to our community guidelines</li>
                <li>Have a verified BookHive account</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="application-form">
            <h2>Application Form</h2>

            <div className="form-group">
              <label>
                <Building2 size={18} />
                Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                required
                placeholder="Enter your organization name"
              />
            </div>

            <div className="form-group">
              <label>
                <Building2 size={18} />
                Organization Type *
              </label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                required
              >
                <option value="community">Community Group</option>
                <option value="library">Library</option>
                <option value="bookstore">Bookstore</option>
                <option value="educational">Educational Institution</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                placeholder="organization@example.com"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={18} />
                Contact Phone *
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label>
                <Globe size={18} />
                Website (Optional)
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourorganization.com"
              />
            </div>

            <div className="form-group">
              <label>
                <FileText size={18} />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Tell us about your organization and why you want to become an event organizer..."
                maxLength="1000"
              />
              <small>{formData.description.length}/1000 characters</small>
            </div>

            <div className="terms">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>
                  I agree to the BookHive Terms of Service and Community Guidelines. 
                  I understand that my application will be reviewed by the admin team.
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? (
                <>
                  <Loader className="spinner" size={18} />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;

  .container {
    max-width: 1200px;
    margin: 0 auto;

    .header {
      text-align: center;
      margin-bottom: 3rem;

      h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.75rem;
      }

      p {
        font-size: 1.125rem;
        color: #64748b;
      }
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 2rem;

      .info-section {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        height: fit-content;

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        ul {
          list-style: none;
          padding: 0;

          li {
            padding: 0.75rem 0;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            &:before {
              content: "✓";
              color: #10b981;
              font-weight: 700;
              font-size: 1.25rem;
            }
          }
        }

        .requirements {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;

          h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.75rem;
          }

          p {
            color: #64748b;
            margin-bottom: 0.75rem;
          }
        }
      }

      .application-form {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;

          label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 0.5rem;
          }

          input, select, textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-family: inherit;

            &:focus {
              outline: none;
              border-color: #4F46E5;
            }
          }

          textarea {
            resize: vertical;
          }

          small {
            display: block;
            margin-top: 0.25rem;
            color: #64748b;
            font-size: 0.75rem;
          }
        }

        .terms {
          margin: 2rem 0;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.5rem;

          .checkbox-label {
            display: flex;
            gap: 0.75rem;
            cursor: pointer;

            input[type="checkbox"] {
              margin-top: 0.25rem;
              width: 18px;
              height: 18px;
              cursor: pointer;
            }

            span {
              font-size: 0.875rem;
              color: #475569;
              line-height: 1.5;
            }
          }
        }

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;

          &:hover:not(:disabled) {
            background: #4338ca;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        }
      }
    }
  }

  @media (max-width: 968px) {
    padding: 1rem;

    .container {
      .header h1 {
        font-size: 2rem;
      }

      .content {
        grid-template-columns: 1fr;

        .info-section {
          order: 2;
        }

        .application-form {
          order: 1;
        }
      }
    }
  }
`;

export default BecomeOrganizer;
