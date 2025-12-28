import React from 'react';
import styled from 'styled-components';

const DotWaveLoader = ({ size = 50, color = '#C44BEF', speed = 0.6 }) => {
  return (
    <StyledWrapper size={size} color={color} speed={speed}>
      <div className="dot-wave">
        <div className="dot-wave__dot" />
        <div className="dot-wave__dot" />
        <div className="dot-wave__dot" />
        <div className="dot-wave__dot" />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .dot-wave {
    --uib-size: ${props => props.size}px;
    --uib-speed: ${props => props.speed}s;
    --uib-color: ${props => props.color};
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    width: var(--uib-size);
    height: calc(var(--uib-size) * 0.17);
    padding-top: calc(var(--uib-size) * 0.34);
  }

  .dot-wave__dot {
    flex-shrink: 0;
    width: calc(var(--uib-size) * 0.17);
    height: calc(var(--uib-size) * 0.17);
    border-radius: 50%;
    background-color: var(--uib-color);
    will-change: transform;
  }

  .dot-wave__dot:nth-child(1) {
    animation: jump824 var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.45) infinite;
  }

  .dot-wave__dot:nth-child(2) {
    animation: jump824 var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.3) infinite;
  }

  .dot-wave__dot:nth-child(3) {
    animation: jump824 var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.15) infinite;
  }

  .dot-wave__dot:nth-child(4) {
    animation: jump824 var(--uib-speed) ease-in-out infinite;
  }

  @keyframes jump824 {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-200%);
    }
  }
`;

export default DotWaveLoader;