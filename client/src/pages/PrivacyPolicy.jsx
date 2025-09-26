import React from 'react';
import styled from 'styled-components';

const PrivacyPolicy = () => {
  return (
    <StyledWrapper>
      <div className="content-container">
        <h1 className="main-title">Privacy Policy for BookHive</h1>
        <p className="last-updated">Last Updated: September 2, 2025</p>
        
        <section>
          <h2>1. Introduction</h2>
          <p>Welcome to BookHive ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. By using BookHive, you agree to the collection and use of information in accordance with this policy.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
          <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, username, email address, and profile picture, that you voluntarily give to us when you register with the application.</li>
            <li><strong>Location Data:</strong> We collect your geographic location when you choose to provide it. This is essential for the core functionality of connecting you with nearby users on the map. Your exact address is never displayed to other users; only a generalized area is shown.</li>
            <li><strong>Book Data:</strong> Information you provide about the books you own, including title, author, condition, and availability status.</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Display your profile and book collection to other users in your general vicinity.</li>
            <li>Facilitate book borrowing requests between users.</li>
            <li>Email you regarding your account or borrow requests.</li>
            <li>Monitor and analyze usage and trends to improve your experience.</li>
          </ul>
        </section>
        
        <section>
          <h2>4. Data Security</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
        </section>

         <section>
          <h2>5. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at: support@bookhive.app</p>
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

export default PrivacyPolicy;