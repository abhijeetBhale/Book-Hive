import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Loader, AtSign, ArrowLeft } from 'lucide-react';
// import { authAPI } from '../utils/api'; // You would uncomment this to connect to your actual API

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real application, you would call your API here:
      // await authAPI.sendResetLink({ email });

      // We'll simulate the API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('If an account with that email exists, a reset link has been sent.');
      setSubmitted(true); // Show a confirmation message
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="container">
        <div className="form-panel">

          {submitted ? (
            <div className="confirmation-view">
              <h1 className="title">Check Your Email</h1>
              <p className="subtitle">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.</p>
              <Link to="/login" className="back-link">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h1 className="title">Forgot Password?</h1>
                <p className="subtitle">No worries! Enter your email below and we'll send you a link to reset your password.</p>
              </div>

              <form className="form" onSubmit={handleSubmit}>
                <div className="input-field">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <AtSign size={18} className="input-icon" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? <Loader className="animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>

              <p className="login-link">
                <Link to="/login" className="text-link">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </p>
            </>
          )}

        </div>

        <div className="image-panel">
          <div className="image-overlay-text">
            <p>RECLAIM.</p>
            <p>RESET.</p>
            <p>RETURN.</p>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

// --- STYLES (MATCHING LOGIN/REGISTER) ---
const StyledWrapper = styled.div`
  min-height: 100vh;
  margin-top: -20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
  padding: 2rem;

  .container {
    display: grid;
    grid-template-columns: 1fr;
    max-width: 1200px;
    width: 100%;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
    @media (min-width: 1024px) {
      grid-template-columns: 550px 1fr;
    }
  }

  .form-panel {
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .form-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  
  .title {
    font-size: 2.25rem;
    font-weight: 800;
    color: #111827;
  }

  .subtitle {
      font-size: 1rem;
      color: #4b5563;
      margin-top: 0.5rem;
      max-width: 350px;
      margin-left: auto;
      margin-right: auto;
  }
  
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    font-size: 1rem;
    color: #111827;
    transition: border-color 0.2s, box-shadow 0.2s;
    
    &:focus {
      outline: none;
      border-color: #4F46E5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }

  .input-wrapper input {
    padding-left: 2.75rem;
  }

  .submit-btn {
    margin-top: 0.5rem;
    background-color: #111827;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.875rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background-color: #374151;
    }
    &:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  }

  .login-link, .back-link {
    // width: 100%;
    text-align: center;
    margin-top: auto;
    padding-top: 2rem;
    font-size: 0.875rem;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    .text-link {
      color: #4F46E5;
      font-weight: 600;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .confirmation-view {
    text-align: center;
  }

  .image-panel {
    background-image: url('https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
    background-size: cover;
    background-position: center;
    display: none;
    position: relative;
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: rgba(17, 24, 39, 0.3);
    }
    @media (min-width: 768px) {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
    }
  }
  
  .image-overlay-text {
      position: relative;
      z-index: 1;
      padding: 3rem;
      p {
          font-size: 3rem;
          font-weight: 900;
          color: white;
          line-height: 1.1;
          letter-spacing: 0.1em;
      }
  }
`;

export default ForgotPassword;