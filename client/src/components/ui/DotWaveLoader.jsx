import React from 'react';
import styled from 'styled-components';
import { BookOpen, Users, MapPin, MessageCircle, UserCheck } from 'lucide-react';

const DotWaveLoader = ({ size = 50, color = '#956afa', speed = 2.5 }) => {
  const loadingItems = [
    { icon: BookOpen, text: 'books' },
    { icon: Users, text: 'users' },
    { icon: MessageCircle, text: 'chats' },
    { icon: MapPin, text: 'locations' },
    { icon: UserCheck, text: 'profiles' }
  ];

  const itemCount = loadingItems.length;
  // Determine the delay slice based on total items to create a perfect loop
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
                    // Stagger animations so they overlap perfectly
                    animationDelay: `${index * speed}s` 
                  }}
                >
                  <div className="icon-wrapper">
                    <IconComponent className="loading-icon" />
                  </div>
                  {/* <span className="item-text">{item.text}</span> */}
                </div>
              );
            })}
          </div>
          {/* <div className="loading-text">loading</div> */}
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
    gap: 12px;
  }

  /* Fixed Container to prevent layout jumps */
  .items-container {
    position: relative;
    width: ${props => Math.max(80, props.size * 1.6)}px;
    height: ${props => Math.max(80, props.size * 1.6)}px;
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
    gap: 10px;

    /* Initial state hidden */
    opacity: 0;
    transform: scale(0.9);
    filter: blur(4px);

    /* Animation */
    animation-name: smoothMorph;
    animation-duration: ${props => props.$duration}s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* Smooth standard ease */
    animation-iteration-count: infinite;
  }

  // .icon-wrapper {
  //   width: ${props => Math.max(48, props.size)}px;
  //   height: ${props => Math.max(48, props.size)}px;
  //   // border-radius: 50%;
  //   /* Subtle gradient background */
  //   // background: linear-gradient(135deg, ${props => props.color}10, ${props => props.color}20);
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   border: 1px solid ${props => props.color}20;
  //   box-shadow: 0 4px 15px ${props => props.color}15;
  // }

  .loading-icon {
    width: ${props => Math.max(70, props.size * 2.5)}px;
    height: ${props => Math.max(70, props.size * 2.5)}px;
    color: ${props => props.color};
  }

  .item-text {
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: ${props => props.color};
    letter-spacing: 0.5px;
    opacity: 0.8;
  }

  .loading-text {
    font-family: "Poppins", sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: rgb(150, 150, 150);
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-top: 10px;
  }

  /* MORPHING KEYFRAMES
    Calculated for N items. 
    We want the item to fade IN, stay briefly, then fade OUT.
    100% / 5 items = 20% "slice" per item.
  */
  @keyframes smoothMorph {
    0% {
      opacity: 0;
      transform: scale(0.95); /* Slight shrink */
      filter: blur(5px);      /* Blurry start */
    }
    
    /* FAST ENTRY: 0% to 5% of total time */
    ${props => 100 / props.$count * 0.9}% {
      opacity: 1;
      transform: scale(1);
      filter: blur(0px);      /* Sharp focus */
    }

    /* HOLD: 5% to 15% of total time */
    ${props => 100 / props.$count * 1}% {
      opacity: 1;
      transform: scale(1);
      filter: blur(0px);
    }

    /* SLOW EXIT: 15% to 20% of total time */
    ${props => 100 / props.$count}% {
      opacity: 0;
      transform: scale(1.05); /* Slight expansion on exit */
      filter: blur(4px);      /* Blur out to 'morph' into next */
    }
    
    100% {
      opacity: 0;
      transform: scale(1.05);
    }
  }
`;

export default DotWaveLoader;