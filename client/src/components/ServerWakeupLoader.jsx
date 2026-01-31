import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { wakeupServer } from '../utils/serverWakeup';
import LightPillar from './ui/LightPillar';
import CountUp from './ui/CountUp';
import './ServerWakeupLoader.css';

const ServerWakeupLoader = ({ onReady }) => {
  const [status, setStatus] = useState('loading');
  const [countUpStarted, setCountUpStarted] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  // Calculate loading duration based on user visit history
  const getLoadingDuration = () => {
    const lastVisit = localStorage.getItem('bookhive_last_visit');
    const now = Date.now();
    const LONG_ABSENCE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    
    if (!lastVisit) {
      // First time visitor - longer animation
      localStorage.setItem('bookhive_last_visit', now.toString());
      return 4; // 4 seconds
    }
    
    const timeSinceLastVisit = now - parseInt(lastVisit);
    localStorage.setItem('bookhive_last_visit', now.toString());
    
    if (timeSinceLastVisit > LONG_ABSENCE_THRESHOLD) {
      // User hasn't visited for a while - longer animation
      return 4; // 4 seconds
    }
    
    // Regular visit - shorter animation
    return 2.5; // 2.5 seconds
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Start the count up animation immediately
      setCountUpStarted(true);
      
      // Start server wakeup in parallel
      try {
        await wakeupServer();
        setServerReady(true);
      } catch (error) {
        console.error('Server wakeup error:', error);
        // Continue anyway - the app should still work
        setServerReady(true);
      }
    };

    initializeApp();
  }, []);

  const handleCountUpComplete = () => {
    // When count up reaches 100, wait a moment then trigger onReady
    setTimeout(() => {
      setStatus('ready');
      onReady?.(true);
    }, 300);
  };

  if (status === 'ready') {
    return null;
  }

  const loadingDuration = getLoadingDuration();

  return (
    <LoaderOverlay>
      {/* LightPillar Background */}
      <LightPillarBackground>
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={0.8}
          rotationSpeed={0.2}
          glowAmount={0.003}
          pillarWidth={4}
          pillarHeight={0.3}
          noiseIntensity={0.3}
          pillarRotation={15}
          interactive={false}
          mixBlendMode="screen"
          quality="medium"
        />
      </LightPillarBackground>
      
      {/* CountUp Animation */}
      <LoaderContainer>
        <CountUpContainer>
          <CountUp
            from={0}
            to={100}
            duration={loadingDuration}
            className="count-up-text"
            startWhen={countUpStarted}
            onEnd={handleCountUpComplete}
          />
          {/* <CountUpLabel>%</CountUpLabel> */}
        </CountUpContainer>
        <LoadingText>Initializing BookHive...</LoadingText>
      </LoaderContainer>
    </LoaderOverlay>
  );
};

const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out; /* Faster fade in */

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LightPillarBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  opacity: 0.7;
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 400px;
  padding: 2rem;
  text-align: center;
  position: relative;
  z-index: 2;
`;

const CountUpContainer = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  animation: fadeInUp 0.8s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CountUpLabel = styled.span`
  font-size: 4rem;
  font-weight: 700;
  color: #C44BEF;
  text-shadow: 0 0 20px rgba(196, 75, 239, 0.5);
  animation: glow 2s ease-in-out infinite alternate;

  @keyframes glow {
    from {
      text-shadow: 0 0 20px rgba(196, 75, 239, 0.5);
    }
    to {
      text-shadow: 0 0 30px rgba(196, 75, 239, 0.8), 0 0 40px rgba(196, 75, 239, 0.6);
    }
  }

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  animation: pulse 2s ease-in-out infinite, fadeInUp 0.8s ease-out 0.3s both;

  @keyframes pulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.6; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 0.9;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export default ServerWakeupLoader;
