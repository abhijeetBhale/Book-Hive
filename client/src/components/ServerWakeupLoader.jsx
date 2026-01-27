import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { wakeupServer } from '../utils/serverWakeup';
import DotWaveLoader from './ui/DotWaveLoader';

const ServerWakeupLoader = ({ onReady }) => {
  const [status, setStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const maxRetries = 3;

  // Smart timing configuration
  const MINIMUM_LOADING_TIME = 3000; // 3 seconds minimum
  const LONG_ABSENCE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  const EXTENDED_LOADING_TIME = 5000; // 5 seconds for long absence

  useEffect(() => {
    const getMinimumLoadingTime = () => {
      const lastVisit = localStorage.getItem('bookhive_last_visit');
      const now = Date.now();
      
      if (!lastVisit) {
        // First time visitor - show full animation
        localStorage.setItem('bookhive_last_visit', now.toString());
        return EXTENDED_LOADING_TIME;
      }
      
      const timeSinceLastVisit = now - parseInt(lastVisit);
      localStorage.setItem('bookhive_last_visit', now.toString());
      
      if (timeSinceLastVisit > LONG_ABSENCE_THRESHOLD) {
        // User hasn't visited for a while - show extended animation
        return EXTENDED_LOADING_TIME;
      }
      
      // Regular visit - show minimum animation
      return MINIMUM_LOADING_TIME;
    };

    const wakeup = async () => {
      const startTime = Date.now();
      const minimumTime = getMinimumLoadingTime();
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev; // Don't complete until server responds
          return prev + Math.random() * 15; // Random increments for realistic feel
        });
      }, 200);

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
            }, 300); // Small delay for smooth transition
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
            }, 3000);
          } else {
            // Max retries exceeded, continue anyway
            setLoadingProgress(100);
            setTimeout(() => {
              clearInterval(progressInterval);
              setStatus('ready');
              setTimeout(() => {
                onReady?.(true);
              }, 300);
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
          }, 3000);
        } else {
          // Continue anyway after max retries
          setLoadingProgress(100);
          setTimeout(() => {
            clearInterval(progressInterval);
            setStatus('ready');
            setTimeout(() => {
              onReady?.(true);
            }, 300);
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
        if (loadingProgress < 30) return 'Initializing BookHive...';
        if (loadingProgress < 60) return 'Loading Community...';
        if (loadingProgress < 90) return 'Preparing Your Experience...';
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
        <DotWaveLoader size={60} color="#C44BEF" speed={0.8} />
        {/* <LoaderText>
          {getStatusMessage()}
        </LoaderText>
        <ProgressContainer>
          <ProgressBar progress={loadingProgress} />
          <ProgressText>{Math.round(loadingProgress)}%</ProgressText>
        </ProgressContainer>
        {status === 'checking' && (
          <LoadingTips>
            <TipText>
              {loadingProgress < 25 && "💡 Tip: You can borrow books from neighbors for free!"}
              {loadingProgress >= 25 && loadingProgress < 50 && "📚 Did you know? We have over 1000+ books in our community!"}
              {loadingProgress >= 50 && loadingProgress < 75 && "🌍 Connect with book lovers in your area!"}
              {loadingProgress >= 75 && "⭐ Join thousands of readers sharing amazing books!"}
            </TipText>
          </LoadingTips>
        )} */}
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
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 400px;
  padding: 2rem;
  text-align: center;
`;

const LoaderText = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #C44BEF, #9333EA, #7C3AED);
    border-radius: 3px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(196, 75, 239, 0.5);
  }
`;

const ProgressText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Courier New', monospace;
`;

const LoadingTips = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 350px;
`;

const TipText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  line-height: 1.4;
  animation: slideInUp 0.5s ease-out;

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default ServerWakeupLoader;
