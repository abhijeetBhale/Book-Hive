import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Loader, AtSign, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import SEO from '../components/SEO';
import { PAGE_SEO } from '../utils/seo';

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.72 15.93 16.92 17.21 15.61 18.06V20.69H19.5C21.49 18.88 22.56 15.89 22.56 12.25Z" fill="#4285F4" />
    <path d="M12 23C15.08 23 17.73 21.93 19.5 20.14L15.61 17.51C14.58 18.22 13.38 18.63 12 18.63C9.43 18.63 7.23 16.95 6.38 14.6H2.38V17.22C4.24 20.73 7.82 23 12 23Z" fill="#34A853" />
    <path d="M6.38 14.05C6.13 13.35 6 12.6 6 11.85C6 11.1 6.13 10.35 6.38 9.65V7.03H2.38C1.52 8.63 1 10.19 1 11.85C1 13.51 1.52 15.07 2.38 16.67L6.38 14.05Z" fill="#FBBC05" />
    <path d="M12 5.38C13.51 5.38 14.83 5.91 15.85 6.86L19.58 3.25C17.73 1.56 15.08 0.5 12 0.5C7.82 0.5 4.24 2.77 2.38 6.28L6.38 8.9C7.23 6.55 9.43 4.88 12 4.88V5.38Z" fill="#EA4335" />
  </svg >
);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      navigate('/');
    } catch (error) {
      // Login error handled by toast
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Get current origin (e.g., http://localhost:5173 or https://book-hive-frontend.onrender.com)
    const redirectUrl = window.location.origin;

    // Construct Google OAuth URL with redirect parameter
    const googleLoginUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;

    // Redirect to backend Google OAuth endpoint
    window.location.href = googleLoginUrl;
  };

  return (
    <>
      <SEO
        title={PAGE_SEO.login.title}
        description={PAGE_SEO.login.description}
        keywords={PAGE_SEO.login.keywords}
        url={PAGE_SEO.login.url}
      />
      <StyledWrapper>
        <div className="login-container">
          <div className="form-panel">
            <div className="form-header">
              <h1 className="title">Welcome Back!</h1>
              <p className="subtitle">Sign in to continue to your BookHive account.</p>
            </div>

            <button type="button" className="google-btn" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="separator">
              <span>Or sign in with your email</span>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="input-field">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <AtSign size={18} className="input-icon" />
                  <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-field">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" tabIndex={-1} className="forgot-password-link">Forgot password?</Link>
                </div>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="signup-link">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </div>

          <div className="image-panel">
            <div className="image-overlay-text">
              <p>CREATE.</p>
              <p>ENGAGE.</p>
              <p>UNITE.</p>
            </div>
          </div>
        </div>
      </StyledWrapper>
    </>
  );
};

// --- STYLES (UNCHANGED) ---
const StyledWrapper = styled.div`
  min-height: 100vh;
  margin-top: -20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
  padding: 2rem;

  .login-container {
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
  }
  
  .form-header {
  text-align: center;
    margin-bottom: 2rem;
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
  }
  
  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: white;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f9fafb;
    }
  }

  .separator {
    display: flex;
    align-items: center;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
    margin: 2rem 0;

    &::before, &::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e5e7eb;
    }
    span {
      padding: 0 1rem;
    }
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

  .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .forgot-password-link {
    font-size: 0.875rem;
    font-weight: 600;
    color: #4F46E5;
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
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
  
  #password {
      padding-right: 3rem;
  }

  .password-toggle-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
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

  .signup-link {
    text-align: center;
    margin-top: auto;
    padding-top: 2rem;
    font-size: 0.875rem;
    color: #4b5563;

    a {
      color: #4F46E5;
      font-weight: 600;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .image-panel {
    background-image: url('https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
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

export default Login;