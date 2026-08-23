import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Loader, User, AtSign, Eye, EyeOff, CheckSquare, Square, KeyRound, Check, XCircle } from 'lucide-react';
import { authAPI } from '../utils/api';
import SEO from '../components/SEO';
import { PAGE_SEO } from '../utils/seo';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const normalizeHandle = (value) => value.trim().replace(/^@+/, '').toLowerCase();
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.72 15.93 16.92 17.21 15.61 18.06V20.69H19.5C21.49 18.88 22.56 15.89 22.56 12.25Z" fill="#4285F4" />
    <path d="M12 23C15.08 23 17.73 21.93 19.5 20.14L15.61 17.51C14.58 18.22 13.38 18.63 12 18.63C9.43 18.63 7.23 16.95 6.38 14.6H2.38V17.22C4.24 20.73 7.82 23 12 23Z" fill="#34A853" />
    <path d="M6.38 14.05C6.13 13.35 6 12.6 6 11.85C6 11.1 6.13 10.35 6.38 9.65V7.03H2.38C1.52 8.63 1 10.19 1 11.85C1 13.51 1.52 15.07 2.38 16.67L6.38 14.05Z" fill="#FBBC05" />
    <path d="M12 5.38C13.51 5.38 14.83 5.91 15.85 6.86L19.58 3.25C17.73 1.56 15.08 0.5 12 0.5C7.82 0.5 4.24 2.77 2.38 6.28L6.38 8.9C7.23 6.55 9.43 4.88 12 4.88V5.38Z" fill="#EA4335" />
  </svg>
);


const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState({ status: 'idle', message: '' });
  const [nameCheck, setNameCheck] = useState({ status: 'idle', message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // The handle input is intentionally named "handle" (not "username") so
    // browsers don't treat this signup form as a login/credentials form
    if (name === 'handle') {
      setFormData({ ...formData, username: normalizeHandle(value).replace(/\s+/g, '_') });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // Debounced live username availability check
  useEffect(() => {
    const handle = normalizeHandle(formData.username);

    if (!handle) {
      setUsernameCheck({ status: 'idle', message: '' });
      return undefined;
    }

    if (!USERNAME_REGEX.test(handle)) {
      setUsernameCheck({
        status: 'invalid',
        message: handle.length < 3
          ? 'Username must be at least 3 characters'
          : handle.length > 20
            ? 'Username cannot exceed 20 characters'
            : 'Only letters, numbers, and underscores allowed',
      });
      return undefined;
    }

    setUsernameCheck({ status: 'checking', message: 'Checking availability...' });

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await authAPI.checkUsername(handle, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.available) {
          setUsernameCheck({ status: 'available', message: data.message });
        } else {
          setUsernameCheck({ status: data.reason === 'invalid' ? 'invalid' : 'taken', message: data.message || 'This username is not available' });
        }
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        setUsernameCheck({ status: 'error', message: 'Could not verify username. Try again.' });
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [formData.username]);

  // Debounced live display-name (Full Name) community-standards check
  useEffect(() => {
    const fullName = formData.fullName.trim();

    if (!fullName) {
      setNameCheck({ status: 'idle', message: '' });
      return undefined;
    }

    if (fullName.length < 2 || fullName.length > 50) {
      setNameCheck({
        status: 'invalid',
        message: fullName.length < 2 ? 'Name must be at least 2 characters' : 'Name must not exceed 50 characters',
      });
      return undefined;
    }

    setNameCheck({ status: 'checking', message: '' });

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await authAPI.checkDisplayName(fullName, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.valid) {
          setNameCheck({ status: 'valid', message: data.message || 'Name looks good' });
        } else {
          setNameCheck({ status: 'invalid', message: data.message || 'This name is not allowed' });
        }
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        // Silent fail - server re-validates on submit anyway
        setNameCheck({ status: 'idle', message: '' });
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [formData.fullName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("You must agree to the Privacy Policy and Terms of Service.");
      return;
    }
    if (nameCheck.status === 'checking') {
      toast.error('Still validating your name. Please wait a moment.');
      return;
    }
    if (nameCheck.status === 'invalid') {
      toast.error(nameCheck.message || 'Please use a different name.');
      return;
    }
    if (usernameCheck.status === 'checking') {
      toast.error('Still checking username availability. Please wait a moment.');
      return;
    }
    if (usernameCheck.status !== 'available') {
      toast.error(usernameCheck.message || 'Please choose an available username.');
      return;
    }
    setLoading(true);

    try {
      const { fullName, username, email, password } = formData;
      await authAPI.register({ name: fullName, username: normalizeHandle(username), email, password });
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
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
        title={PAGE_SEO.register.title}
        description={PAGE_SEO.register.description}
        keywords={PAGE_SEO.register.keywords}
        url={PAGE_SEO.register.url}
      />
      <StyledWrapper>
        <div className="register-container">
          <div className="form-panel">
            <div className="form-header">
              <h1 className="title">Create account</h1>
            </div>

            <button type="button" className="google-btn" onClick={handleGoogleRegister}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="separator">
              <span>Or fill in the form to create an account</span>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="input-grid">
                <div className="input-field">
                  <label htmlFor="fullName">Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      className={
                        nameCheck.status === 'valid' ? 'input-valid'
                          : nameCheck.status === 'invalid' ? 'input-error'
                          : ''
                      }
                    />
                    {nameCheck.status === 'checking' && <Loader size={16} className="username-spinner animate-spin" />}
                    {nameCheck.status === 'valid' && <Check size={18} className="status-icon success" />}
                    {nameCheck.status === 'invalid' && <XCircle size={18} className="status-icon error" />}
                  </div>
                  {nameCheck.status === 'invalid' && nameCheck.message && (
                    <p className={`username-status ${nameCheck.status}`}>
                      {nameCheck.message}
                    </p>
                  )}
                </div>
                <div className="input-field">
                  <label htmlFor="handle">Username</label>
                  <div className="input-wrapper">
                    <AtSign size={18} className="input-icon" />
                    {/* Named "handle" + autofill opt-outs so password managers
                        don't offer to "manage your password" on this field */}
                    <input
                      id="handle"
                      name="handle"
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      className={
                        usernameCheck.status === 'available' ? 'input-valid'
                          : (usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') ? 'input-error'
                          : ''
                      }
                    />
                    {usernameCheck.status === 'checking' && <Loader size={16} className="username-spinner animate-spin" />}
                    {usernameCheck.status === 'available' && <Check size={18} className="status-icon success" />}
                    {(usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') && <XCircle size={18} className="status-icon error" />}
                  </div>
                  {usernameCheck.message && (
                    <p className={`username-status ${usernameCheck.status}`}>
                      {usernameCheck.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="input-field">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <AtSign size={18} className="input-icon" />
                    <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
                </div>
              </div>

              <div className="input-field">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={formData.password} onChange={handleChange} required minLength="8" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="terms-check">
                <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)} className="checkbox-btn">
                  {agreedToTerms ? <CheckSquare size={20} className="checked" /> : <Square size={20} />}
                </button>
                <label>
                  I agree to <Link to="/privacy" target="_blank" className="text-link">Privacy Policy</Link> and <Link to="/terms" target="_blank" className="text-link">Terms of Service</Link>.
                </label>
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : 'Continue'}
              </button>
            </form>

            <p className="login-link">
              Already have an account? <Link to="/login" className="text-link">Log In</Link>
            </p>
          </div>

          <div className="image-panel">
            <div className="image-overlay-text">
              <p>SHARE.</p>
              <p>DISCOVER.</p>
              <p>CONNECT.</p>
            </div>
          </div>
        </div>
      </StyledWrapper>
    </>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  margin-top: -20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
  padding: 2rem;

  .register-container {
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
    margin-bottom: 2rem;
  }
  
  .title {
  text-align: center;
    font-size: 2.25rem;
    font-weight: 800;
    color: #111827;
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
    gap: 1.25rem;
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
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

  .input-wrapper input.input-valid {
    border-color: #059669;
    &:focus {
      border-color: #059669;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
    }
  }

  .input-wrapper input.input-error {
    border-color: #dc2626;
    &:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
  }

  .username-spinner {
    position: absolute;
    right: 0.75rem;
    color: #6b7280;
    pointer-events: none;
  }

  .status-icon {
    position: absolute;
    right: 0.75rem;
    pointer-events: none;

    &.success { color: #059669; }
    &.error { color: #dc2626; }
  }

  .username-status {
    margin: 0;
    font-size: 0.8rem;

    &.checking, &.error { color: #6b7280; }
    &.available { color: #059669; }
    &.taken, &.invalid { color: #dc2626; }
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

  .terms-check {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    label {
      font-size: 0.875rem;
      color: #4b5563;
    }
  }
  
  .text-link {
      color: #4F46E5;
      font-weight: 600;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
  }

  .checkbox-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #9ca3af;
      .checked {
          color: #4F46E5;
      }
  }

  .submit-btn {
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

  .login-link {
    text-align: center;
    margin-top: auto;
    padding-top: 2rem;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .image-panel {
    background-image: url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
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

export default Register;