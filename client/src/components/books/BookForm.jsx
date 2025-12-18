import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../../utils/constants';

const BookForm = ({ onSubmit, initialData = {}, isSubmitting }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      forBorrowing: initialData.forBorrowing !== undefined ? initialData.forBorrowing : true,
      lendingFee: initialData.lendingFee || 0,
      lendingDuration: initialData.lendingDuration || 14,
      ...initialData,
    },
  });
  const [coverPreview, setCoverPreview] = useState(initialData.coverImage || null);
  const [priceValidation, setPriceValidation] = useState(null);
  const [isValidatingPrice, setIsValidatingPrice] = useState(false);
  
  const watchForBorrowing = watch('forBorrowing');
  const watchForSelling = watch('forSelling');
  const watchSellingPrice = watch('sellingPrice');

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const validatePrice = async () => {
    const formData = watch();
    if (!formData.title || !formData.author || !formData.sellingPrice) {
      return;
    }

    setIsValidatingPrice(true);
    try {
      const response = await fetch('/api/books/validate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          sellingPrice: parseFloat(formData.sellingPrice),
          condition: formData.condition
        })
      });
      
      const result = await response.json();
      setPriceValidation(result);
    } catch (error) {
      console.error('Price validation error:', error);
      setPriceValidation({
        error: 'Failed to validate price. Please check manually.'
      });
    } finally {
      setIsValidatingPrice(false);
    }
  };

  useEffect(() => {
    if (watchForSelling && watchSellingPrice && parseFloat(watchSellingPrice) > 0) {
      const timeoutId = setTimeout(validatePrice, 1000); // Debounce validation
      return () => clearTimeout(timeoutId);
    }
  }, [watchSellingPrice, watchForSelling]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Title *</label>
          <input 
            {...register('title', { required: 'Title is required' })} 
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
            placeholder="Enter book title"
          />
          {errors.title && <p className="text-red-600 text-sm mt-2 font-medium">{errors.title.message}</p>}
        </div>
        
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Author *</label>
          <input 
            {...register('author', { required: 'Author is required' })} 
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
            placeholder="Enter author name"
          />
          {errors.author && <p className="text-red-600 text-sm mt-2 font-medium">{errors.author.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Category *</label>
          <select 
            {...register('category', { required: 'Category is required' })} 
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg bg-white transition-all duration-200"
          >
            <option value="">Select a category</option>
            {BOOK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {errors.category && <p className="text-red-600 text-sm mt-2 font-medium">{errors.category.message}</p>}
        </div>
        
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Publication Year</label>
          <input 
            type="number" 
            {...register('publicationYear')} 
            min="1800" 
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
            placeholder="e.g., 2020"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">ISBN</label>
          <input 
            {...register('isbn')} 
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
            placeholder="Enter ISBN (optional)"
          />
        </div>
        
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Book Condition</label>
          <select 
            {...register('condition')} 
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg bg-white transition-all duration-200"
          >
            <option value="">Select condition</option>
            {BOOK_CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">Description *</label>
        <textarea 
          {...register('description', { required: 'Description is required' })} 
          rows="4" 
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200"
          placeholder="Provide a brief description of the book..."
        />
        {errors.description && <p className="text-red-600 text-sm mt-2 font-medium">{errors.description.message}</p>}
      </div>

      {/* Lending Duration, Lending Fee and Selling Price */}
      {(watchForBorrowing || watchForSelling) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {watchForBorrowing && (
            <>
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">Lending Duration (Days)</label>
                <input 
                  type="number" 
                  {...register('lendingDuration', { 
                    min: { value: 1, message: 'Minimum 1 day' },
                    max: { value: 365, message: 'Maximum 365 days' }
                  })} 
                  min="1" 
                  max="365"
                  defaultValue={initialData.lendingDuration || 14}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
                  placeholder="e.g., 14"
                />
                {errors.lendingDuration && <p className="text-red-600 text-sm mt-2 font-medium">{errors.lendingDuration.message}</p>}
                <p className="text-sm text-gray-600 mt-2">How many days can borrowers keep this book?</p>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">Lending Fee (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('lendingFee', { 
                    min: { value: 0, message: 'Fee cannot be negative' },
                    valueAsNumber: true
                  })} 
                  min="0"
                  defaultValue={initialData.lendingFee || 0}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#10B981]/20 focus:border-[#10B981] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
                  placeholder="e.g., 10.00"
                />
                {errors.lendingFee && <p className="text-red-600 text-sm mt-2 font-medium">{errors.lendingFee.message}</p>}
                <p className="text-sm text-gray-600 mt-2">
                  Set a fee for borrowers to support the book sharing community. Set 0 for free lending.
                </p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 Recommended: ₹5-₹20 for most books
                  </p>
                </div>
              </div>
            </>
          )}
          
          {watchForSelling && (
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">Selling Price (₹) *</label>
              <input 
                type="number" 
                step="0.01"
                {...register('sellingPrice', { 
                  required: watchForSelling ? 'Selling price is required when selling' : false,
                  min: { value: 0.01, message: 'Price must be greater than $0' }
                })} 
                min="0.01"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#10B981]/20 focus:border-[#10B981] text-gray-900 font-medium text-lg placeholder-gray-500 transition-all duration-200" 
                placeholder="e.g., 15.99"
              />
              {errors.sellingPrice && <p className="text-red-600 text-sm mt-2 font-medium">{errors.sellingPrice.message}</p>}
              
              {/* Price Validation */}
              {watchForSelling && watchSellingPrice && (
                <div className="mt-3">
                  {isValidatingPrice && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm">Validating price...</span>
                    </div>
                  )}
                  
                  {priceValidation && !isValidatingPrice && (
                    <div className={`p-3 rounded-xl border ${
                      priceValidation.error 
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : priceValidation.priceComparison?.isReasonable 
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                      {priceValidation.error ? (
                        <p className="text-sm font-medium">{priceValidation.error}</p>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">{priceValidation.recommendation?.message}</p>
                          {priceValidation.recommendation?.suggestion && (
                            <p className="text-xs mt-1">{priceValidation.recommendation.suggestion}</p>
                          )}
                          {priceValidation.priceComparison && (
                            <p className="text-xs mt-1">
                              Market price: ₹{priceValidation.priceComparison.marketPrice?.toFixed(2)} | 
                              Your price: ₹{priceValidation.priceComparison.userPrice}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-600 mt-2">
                BookHive promotes affordable books. We'll validate your price against market rates.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">Cover Image</label>
          <input 
            type="file" 
            accept="image/*"
            {...register('coverImage')} 
            onChange={handleCoverChange} 
            className="w-full text-lg text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-lg file:font-bold file:bg-gradient-to-r file:from-[#4F46E5]/10 file:to-purple-100 file:text-[#4F46E5] hover:file:from-[#4F46E5]/20 hover:file:to-purple-200 transition-all duration-200 cursor-pointer"
          />
          {coverPreview && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
              <img src={coverPreview} alt="Cover preview" className="h-48 w-auto rounded-2xl object-cover shadow-lg mx-auto" />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gradient-to-r from-[#4F46E5]/5 to-purple-50 rounded-2xl border border-[#4F46E5]/20">
            <input
              type="checkbox"
              id="forBorrowing"
              {...register('forBorrowing')}
              defaultChecked={initialData.forBorrowing !== undefined ? initialData.forBorrowing : true}
              className="h-5 w-5 text-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20 border-2 border-gray-300 rounded-lg"
            />
            <label htmlFor="forBorrowing" className="ml-3 block text-lg font-bold text-gray-900">
              Available for borrowing
            </label>
          </div>
          
          <div className="flex items-center p-4 bg-gradient-to-r from-[#10B981]/5 to-green-50 rounded-2xl border border-[#10B981]/20">
            <input
              type="checkbox"
              id="forSelling"
              {...register('forSelling')}
              className="h-5 w-5 text-[#10B981] focus:ring-4 focus:ring-[#10B981]/20 border-2 border-gray-300 rounded-lg"
            />
            <label htmlFor="forSelling" className="ml-3 block text-lg font-bold text-gray-900">
              Available for selling
            </label>
          </div>
          
          <div className="flex items-center p-4 bg-gradient-to-r from-[#F43F5E]/5 to-pink-50 rounded-2xl border border-[#F43F5E]/20">
            <input
              type="checkbox"
              id="isAvailable"
              {...register('isAvailable')}
              defaultChecked={true}
              className="h-5 w-5 text-[#F43F5E] focus:ring-4 focus:ring-[#F43F5E]/20 border-2 border-gray-300 rounded-lg"
            />
            <label htmlFor="isAvailable" className="ml-3 block text-lg font-bold text-gray-900">
              Currently available
            </label>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full py-4 bg-gradient-to-r from-[#4F46E5] to-purple-600 text-white font-bold rounded-2xl hover:from-[#4F46E5]/90 hover:to-purple-600/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Book'}
      </Button>
    </form>
  );
};

export default BookForm;