import React from 'react';
import styled from 'styled-components';
import { CheckCircle } from 'lucide-react';

const ContactVerifiedBadge = ({ size = 16, className = '' }) => {
  return (
    <StyledBadge className={className} title="Contact Verified">
      <CheckCircle size={size} />
      <span>Contact Verified</span>
    </StyledBadge>
  );
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
  padding: 2px 8px;
  background: #d1fae5;
  border-radius: 12px;
  
  svg {
    flex-shrink: 0;
  }
`;

export default ContactVerifiedBadge;
