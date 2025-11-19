import React from 'react';
import { CheckCircle } from 'lucide-react';
import styled from 'styled-components';

const VerifiedBadge = ({ size = 16, className = '' }) => {
  return (
    <StyledBadge className={className} title="Verified Account">
      <CheckCircle size={size} fill="#3b82f6" color="white" />
    </StyledBadge>
  );
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  
  svg {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
`;

export default VerifiedBadge;
