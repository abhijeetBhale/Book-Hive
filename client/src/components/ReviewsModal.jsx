import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { X, Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import { reviewsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const ReviewsModal = ({ open, onClose, userId, userName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState({});
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (open && userId) {
      fetchReviews();
    }
  }, [open, userId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewsAPI.listForUser(userId, { limit: 50 });
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      const res = await reviewsAPI.likeReview(reviewId);
      // Update local state
      setReviews(prev => prev.map(r => 
        r._id === reviewId ? { ...r, likes: res.data.review.likes, likesCount: res.data.review.likesCount } : r
      ));
      // Emit event for profile refresh
      window.dispatchEvent(new CustomEvent('review-updated', { detail: { userId } }));
    } catch (error) {
      toast.error('Failed to like review');
    }
  };

  const handleAddComment = async (reviewId) => {
    const text = commentText[reviewId]?.trim();
    if (!text) return;

    try {
      const res = await reviewsAPI.addComment(reviewId, text);
      // Update local state
      setReviews(prev => prev.map(r => 
        r._id === reviewId ? { ...r, comments: res.data.review.comments, commentsCount: res.data.review.commentsCount } : r
      ));
      setCommentText(prev => ({ ...prev, [reviewId]: '' }));
      toast.success('Comment added');
      // Emit event for profile refresh
      window.dispatchEvent(new CustomEvent('review-updated', { detail: { userId } }));
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    try {
      const res = await reviewsAPI.deleteComment(reviewId, commentId);
      setReviews(prev => prev.map(r => 
        r._id === reviewId ? { ...r, comments: res.data.review.comments, commentsCount: res.data.review.commentsCount } : r
      ));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const isLikedByMe = (review) => {
    return review.likes?.some(like => like.user === user?._id || like.user?._id === user?._id);
  };

  if (!open) return null;

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Reviews for {userName}</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          {loading ? (
            <LoadingState>Loading reviews...</LoadingState>
          ) : reviews.length === 0 ? (
            <EmptyState>
              <p>No reviews yet</p>
            </EmptyState>
          ) : (
            <ReviewsList>
              {reviews.map(review => (
                <ReviewCard key={review._id}>
                  <ReviewHeader>
                    <UserInfo>
                      <Avatar 
                        src={review.fromUser?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNOCAzMkM4IDI2LjQ3NzIgMTIuNDc3MiAyMiAxOCAyMkgyMkMyNy41MjI4IDIyIDMyIDI2LjQ3NzIgMzIgMzJWMzJIOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                        alt={review.fromUser?.name}
                      />
                      <div>
                        <UserName>{review.fromUser?.name || 'Anonymous'}</UserName>
                        <ReviewDate>{new Date(review.createdAt).toLocaleDateString()}</ReviewDate>
                      </div>
                    </UserInfo>
                    <Stars>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} style={{ color: n <= review.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                      ))}
                    </Stars>
                  </ReviewHeader>

                  {review.comment && (
                    <ReviewComment>{review.comment}</ReviewComment>
                  )}

                  <ReviewActions>
                    <ActionButton 
                      onClick={() => handleLike(review._id)}
                      $active={isLikedByMe(review)}
                    >
                      <Heart size={16} fill={isLikedByMe(review) ? '#ef4444' : 'none'} />
                      <span>{review.likesCount || 0}</span>
                    </ActionButton>
                    <ActionButton>
                      <MessageCircle size={16} />
                      <span>{review.commentsCount || 0}</span>
                    </ActionButton>
                  </ReviewActions>

                  {/* Comments Section */}
                  {review.comments && review.comments.length > 0 && (
                    <CommentsSection>
                      {review.comments.map(comment => (
                        <CommentItem key={comment._id}>
                          <CommentAvatar 
                            src={comment.user?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                            alt={comment.user?.name}
                          />
                          <CommentContent>
                            <CommentHeader>
                              <CommentAuthor>{comment.user?.name || 'Anonymous'}</CommentAuthor>
                              {comment.user?._id === user?._id && (
                                <DeleteCommentBtn onClick={() => handleDeleteComment(review._id, comment._id)}>
                                  <Trash2 size={12} />
                                </DeleteCommentBtn>
                              )}
                            </CommentHeader>
                            <CommentText>{comment.text}</CommentText>
                          </CommentContent>
                        </CommentItem>
                      ))}
                    </CommentsSection>
                  )}

                  {/* Add Comment Input */}
                  <CommentInputSection>
                    <CommentInput
                      placeholder="Add a comment..."
                      value={commentText[review._id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [review._id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(review._id);
                        }
                      }}
                    />
                    <SendButton 
                      onClick={() => handleAddComment(review._id)}
                      disabled={!commentText[review._id]?.trim()}
                    >
                      <Send size={16} />
                    </SendButton>
                  </CommentInputSection>
                </ReviewCard>
              ))}
            </ReviewsList>
          )}
        </Content>
      </Modal>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Content = styled.div`
  overflow-y: auto;
  padding: 1rem;
  flex: 1;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  
  p {
    font-size: 1.125rem;
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReviewCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const UserInfo = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
`;

const ReviewDate = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
  font-size: 1.125rem;
`;

const ReviewComment = styled.p`
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
`;

const ReviewActions = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.$active ? '#ef4444' : '#6b7280'};
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: ${props => props.$active ? '#dc2626' : '#111827'};
  }
`;

const CommentsSection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
`;

const CommentAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const CommentContent = styled.div`
  flex: 1;
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const CommentAuthor = styled.div`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #111827;
`;

const DeleteCommentBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #fee2e2;
  }
`;

const CommentText = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.5;
`;

const CommentInputSection = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
`;

const CommentInput = styled.input`
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4F46E5;
  }
`;

const SendButton = styled.button`
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ReviewsModal;
