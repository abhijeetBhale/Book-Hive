import React from 'react';
import styled from 'styled-components';
import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 20, className = '' }) => {
  return (
    <StyledBadge className={className} title="Verified Account">
      <BadgeCheck 
        size={size} 
        color="#1a87db" 
        fill="#ffffff" 
        strokeWidth={2}
        style={{ display: 'block' }}
      />
    </StyledBadge>
  );
};

const StyledBadge = styled.span`
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  flex-shrink: 0;
  line-height: 1;
  vertical-align: middle;
  position: relative;
  z-index: 1;
  
  svg {
    display: block !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    flex-shrink: 0;
    pointer-events: none;
  }
`;

export default VerifiedBadge;
