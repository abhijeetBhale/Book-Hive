import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { wakeupServer, getServerStatus } from '../utils/serverWakeup';

const ServerWakeupLoader = ({ onReady }) => {
  const [status, setStatus] = useState('checking');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Connecting to server...');

  useEffect(() => {
    let progressInterval;
    
    const wakeup = async () => {
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 2;
        });
      }, 1000);

      setMessage('Waking up server (this may take 30-60 seconds)...');
      
      try {
        const success = await wakeupServer();
        clearInterval(progressInterval);
        
        if (success) {
          setProgress(100);
          setStatus('ready');
          setMessage('Server is ready!');
          setTimeout(() => {
            onReady?.(true);
          }, 500);
        } else {
          setStatus('error');
          setMessage('Server connection failed. Retrying...');
          // Retry after 3 seconds
          setTimeout(wakeup, 3000);
        }
      } catch (error) {
        clearInterval(progressInterval);
        setStatus('error');
        setMessage('Connection error. Retrying...');
        setTimeout(wakeup, 3000);
      }
    };

    wakeup();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [onReady]);

  if (status === 'ready') {
    return null;
  }

  return (
    <LoaderOverlay>
      <LoaderContainer>
        <Logo>📚</Logo>
        <Title>BookHive</Title>
        <Message>{message}</Message>
        <ProgressBar>
          <ProgressFill progress={progress} status={status} />
        </ProgressBar>
        <ProgressText>{progress}%</ProgressText>
        {status === 'error' && (
          <ErrorMessage>
            The server is starting up. This is normal for the first visit.
          </ErrorMessage>
        )}
        <Tip>
          💡 Tip: The free tier server sleeps after inactivity. First load may take up to 60 seconds.
        </Tip>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoaderContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Logo = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: ${props => props.status === 'error' 
    ? 'linear-gradient(90deg, #ff6b6b, #ee5a6f)'
    : 'linear-gradient(90deg, #667eea, #764ba2)'};
  transition: width 0.3s ease;
  border-radius: 10px;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const Tip = styled.div`
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

export default ServerWakeupLoader;
