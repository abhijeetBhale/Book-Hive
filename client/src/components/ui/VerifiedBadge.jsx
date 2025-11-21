import styled from 'styled-components';
import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 20, className = '' }) => {
  return (
    <StyledBadge className={className} title="Verified Account">
      <BadgeCheck size={size} color="#1a87db" fill="#ffffffff" />
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
