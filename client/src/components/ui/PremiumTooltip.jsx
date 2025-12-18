import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const TooltipContent = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 10000;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${fadeIn} 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  max-width: 200px;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-bottom-color: #374151;
    margin-bottom: -1px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 3px solid transparent;
    border-bottom-color: #1f2937;
    z-index: 1;
  }
`;

const PremiumTooltip = ({ children, text, delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [leaveTimeoutId, setLeaveTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    // Clear any pending leave timeout
    if (leaveTimeoutId) {
      clearTimeout(leaveTimeoutId);
      setLeaveTimeoutId(null);
    }
    
    // Clear any existing enter timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    // Clear enter timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // Add small delay before hiding to prevent flickering
    const leaveId = setTimeout(() => {
      setIsVisible(false);
    }, 50);
    setLeaveTimeoutId(leaveId);
  };

  return (
    <TooltipWrapper
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && <TooltipContent>{text}</TooltipContent>}
    </TooltipWrapper>
  );
};

export default PremiumTooltip;