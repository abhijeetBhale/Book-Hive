import React from 'react';
import styled from 'styled-components';
import { BookOpen, Users, MapPin, MessageCircle, UserCheck } from 'lucide-react';

const DotWaveLoader = ({ size = 50, color = '#956afa', speed = 1.8 }) => {
  const loadingItems = [
    { icon: BookOpen, text: 'books' },
    { icon: Users, text: 'users' },
    { icon: MessageCircle, text: 'chats' },
    { icon: MapPin, text: 'locations' },
    { icon: UserCheck, text: 'profiles' }
  ];

  const itemCount = loadingItems.length;
  // Optimized animation duration for faster loading perception
  const animationDuration = speed * itemCount; 

  return (
    <StyledWrapper 
      size={size} 
      color={color} 
      $duration={animationDuration} 
      $count={itemCount}
    >
      <div className="card">
        <div className="loader">
          <div className="items-container">
            {loadingItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={index} 
                  className="loading-item"
                  style={{ 
                    // Faster stagger for quicker perception
                    animationDelay: `${index * (speed * 0.8)}s` 
                  }}
                >
                  <div className="icon-wrapper">
                    <IconComponent className="loading-icon" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  --bg-color: transparent;
  
  .card {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px; /* Reduced gap */
  }

  /* Optimized container size */
  .items-container {
    position: relative;
    width: ${props => Math.max(60, props.size * 1.2)}px; /* Smaller container */
    height: ${props => Math.max(60, props.size * 1.2)}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px; /* Reduced gap */

    /* Initial state hidden */
    opacity: 0;
    transform: scale(0.9);
    filter: blur(3px); /* Reduced blur */

    /* Optimized animation */
    animation-name: smoothMorph;
    animation-duration: ${props => props.$duration}s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-iteration-count: infinite;
  }

  .loading-icon {
    width: ${props => Math.max(50, props.size * 2)}px; /* Smaller icons */
    height: ${props => Math.max(50, props.size * 2)}px;
    color: ${props => props.color};
    /* Optimized for performance */
    will-change: transform, opacity;
  }

  /* OPTIMIZED MORPHING KEYFRAMES - Faster transitions */
  @keyframes smoothMorph {
    0% {
      opacity: 0;
      transform: scale(0.95);
      filter: blur(4px);
    }
    
    /* FASTER ENTRY: 0% to 3% of total time */
    ${props => 100 / props.$count * 0.6}% {
      opacity: 1;
      transform: scale(1);
      filter: blur(0px);
    }

    /* SHORTER HOLD: 3% to 12% of total time */
    ${props => 100 / props.$count * 0.8}% {
      opacity: 1;
      transform: scale(1);
      filter: blur(0px);
    }

    /* FASTER EXIT: 12% to 20% of total time */
    ${props => 100 / props.$count}% {
      opacity: 0;
      transform: scale(1.05);
      filter: blur(3px);
    }
    
    100% {
      opacity: 0;
      transform: scale(1.05);
    }
  }
`;

export default DotWaveLoader;