import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <StyledWrapper>
      <div className="content-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Back to Home
        </Link>
        <h1 className="main-title">Terms of Service for BookHive</h1>
        <p className="last-updated">Last Updated: January 2025</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the BookHive application (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.</p>
        </section>

        <section>
          <h2>2. User Accounts</h2>
          <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
        </section>

        <section>
          <h2>3. User Conduct</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Post any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable.</li>
            <li>Misrepresent your identity or your book collection.</li>
            <li>Engage in any activity that interferes with or disrupts the Service.</li>
            <li>Attempt to harm other users or the BookHive community in any way.</li>
          </ul>
        </section>
        
        <section>
          <h2>4. Book Lending and Borrowing</h2>
          <p>BookHive is a platform to facilitate the sharing of physical books. We are not a party to any transaction or agreement between users.</p>
           <ul>
            <li>Users are solely responsible for the books they lend and borrow.</li>
            <li>We encourage all users to treat borrowed books with care and respect and to arrange for timely returns.</li>
            <li>BookHive is not responsible for any lost, stolen, or damaged books. Any disputes regarding book exchanges must be resolved directly between the users involved.</li>
          </ul>
        </section>
        
        <section>
          <h2>5. Intellectual Property</h2>
          <p>The Service and its original content, features, and functionality are and will remain the exclusive property of BookHive and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of BookHive.</p>
        </section>

        <section>
          <h2>6. Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy. Please review our <Link to="/privacy" style={{color: '#4F46E5', textDecoration: 'underline'}}>Privacy Policy</Link>, which also governs the Service and informs users of our data collection practices.</p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>In no event shall BookHive, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        </section>

        <section>
          <h2>8. Disclaimer</h2>
          <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
        </section>

        <section>
          <h2>9. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <ul>
            <li><strong>Email:</strong> elontomars7@gmail.com</li>
            <li><strong>Phone:</strong> +91 9171119237</li>
            <li><strong>Address:</strong> BookHive HQ, Indore, Madhya Pradesh</li>
          </ul>
        </section>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  padding: 6rem 2rem 4rem 2rem;
  background-color: #f9fafb;
  font-family: 'Inter', sans-serif;
  color: #374151;
  line-height: 1.8;
  min-height: 100vh;

  .content-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 3rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;

    @media (max-width: 768px) {
      padding: 2rem 1.5rem;
    }
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    text-decoration: none;
    font-size: 0.875rem;
    margin-bottom: 2rem;
    transition: color 0.2s;

    &:hover {
      color: #4F46E5;
    }
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .last-updated {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 2.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1.5rem;
  }
  
  section {
    margin-bottom: 2.5rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1rem;
  }

  ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

export default TermsOfService;