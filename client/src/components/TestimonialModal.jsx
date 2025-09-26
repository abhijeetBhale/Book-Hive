import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { X, Star, User, Briefcase } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TestimonialModal = ({ onClose, onSubmit }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: '',
    review: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingClick = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.review.trim()) {
      toast.error('Please write your testimonial');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please provide your title/role');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success('Thank you for your testimonial! It will be reviewed and added soon.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit testimonial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Share Your Experience</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="testimonial-form">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Your Title/Role</label>
              <div className="input-wrapper">
                <Briefcase size={18} className="input-icon" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Book Enthusiast, Teacher, Student"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Your Rating</label>
              <div className="rating-wrapper">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
                    onClick={() => handleRatingClick(star)}
                  >
                    <Star size={24} />
                  </button>
                ))}
                <span className="rating-text">({formData.rating}/5)</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="review">Your Testimonial</label>
              <textarea
                id="review"
                name="review"
                value={formData.review}
                onChange={handleChange}
                placeholder="Share your experience with BookHive. What do you love about the platform? How has it helped you connect with other readers?"
                rows={5}
                required
              />
              <div className="char-count">
                {formData.review.length}/500 characters
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Testimonial'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    padding: 0;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1rem 2rem;
    border-bottom: 1px solid #e5e7eb;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #f3f4f6;
    }
  }

  .testimonial-form {
    padding: 1rem 2rem 2rem 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    .input-icon {
      position: absolute;
      left: 1rem;
      color: #9ca3af;
      pointer-events: none;
      z-index: 1;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      color: #111827;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: #4F46E5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
    }
  }

  .rating-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    .star-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #d1d5db;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: color 0.2s;

      &.active {
        color: #fbbf24;
      }

      &:hover {
        color: #fbbf24;
      }
    }

    .rating-text {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
  }

  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    color: #111827;
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: #4F46E5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
  }

  .char-count {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #6b7280;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
  }

  .submit-btn {
    padding: 0.75rem 1.5rem;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: #4338CA;
    }

    &:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  }
`;

export default TestimonialModal;