import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { wakeupServer } from '../utils/serverWakeup';
import DotWaveLoader from './ui/DotWaveLoader';

const ServerWakeupLoader = ({ onReady }) => {
  const [status, setStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const wakeup = async () => {
      try {
        setStatus('checking');
        const success = await wakeupServer();
        
        if (success) {
          setStatus('ready');
          setTimeout(() => {
            onReady?.(true);
          }, 500);
        } else {
          // If health check failed but we haven't exceeded max retries
          if (retryCount < maxRetries) {
            setStatus('retrying');
            setRetryCount(prev => prev + 1);
            setTimeout(wakeup, 3000); // Wait 3 seconds before retry
          } else {
            // Max retries exceeded, continue anyway
            setStatus('ready');
            setTimeout(() => {
              onReady?.(true);
            }, 500);
          }
        }
      } catch (error) {
        console.error('❌ Server wakeup error:', error);
        if (retryCount < maxRetries) {
          setStatus('retrying');
          setRetryCount(prev => prev + 1);
          setTimeout(wakeup, 3000);
        } else {
          // Continue anyway after max retries
          setStatus('ready');
          setTimeout(() => {
            onReady?.(true);
          }, 500);
        }
      }
    };

    wakeup();
  }, [onReady, retryCount]);

  if (status === 'ready') {
    return null;
  }

  return (
    <LoaderOverlay>
      <LoaderContainer>
        <DotWaveLoader size={60} color="#C44BEF" speed={0.8} />
        <LoaderText>
          {status === 'checking' && 'Waking up server...'}
          {status === 'retrying' && `Retrying... (${retryCount}/${maxRetries})`}
        </LoaderText>
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
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const LoaderText = styled.div`
  color: #C44BEF;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
`;

export default ServerWakeupLoader;
