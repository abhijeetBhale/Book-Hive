import React from 'react';
import styled from 'styled-components';

const AnimatedButton = ({ text, onClick, disabled = false, variant = 'primary' }) => {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <StyledWrapper variant={variant}>
      <button 
        className="cssbuttons-io" 
        onClick={handleClick}
        disabled={disabled}
        type="button"
      >
        <span>{text}</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .cssbuttons-io {
    position: relative;
    font-family: inherit;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.05em;
    border-radius: 0.8em;
    cursor: pointer;
    border: none;
    background: ${props => {
      if (props.variant === 'available') return 'linear-gradient(to right, #9D54F5, #7C3AED)';
      if (props.variant === 'unavailable') return 'linear-gradient(to right, #6b7280, #4b5563)';
      if (props.variant === 'borrowed') return 'linear-gradient(to right, #f59e0b, #d97706)';
      return 'linear-gradient(to right, #8e2de2, #4a00e0)';
    }};
    color: ghostwhite;
    overflow: hidden;
    width: 100%;
    transition: all 0.3s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cssbuttons-io svg {
    width: 1.2em;
    height: 1.2em;
    margin-right: 0.5em;
  }

  .cssbuttons-io span {
    position: relative;
    z-index: 10;
    transition: color 0.4s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.8em 1.2em;
    width: 100%;
  }

  .cssbuttons-io::before,
  .cssbuttons-io::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .cssbuttons-io::before {
    content: "";
    background: #000;
    width: 120%;
    left: -10%;
    transform: skew(30deg);
    transition: transform 0.4s cubic-bezier(0.3, 1, 0.8, 1);
  }

  .cssbuttons-io:hover:not(:disabled)::before {
    transform: translate3d(100%, 0, 0);
  }

  .cssbuttons-io:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

export default AnimatedButton;
