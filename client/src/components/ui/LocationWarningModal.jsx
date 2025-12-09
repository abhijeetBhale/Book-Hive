import React from 'react';
import styled from 'styled-components';
import { MapPin, X } from 'lucide-react';

const LocationWarningModal = ({ isOpen, onClose, userName }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
        
        <IconWrapper>
          <MapPin size={48} />
        </IconWrapper>
        
        <Title>Location Not Available</Title>
        
        <Message>
          <strong>{userName}</strong> has not enabled their location on the platform.
        </Message>
        
        <SubMessage>
          Users without location enabled are not visible on the map but can still be found throughout the rest of the platform.
        </SubMessage>
        
        <ButtonGroup>
          <CloseBtn onClick={onClose}>
            Got it
          </CloseBtn>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 450px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 100%;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #111827;
  }
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #f59e0b;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 1rem 0;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #4b5563;
  text-align: center;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;

  strong {
    color: #111827;
    font-weight: 600;
  }
`;

const SubMessage = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

const CloseBtn = styled.button`
  padding: 0.75rem 2rem;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;

  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default LocationWarningModal;
