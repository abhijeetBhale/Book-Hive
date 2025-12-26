import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TooltipContent = styled.div`
  position: fixed;
  padding: 8px 12px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  border-radius: 6px;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  z-index: 99999;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  animation: ${fadeIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  max-width: 200px;
  min-width: 100px;
  width: fit-content;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.025em;
  text-align: center;
  box-sizing: border-box;
  
  /* Ensure text fits properly within the box */
  overflow: hidden;
  display: block;
  
  /* Handle very long text gracefully */
  @media (max-width: 480px) {
    max-width: calc(100vw - 32px);
    font-size: 11px;
  }
  
  /* Subtle glow effect */
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3));
    border-radius: 6px;
    z-index: -1;
    opacity: 0.6;
  }
  
  /* Arrow */
  &::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: ${props => props.$arrowPosition || '50%'};
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-bottom-color: #1e293b;
    filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.2));
  }
`;

const PremiumTooltip = ({ children, text, delay = 200, position = 'bottom' }) => {
  // Ensure text fits well in tooltip - truncate if too long
  const displayText = text && text.length > 60 ? `${text.substring(0, 57)}...` : text;
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState('50%');
  const [timeoutId, setTimeoutId] = useState(null);
  const [leaveTimeoutId, setLeaveTimeoutId] = useState(null);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = () => {
    if (!wrapperRef.current || !tooltipRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;
    let arrowPos = '50%';

    // Calculate vertical position (below the element)
    const spaceBelow = viewportHeight - wrapperRect.bottom;
    const spaceAbove = wrapperRect.top;
    const tooltipHeight = tooltipRect.height || 50; // Increased fallback height for multi-line
    const gap = 8; // Reduced gap for better positioning

    if (position === 'bottom' || spaceBelow >= tooltipHeight + gap) {
      // Position below
      top = wrapperRect.bottom + scrollY + gap;
    } else if (spaceAbove >= tooltipHeight + gap) {
      // Position above if not enough space below
      top = wrapperRect.top + scrollY - tooltipHeight - gap;
    } else {
      // Default to below even if cramped
      top = wrapperRect.bottom + scrollY + gap;
    }

    // Calculate horizontal position with better edge handling
    const tooltipWidth = Math.min(tooltipRect.width || 200, 200); // Ensure max width
    const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
    
    // Try to center the tooltip
    left = wrapperCenter - tooltipWidth / 2;

    // Adjust if tooltip would go off the left edge
    const minLeft = 16; // Increased minimum distance from left edge
    if (left < minLeft) {
      const offset = minLeft - left;
      left = minLeft;
      // Adjust arrow position to point to the element
      const arrowOffset = Math.max(24, Math.min(tooltipWidth - 24, (tooltipWidth / 2) - offset));
      arrowPos = `${arrowOffset}px`;
    }

    // Adjust if tooltip would go off the right edge
    const maxRight = viewportWidth - 16; // Increased minimum distance from right edge
    if (left + tooltipWidth > maxRight) {
      const offset = (left + tooltipWidth) - maxRight;
      left = maxRight - tooltipWidth;
      // Adjust arrow position to point to the element
      const arrowOffset = Math.max(24, Math.min(tooltipWidth - 24, (tooltipWidth / 2) + offset));
      arrowPos = `${arrowOffset}px`;
    }

    // Add scroll offset for horizontal position
    left += scrollX;

    // Ensure minimum bounds with better constraints
    left = Math.max(scrollX + 16, Math.min(scrollX + viewportWidth - tooltipWidth - 16, left));
    top = Math.max(scrollY + 16, top);

    setTooltipPosition({ top, left });
    setArrowPosition(arrowPos);
  };

  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure DOM is updated
      const rafId = requestAnimationFrame(() => {
        calculatePosition();
      });
      
      // Throttle function for better performance
      let throttleTimer = null;
      const throttledUpdate = () => {
        if (throttleTimer) return;
        throttleTimer = setTimeout(() => {
          calculatePosition();
          throttleTimer = null;
        }, 16); // ~60fps
      };
      
      // Recalculate on scroll or resize
      window.addEventListener('scroll', throttledUpdate, true);
      window.addEventListener('resize', throttledUpdate);
      
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', throttledUpdate, true);
        window.removeEventListener('resize', throttledUpdate);
        if (throttleTimer) {
          clearTimeout(throttleTimer);
        }
      };
    }
  }, [isVisible]);

  // Additional effect to recalculate position after content changes
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const observer = new ResizeObserver(() => {
        calculatePosition();
      });
      
      observer.observe(tooltipRef.current);
      
      return () => {
        observer.disconnect();
      };
    }
  }, [isVisible, displayText]);

  const handleMouseEnter = () => {
    if (leaveTimeoutId) {
      clearTimeout(leaveTimeoutId);
      setLeaveTimeoutId(null);
    }
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    const leaveId = setTimeout(() => {
      setIsVisible(false);
    }, 100);
    setLeaveTimeoutId(leaveId);
  };

  const handleTouchStart = () => {
    // For touch devices, show tooltip immediately
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (leaveTimeoutId) {
      clearTimeout(leaveTimeoutId);
      setLeaveTimeoutId(null);
    }
    setIsVisible(true);
    
    // Hide after 2 seconds on touch
    const touchLeaveId = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
    setLeaveTimeoutId(touchLeaveId);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (leaveTimeoutId) clearTimeout(leaveTimeoutId);
    };
  }, [timeoutId, leaveTimeoutId]);

  return (
    <TooltipWrapper
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {children}
      {isVisible && (
        <TooltipContent
          ref={tooltipRef}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          $arrowPosition={arrowPosition}
        >
          {displayText}
        </TooltipContent>
      )}
    </TooltipWrapper>
  );
};

export default PremiumTooltip;