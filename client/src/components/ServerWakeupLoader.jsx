import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { wakeupServer } from '../utils/serverWakeup';
import DotWaveLoader from './ui/DotWaveLoader';

const ServerWakeupLoader = ({ onReady }) => {
  const [status, setStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const maxRetries = 3;

  // OPTIMIZED: Reduced loading times for better LCP
  const MINIMUM_LOADING_TIME = 1500; // Reduced from 3000ms
  const LONG_ABSENCE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  const EXTENDED_LOADING_TIME = 2500; // Reduced from 5000ms

  useEffect(() => {
    const getMinimumLoadingTime = () => {
      const lastVisit = localStorage.getItem('bookhive_last_visit');
      const now = Date.now();
      
      if (!lastVisit) {
        // First time visitor - show reduced animation
        localStorage.setItem('bookhive_last_visit', now.toString());
        return EXTENDED_LOADING_TIME;
      }
      
      const timeSinceLastVisit = now - parseInt(lastVisit);
      localStorage.setItem('bookhive_last_visit', now.toString());
      
      if (timeSinceLastVisit > LONG_ABSENCE_THRESHOLD) {
        // User hasn't visited for a while - show extended animation
        return EXTENDED_LOADING_TIME;
      }
      
      // Regular visit - show minimal animation
      return MINIMUM_LOADING_TIME;
    };

    const wakeup = async () => {
      const startTime = Date.now();
      const minimumTime = getMinimumLoadingTime();
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev; // Don't complete until server responds
          return prev + Math.random() * 20; // Faster increments
        });
      }, 150); // Faster updates

      try {
        setStatus('checking');
        const success = await wakeupServer();
        
        // Calculate remaining time to meet minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumTime - elapsedTime);
        
        if (success) {
          // Complete the progress bar
          setLoadingProgress(100);
          
          // Wait for remaining time if needed
          setTimeout(() => {
            clearInterval(progressInterval);
            setStatus('ready');
            setTimeout(() => {
              onReady?.(true);
            }, 200); // Reduced delay
          }, remainingTime);
        } else {
          // If health check failed but we haven't exceeded max retries
          if (retryCount < maxRetries) {
            setStatus('retrying');
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              clearInterval(progressInterval);
              setLoadingProgress(0); // Reset progress for retry
              wakeup();
            }, 2000); // Reduced retry delay
          } else {
            // Max retries exceeded, continue anyway
            setLoadingProgress(100);
            setTimeout(() => {
              clearInterval(progressInterval);
              setStatus('ready');
              setTimeout(() => {
                onReady?.(true);
              }, 200);
            }, remainingTime);
          }
        }
      } catch (error) {
        console.error('❌ Server wakeup error:', error);
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumTime - elapsedTime);
        
        if (retryCount < maxRetries) {
          setStatus('retrying');
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            clearInterval(progressInterval);
            setLoadingProgress(0);
            wakeup();
          }, 2000);
        } else {
          // Continue anyway after max retries
          setLoadingProgress(100);
          setTimeout(() => {
            clearInterval(progressInterval);
            setStatus('ready');
            setTimeout(() => {
              onReady?.(true);
            }, 200);
          }, remainingTime);
        }
      }
    };

    wakeup();
  }, [onReady, retryCount]);

  if (status === 'ready') {
    return null;
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        if (loadingProgress < 40) return 'Initializing BookHive...';
        if (loadingProgress < 80) return 'Loading Community...';
        return 'Almost Ready...';
      case 'retrying':
        return `Reconnecting... (${retryCount}/${maxRetries})`;
      default:
        return 'Loading Books...';
    }
  };

  return (
    <LoaderOverlay>
      <LoaderContainer>
        <DotWaveLoader size={50} color="#C44BEF" speed={1.2} />
        {/* <LoaderText>
          {getStatusMessage()}
        </LoaderText> */}
        {/* <ProgressContainer>
          <ProgressBar $progress={loadingProgress} />
          <ProgressText>{Math.round(loadingProgress)}%</ProgressText>
        </ProgressContainer> */}
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
  // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem; /* Reduced gap */
  max-width: 350px; /* Smaller container */
  padding: 1.5rem; /* Reduced padding */
  text-align: center;
`;

const LoaderText = styled.div`
  color: white;
  font-size: 1.1rem; /* Slightly smaller */
  font-weight: 600;
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite; /* Faster pulse */

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 250px; /* Smaller progress bar */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px; /* Thinner progress bar */
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$progress}%; /* Use transient prop */
    background: linear-gradient(90deg, #C44BEF, #9333EA, #7C3AED);
    border-radius: 2px;
    transition: width 0.2s ease; /* Faster transition */
    box-shadow: 0 0 8px rgba(196, 75, 239, 0.4);
  }
`;

const ProgressText = styled.div`
  color: #C44BEF;
  font-size: 0.8rem; /* Smaller text */
  font-weight: 500;
  font-family: 'Courier New', monospace;
`;

export default ServerWakeupLoader;
