import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center; z-index: 50;
`;
const Modal = styled.div`
  background: #fff; border-radius: 16px; width: 420px; max-width: 92vw; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
`;
const Header = styled.div`
  font-weight: 800; font-size: 1.125rem; color: #111827; margin-bottom: 0.75rem;
`;
const Stars = styled.div`
  display: flex; gap: 0.25rem; margin: 0.5rem 0 0.75rem 0;
  button { background: none; border: none; cursor: pointer; font-size: 1.25rem; }
`;
const Actions = styled.div`
  display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem;
  button { border: none; padding: 0.55rem 0.9rem; border-radius: 10px; font-weight: 700; }
`;

export default function ReviewModal({ open, onClose, onSubmit, counterpartName = 'user' }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  if (!open) return null;

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>Leave a review for {counterpartName}</Header>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Rate your experience</div>
        <Stars>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n} star`}>
              <span style={{ color: n <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
            </button>
          ))}
        </Stars>
        <textarea
          rows={4}
          placeholder="Share a short comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: '8px 10px' }}
        />
        <Actions>
          <button onClick={onClose} style={{ background: '#f3f4f6', color: '#374151' }}>Cancel</button>
          <button
            style={{ background: '#4F46E5', color: 'white' }}
            onClick={async () => {
              try {
                await onSubmit({ rating, comment });
                toast.success('Review submitted');
                onClose();
              } catch (e) {
                toast.error(e?.response?.data?.message || 'Failed to submit review');
              }
            }}
          >
            Submit
          </button>
        </Actions>
      </Modal>
    </Backdrop>
  );
}
