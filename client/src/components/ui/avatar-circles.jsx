import { memo } from 'react';
import styled from 'styled-components';

const AvatarCircles = memo(({ numPeople, avatarUrls, className, onAvatarClick }) => {
  return (
    <AvatarContainer className={className}>
      <AvatarList>
        {avatarUrls.slice(0, 6).map((avatar, index) => (
          <AvatarItem key={index} $index={index}>
            <AvatarButton 
              onClick={() => onAvatarClick && onAvatarClick(avatar)}
              title={avatar.userName ? `View ${avatar.userName}'s profile` : 'View profile'}
            >
              <AvatarImage 
                src={avatar.imageUrl} 
                alt={avatar.userName || `Avatar ${index + 1}`}
              />
            </AvatarButton>
          </AvatarItem>
        ))}
        {numPeople > 6 && (
          <AvatarItem $index={6}>
            <AvatarMore>
              +{numPeople - 6}
            </AvatarMore>
          </AvatarItem>
        )}
      </AvatarList>
    </AvatarContainer>
  );
});

AvatarCircles.displayName = 'AvatarCircles';

const AvatarContainer = styled.div`
  display: flex;
  align-items: center;
`;

const AvatarList = styled.div`
  display: flex;
  align-items: center;
`;

const AvatarItem = styled.div`
  position: relative;
  margin-left: ${props => props.$index === 0 ? '0' : '-8px'};
  z-index: ${props => 10 - props.$index};
`;

const AvatarButton = styled.button`
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    z-index: 20;
  }
`;

const AvatarImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid white;
  object-fit: cover;
  background-color: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const AvatarMore = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid white;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export { AvatarCircles };