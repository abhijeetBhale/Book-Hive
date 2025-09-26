import React from 'react';
import styled from 'styled-components';

const TermsOfService = () => {
  return (
    <StyledWrapper>
      <div className="content-container">
        <h1 className="main-title">Terms of Service for BookHive</h1>
        <p className="last-updated">Last Updated: September 2, 2025</p>
        
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
          <h2>5. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
        </section>
      </div>
    </StyledWrapper>
  );
};

// Styles are identical to Privacy Policy for consistency
const StyledWrapper = styled.div`
  padding: 6rem 2rem 4rem 2rem;
  background-color: #f9fafb;
  font-family: 'Inter', sans-serif;
  color: #374151;
  line-height: 1.8;

  .content-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 3rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
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