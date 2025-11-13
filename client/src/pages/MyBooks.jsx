import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { Loader, PlusCircle, BookOpen, Trash2, Edit, X, AlertTriangle, Camera, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/imageHelpers';
import { booksAPI } from '../utils/api';
import BookSearchModal from '../components/books/BookSearchModal';

// --- UI Components ---

const StyledConfirmationModal = styled.div`
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center;
  background-color: rgba(0,0,0,0.6);
  padding: 1rem;
  .modal-content {
    background-color: white; border-radius: 1rem;
    padding: 2rem; width: 100%; max-width: 450px;
    text-align: center;
  }
  .icon-wrapper {
    margin: 0 auto 1rem;
    width: 3.5rem; height: 3.5rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background-color: #fee2e2;
    color: #ef4444;
  }
  .modal-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
  .modal-message { font-size: 0.9rem; color: #4b5563; margin-bottom: 1.5rem; }
  .btn-group { display: flex; gap: 0.75rem; }
  .btn {
    flex: 1; padding: 0.75rem; border-radius: 0.5rem; font-weight: 600;
    cursor: pointer; border: 1px solid transparent;
  }
  .confirm-btn { background-color: #ef4444; color: white; &:hover { background-color: #dc2626; } }
  .cancel-btn { background-color: white; color: #374151; border-color: #d1d5db; &:hover { background-color: #f3f4f6; } }
`;

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <StyledConfirmationModal>
      <div className="modal-content">
        <div className="icon-wrapper"><AlertTriangle size={28} /></div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="btn-group">
          <button onClick={onConfirm} className="btn confirm-btn">Confirm Delete</button>
          <button onClick={onClose} className="btn cancel-btn">Cancel</button>
        </div>
      </div>
    </StyledConfirmationModal>
  );
};

const StyledModal = styled.div`
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background-color: rgba(0,0,0,0.5);
  padding: 1rem;
  .modal-content {
    background-color: white; border-radius: 1rem;
    padding: 2rem; width: 100%; max-width: 650px;
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 51; /* Ensure modal content has higher z-index than backdrop */
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.5rem;
  }
  .modal-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
  .close-btn {
    padding: 0.5rem; border-radius: 9999px; cursor: pointer;
    background-color: #f3f4f6; &:hover { background-color: #e5e7eb; }
  }
`;

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <StyledModal onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        {children}
      </div>
    </StyledModal>
  );
};

const StyledBookForm = styled.form`
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .form-group { 
    display: flex; 
    flex-direction: column; 
    position: relative;
    &.full-width { grid-column: 1 / -1; } 
    &:first-child {
      z-index: 10; /* Ensure the first form group (title with search) has higher z-index */
    }
  }
  label { font-weight: 600; color: #374151; margin-bottom: 0.5rem; display: block; }
  span.required-star { color: #ef4444; margin-left: 2px; }
  input, select, textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; &:focus { outline: none; border-color: #4F46E5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2); } }
  .search-container { 
    position: relative; 
    z-index: 100; /* High z-index to ensure dropdown appears above other elements */
  }
  .search-indicator { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: #4F46E5; font-weight: 500; }
  .selected-book-indicator { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; padding: 0.5rem; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.375rem; font-size: 0.8rem; color: #16a34a; font-weight: 500; }
  .clear-btn { background: none; border: none; color: #dc2626; font-size: 0.8rem; cursor: pointer; text-decoration: underline; &:hover { color: #b91c1c; } }
  .search-results { 
    position: absolute; 
    top: 100%; 
    left: 0; 
    right: 0; 
    background: white; 
    border: 1px solid #d1d5db; 
    border-radius: 0.5rem; 
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); 
    z-index: 1000; 
    max-height: 300px; 
    overflow-y: auto; 
    margin-top: 4px;
    border-top: none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
  .results-header { padding: 0.75rem 1rem; font-size: 0.8rem; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb; }
  .result-item { display: flex; align-items: center; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; &:hover { background-color: #f9fafb; } &:last-child { border-bottom: none; } }
  .result-image { width: 40px; height: 60px; margin-right: 1rem; flex-shrink: 0; img { width: 100%; height: 100%; object-fit: cover; border-radius: 0.25rem; } .no-image { width: 100%; height: 100%; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; border-radius: 0.25rem; color: #9ca3af; } }
  .result-info { flex: 1; }
  .result-title { font-weight: 600; color: #111827; font-size: 0.9rem; line-height: 1.3; margin-bottom: 0.25rem; }
  .result-author { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.125rem; }
  .result-year { font-size: 0.75rem; color: #9ca3af; }
  .auto-cover-info { margin-bottom: 0.75rem; }
  textarea { min-height: 120px; resize: vertical; }
  .image-preview-container { width: 120px; height: 180px; border: 2px dashed #d1d5db; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #f9fafb; }
  .image-preview { width: 100%; height: 100%; object-fit: cover; }
  .upload-placeholder { text-align: center; color: #6b7280; }
  .file-input-label { cursor: pointer; padding: 0.6rem 1.2rem; border-radius: 0.5rem; background-color: white; color: #374151; font-weight: 600; border: 1px solid #d1d5db; &:hover { background-color: #f9fafb; } }
  .camera-options { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
  .camera-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; color: #374151; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background-color: #f9fafb; } }
  .checkbox-group { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.75rem; }
  .checkbox-item { display: flex; align-items: center; background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #f3f4f6; }
  .checkbox-item input { width: auto; margin-right: 0.75rem; accent-color: #4F46E5;}
  .submit-btn { grid-column: 1 / -1; padding: 0.875rem; background-image: linear-gradient(to right, #4f46e5, #818cf8); color: white; font-weight: 700; border-radius: 0.5rem; cursor: pointer; border: none; &:hover { background-image: linear-gradient(to right, #4338ca, #6366f1); } &:disabled { background: #a5b4fc; cursor: not-allowed; } }
`;

const BookForm = ({ onSubmit, isSubmitting, initialData, selectedGoogleBook, setSelectedGoogleBook }) => {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      isAvailable: true,
      forBorrowing: true,
      forSelling: false,
      lendingDuration: 14,
      sellingPrice: '',
      condition: 'Good',
      ...initialData
    }
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const coverImageFile = watch('coverImage');
  const titleValue = watch('title');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.coverImage) {
        setImagePreview(getFullImageUrl(initialData.coverImage));
      } else {
        setImagePreview(null);
      }
    } else if (selectedGoogleBook) {
      // If we have a selected book from search, use its data
      // Map category to available options
      const mapCategory = (apiCategory) => {
        if (!apiCategory) return '';
        
        const categoryMap = {
          'Fiction': 'Fiction',
          'Non-Fiction': 'Non-Fiction',
          'Nonfiction': 'Non-Fiction',
          'Mystery': 'Mystery',
          'Romance': 'Romance',
          'Science Fiction': 'Sci-Fi',
          'Fantasy': 'Fantasy',
          'Biography': 'Biography',
          'Autobiography': 'Biography',
          'History': 'History',
          'Science': 'Science',
          'Technology': 'Technology',
          'Business': 'Business',
          'Self-Help': 'Self-Help',
          'Poetry': 'Poetry',
          'Drama': 'Drama',
          'Children': 'Children',
          'Young Adult': 'Young Adult',
          'Comics': 'Comics',
          'Graphic Novel': 'Comics'
        };
        
        return categoryMap[apiCategory] || 'Other';
      };
      
      const bookData = {
        title: selectedGoogleBook.title || '',
        author: selectedGoogleBook.author || '',
        description: selectedGoogleBook.description || '',
        category: mapCategory(selectedGoogleBook.category),
        isbn: selectedGoogleBook.isbn || '',
        publicationYear: selectedGoogleBook.publicationYear ? String(selectedGoogleBook.publicationYear) : '',
        condition: 'Good',
        isAvailable: true,
        forBorrowing: true,
        forSelling: false,
        lendingDuration: 14
      };
      reset(bookData);
      if (selectedGoogleBook.coverImage) {
        setImagePreview(selectedGoogleBook.coverImage);
      }
    } else {
      reset({ 
        isAvailable: true, 
        forBorrowing: true,
        forSelling: false,
        lendingDuration: 14,
        condition: 'Good' 
      });
      setImagePreview(null);
    }
  }, [initialData, selectedGoogleBook, reset]);



  useEffect(() => {
    if (coverImageFile instanceof FileList && coverImageFile.length > 0) {
      const file = coverImageFile[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [coverImageFile]);


  const searchGoogleBooks = async (query) => {
    if (!query || query.length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
      const data = await response.json();
      if (data.items) {
        const books = data.items.map(item => ({ id: item.id, title: item.volumeInfo.title || '', author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : '', publishedDate: item.volumeInfo.publishedDate || '', categories: item.volumeInfo.categories || [], description: item.volumeInfo.description || '', isbn: item.volumeInfo.industryIdentifiers ? item.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || item.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || '' : '', coverImage: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || '', pageCount: item.volumeInfo.pageCount || '' }));
        setSearchResults(books);
        setShowResults(true);
      }
    } catch (error) { console.error('Error searching Google Books:', error); toast.error('Failed to search books. Please try again.'); }
    finally { setIsSearching(false); }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleValue && titleValue.length >= 3 && !selectedGoogleBook && !initialData) {
        searchGoogleBooks(titleValue);
      } else if (titleValue.length < 3) {
        setShowResults(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [titleValue, selectedGoogleBook, initialData]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectBookFromResults = (book) => {
    setSelectedGoogleBook(book);
    setShowResults(false);

    // Auto-fill form fields
    setValue('title', book.title);
    setValue('author', book.author);
    setValue('description', book.description);

    // ✨ REMOVED: The following line has been removed to stop auto-filling the ISBN
    // setValue('isbn', book.isbn);

    if (book.publishedDate) {
      const year = new Date(book.publishedDate).getFullYear();
      if (!isNaN(year)) { setValue('publicationYear', year); }
    }
    if (book.categories && book.categories.length > 0) {
      const category = book.categories[0];
      const categoryMap = { 'Fiction': 'Fiction', 'Science Fiction': 'Science Fiction', 'Fantasy': 'Fantasy', 'Mystery': 'Mystery', 'Biography': 'Non-Fiction', 'History': 'Non-Fiction', 'Science': 'Non-Fiction', 'Technology': 'Non-Fiction' };
      const mappedCategory = categoryMap[category] || 'Fiction';
      setValue('category', mappedCategory);
    }
    if (book.coverImage) { setImagePreview(book.coverImage); }
    toast.success('Book details auto-filled from Google Books!');
  };

  const clearSelection = () => {
    setSelectedGoogleBook(null);
    setImagePreview(null);
    reset({ 
      isAvailable: true, 
      forBorrowing: true,
      forSelling: false,
      lendingDuration: 14,
      condition: 'Good' 
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'book-photo.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the file to the form
        const fileInput = document.getElementById('coverImage');
        if (fileInput) {
          fileInput.files = dataTransfer.files;
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }

        // Create preview
        const previewUrl = URL.createObjectURL(blob);
        setImagePreview(previewUrl);

        stopCamera();
        toast.success('Photo captured successfully!');
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const submitButtonText = isSubmitting ? (initialData ? 'Saving Changes...' : 'Saving...') : (initialData ? 'Save Changes' : 'Add Book');

  return (
    <StyledBookForm onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="title">Title <span className="required-star">*</span></label>
          <div className="search-container" ref={searchContainerRef}>
            <input 
              id="title" 
              placeholder="Enter book title (auto-search enabled)" 
              {...register('title', { required: true })} 
              disabled={!!initialData}
              onFocus={() => {
                if (searchResults.length > 0 && titleValue && titleValue.length >= 3) {
                  setShowResults(true);
                }
              }}
            />
            {isSearching && <div className="search-indicator">Searching...</div>}
            {selectedGoogleBook && (
              <div className="selected-book-indicator">
                <span>✓ Auto-filled from Google Books</span>
                <button type="button" onClick={clearSelection} className="clear-btn">Clear</button>
              </div>
            )}
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                <div className="results-header">Found books:</div>
                {searchResults.map((book) => (<div key={book.id} className="result-item" onClick={() => selectBookFromResults(book)}>
                  <div className="result-image">{book.coverImage ? (<img src={book.coverImage} alt={book.title} />) : (<div className="no-image"><BookOpen size={20} /></div>)}</div>
                  <div className="result-info">
                    <div className="result-title">{book.title}</div>
                    <div className="result-author">by {book.author}</div>
                    <div className="result-year">{book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'Unknown year'}</div>
                  </div>
                </div>))}
              </div>
            )}
          </div>
        </div>
        <div className="form-group"><label htmlFor="author">Author <span className="required-star">*</span></label><input id="author" placeholder="Enter author name" {...register('author', { required: true })} /></div>
        <div className="form-group"><label htmlFor="category">Category <span className="required-star">*</span></label><select id="category" {...register('category', { required: true })}><option value="">Select a category</option><option value="Fiction">Fiction</option><option value="Non-Fiction">Non-Fiction</option><option value="Science Fiction">Science Fiction</option><option value="Fantasy">Fantasy</option><option value="Mystery">Mystery</option></select></div>
        <div className="form-group"><label htmlFor="publicationYear">Publication Year</label><input id="publicationYear" placeholder="e.g., 2020" type="number" {...register('publicationYear')} /></div>
        <div className="form-group"><label htmlFor="isbn">ISBN (optional)</label><input id="isbn" placeholder="Enter ISBN" {...register('isbn')} /></div>
        <div className="form-group"><label htmlFor="condition">Book Condition</label><select id="condition" {...register('condition')}><option value="New">New</option><option value="Like New">Like New</option><option value="Very Good">Very Good</option><option value="Good">Good</option><option value="Fair">Fair</option><option value="Poor">Poor</option></select></div>
        <div className="form-group full-width"><label htmlFor="description">Description <span className="required-star">*</span></label><textarea id="description" placeholder="Provide a brief description of the book..." {...register('description', { required: true })}></textarea></div>
        <div className="form-group full-width">
          <label>Cover Image</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div className="image-preview-container">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="upload-placeholder"><BookOpen size={32} /></div>
              )}
            </div>
            <div>
              {selectedGoogleBook && selectedGoogleBook.coverImage ? (
                <div className="auto-cover-info">
                  <p style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: '500' }}>
                    ✓ Cover image from Google Books
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Or add your own photo:
                  </p>
                </div>
              ) : null}

              <div className="camera-options">
                <button
                  type="button"
                  onClick={startCamera}
                  className="camera-btn"
                >
                  <Camera size={16} />
                  Take Photo
                </button>
                <label htmlFor="coverImage" className="file-input-label">
                  Choose File
                </label>
              </div>

              <input
                type="file"
                id="coverImage"
                accept="image/*"
                {...register('coverImage')}
                style={{ display: 'none' }}
              />

              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {watch('coverImage')?.[0]?.name ||
                  (selectedGoogleBook && selectedGoogleBook.coverImage ? 'Using Google Books cover' : 'No file chosen')}
              </p>
            </div>
          </div>

          {showCamera && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', maxWidth: '400px', borderRadius: '0.5rem' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button type="button" onClick={capturePhoto} className="camera-btn">
                  Capture Photo
                </button>
                <button type="button" onClick={stopCamera} className="camera-btn">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Lending Duration and Selling Price */}
        {(watch('forBorrowing') || watch('forSelling')) && (
          <>
            {watch('forBorrowing') && (
              <div className="form-group">
                <label htmlFor="lendingDuration">Lending Duration (Days)</label>
                <input 
                  id="lendingDuration"
                  type="number" 
                  min="1" 
                  max="365"
                  defaultValue="14"
                  placeholder="e.g., 14"
                  {...register('lendingDuration', { 
                    min: { value: 1, message: 'Minimum 1 day' },
                    max: { value: 365, message: 'Maximum 365 days' }
                  })} 
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  How many days can borrowers keep this book?
                </p>
              </div>
            )}
            
            {watch('forSelling') && (
              <div className="form-group">
                <label htmlFor="sellingPrice">Selling Price (₹) <span className="required-star">*</span></label>
                <input 
                  id="sellingPrice"
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 15.99"
                  {...register('sellingPrice', { 
                    required: watch('forSelling') ? 'Selling price is required when selling' : false,
                    min: { value: 0.01, message: 'Price must be greater than $0' }
                  })} 
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  BookHive promotes affordable books. Price will be validated against market rates.
                </p>
              </div>
            )}
          </>
        )}

        <div className="checkbox-group">
          <label className="checkbox-item">
            <input type="checkbox" {...register('forBorrowing')} />
            Available for borrowing
          </label>
          <label className="checkbox-item">
            <input type="checkbox" {...register('forSelling')} />
            Available for selling
          </label>
          <label className="checkbox-item">
            <input type="checkbox" {...register('isAvailable')} defaultChecked />
            Currently available
          </label>
        </div>
        <button type="submit" disabled={isSubmitting} className="submit-btn">{submitButtonText}</button>
      </div>
    </StyledBookForm>
  );
};


const StyledBookCard = styled.div`
  background-color: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s ease, box-shadow 0.2s ease; &:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07); }
  .book-cover { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; }
  .card-content { padding: 0.75rem; display: flex; flex-direction: column; flex-grow: 1; }
  .book-title { font-size: 1rem; font-weight: 600; color: #111827; line-height: 1.4; margin-bottom: 0.25rem; }
  .book-author { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.5rem; }
  .book-category { font-size: 0.7rem; color: #4f46e5; font-weight: 500; margin-bottom: 0.75rem; }
  .status-badge { padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 600; border-radius: 9999px; text-transform: capitalize; align-self: flex-start; &.available { background-color: #f0fdf4; color: #16a34a; } &.borrowed { background-color: #eff6ff; color: #2563eb; } }
  .card-footer { margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; }
  .btn { flex-grow: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 600; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s; border: 1px solid transparent; }
  .edit-btn { background-color: #f9fafb; color: #374151; border-color: #d1d5db; &:hover { background-color: #f3f4f6; } }
  .delete-btn { background-color: #fef2f2; color: #ef4444; border-color: #fecaca; &:hover { background-color: #fee2e2; } }
`;

const BookCard = ({ book, onEdit, onDelete }) => {
  const coverImageUrl = getFullImageUrl(book.coverImage);
  return (
    <StyledBookCard>
      <img key={book._id} src={coverImageUrl} alt={book.title} className="book-cover" />
      <div className="card-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <p className="book-category">{book.category}</p>
        <span className={`status-badge ${book.isAvailable ? 'available' : 'borrowed'}`}>
          {book.isAvailable ? 'Available' : 'On Loan'}
        </span>
        <div className="card-footer">
          <button onClick={() => onEdit(book)} className="btn edit-btn"><Edit size={14} /> Edit</button>
          <button onClick={() => onDelete(book._id)} className="btn delete-btn"><Trash2 size={14} /> Delete</button>
        </div>
      </div>
    </StyledBookCard>
  );
};


// --- Main Page Component ---

const MyBooks = () => {
  const { user } = useContext(AuthContext);
  const userId = user?._id;

  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isBookSearchOpen, setIsBookSearchOpen] = useState(false);

  const fetchMyBooks = useCallback(async (isInitialLoad = false) => {
    if (!userId) { setMyBooks([]); setLoading(false); return; };
    if (isInitialLoad) setLoading(true);
    try { const { data } = await booksAPI.getMyBooks(); setMyBooks(data.books || []); }
    catch (error) { toast.error('Failed to fetch your books.'); }
    finally { if (isInitialLoad) setLoading(false); }
  }, [userId]);

  useEffect(() => {
    fetchMyBooks(true);
  }, [fetchMyBooks]);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setSelectedGoogleBook(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setSelectedGoogleBook(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (bookId) => {
    setBookToDelete(bookId);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingBook(null);
    setSelectedGoogleBook(null);
  };

  const handleCloseDeleteModal = () => {
    setBookToDelete(null);
  };

  const handleSelectBookFromSearch = (bookData) => {
    setSelectedGoogleBook(bookData);
    setEditingBook(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (!userId) {
      toast.error("You must be logged in.");
      return;
    }
    setIsSubmitting(true);
    const data = new FormData();
    const hasGoogleBooksCover = selectedGoogleBook && selectedGoogleBook.coverImage && (!formData.coverImage || formData.coverImage.length === 0);

    for (const key in formData) {
      if (key === 'coverImage') {
        if (formData.coverImage instanceof FileList && formData.coverImage.length > 0) {
          data.append('coverImage', formData.coverImage[0]);
        } else if (hasGoogleBooksCover) {
          data.append('coverImageUrl', selectedGoogleBook.coverImage);
        }
      } else {
        data.append(key, formData[key]);
      }
    }

    try {
      if (editingBook) {
        await booksAPI.update(editingBook._id, data);
        toast.success('Book updated successfully!');
      } else {
        await booksAPI.create(data);
        toast.success('Book added successfully!');
      }
      handleCloseFormModal();
      await fetchMyBooks();
    } catch (error) {
      toast.error(editingBook ? 'Failed to update book.' : 'Failed to add book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userId || !bookToDelete) return;

    try {
      await booksAPI.delete(bookToDelete);
      setMyBooks(prevBooks => prevBooks.filter(book => book._id !== bookToDelete));
      toast.success('Book removed successfully!');
    } catch (error) {
      toast.error('Failed to remove book.');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon-wrapper"> <BookOpen size={48} /> </div>
      <h3 className="empty-title">Your Bookshelf is Empty</h3>
      <p className="empty-message">You haven't added any books yet. Click the button to add your first book and share it with the community!</p>
      <button className="add-book-btn empty" onClick={handleOpenAddModal}>
        <PlusCircle size={20} /> Add Your First Book
      </button>
    </div>
  );

  if (!user) {
    return (
      <StyledWrapper>
        <div className="empty-state">
          <div className="empty-icon-wrapper"> <BookOpen size={48} /> </div>
          <h3 className="empty-title">Please Log In</h3>
          <p className="empty-message">You need to be logged in to manage your bookshelf.</p>
        </div>
      </StyledWrapper>
    )
  }

  return (
    <StyledWrapper>
      <Toaster position="top-right" />
      <div className="page-header">
        <div>
          <h1 className="main-title">My Bookshelf</h1>
          <p className="subtitle">Manage your personal book collection and see their status.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="add-book-btn" onClick={() => setIsBookSearchOpen(true)}>
            <Search size={20} /> Search Online
          </button>
          <button className="add-book-btn" onClick={handleOpenAddModal}>
            <PlusCircle size={20} /> Add Manually
          </button>
        </div>
      </div>
      <div className="content-area">
        {loading ? (
          <div className="loading-state"><Loader className="animate-spin" /></div>
        ) : myBooks.length > 0 ? (
          <div className="books-grid">
            {myBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingBook ? 'Edit Book Details' : 'Add a New Book'}
      >
        <BookForm
          key={selectedGoogleBook ? `selected-${selectedGoogleBook.title}` : editingBook ? `edit-${editingBook._id}` : 'new'}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          initialData={editingBook}
          selectedGoogleBook={selectedGoogleBook}
          setSelectedGoogleBook={setSelectedGoogleBook}
        />
      </Modal>
      <ConfirmationModal
        isOpen={!!bookToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Book"
        message="Are you sure you want to permanently delete this book from your bookshelf? This action cannot be undone."
      />
      
      {/* Book Search Modal */}
      <BookSearchModal
        isOpen={isBookSearchOpen}
        onClose={() => setIsBookSearchOpen(false)}
        onSelectBook={handleSelectBookFromSearch}
      />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  padding: 2rem; max-width: 1400px; margin: 0 auto; font-family: 'Inter', sans-serif;
  .page-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; }
  .main-title { font-size: 2.25rem; font-weight: 800; color: #111827; }
  .subtitle { font-size: 1rem; color: #4b5563; margin-top: 0.25rem; }
  .add-book-btn { display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4F46E5; color: white; font-size: 0.9rem; font-weight: 600; padding: 0.6rem 1.2rem; border: none; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s; &:hover:not(:disabled) { background-color: #4338ca; } }
  .content-area { min-height: 500px; }
  .loading-state { display: flex; justify-content: center; align-items: center; height: 500px; }
  .loading-state .animate-spin { width: 3rem; height: 3rem; color: #4F46E5; }
  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4rem 2rem; background-color: #f9fafb; border-radius: 1rem; border: 1px dashed #d1d5db; }
  .empty-icon-wrapper { width: 5rem; height: 5rem; border-radius: 50%; background-color: #eef2ff; color: #4F46E5; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
  .empty-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
  .empty-message { font-size: 1rem; color: #4b5563; max-width: 500px; margin-top: 0.5rem; margin-bottom: 2rem; }
  .add-book-btn.empty { font-size: 1rem; padding: 0.75rem 1.5rem; }
`;

export default MyBooks;