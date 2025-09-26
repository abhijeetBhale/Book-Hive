import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../../utils/constants';

const BookForm = ({ onSubmit, initialData = {}, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData,
  });
  const [coverPreview, setCoverPreview] = useState(initialData.coverImage || null);

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverPreview(URL.createObjectURL(file));
    }
  };

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
              className="h-5 w-5 text-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20 border-2 border-gray-300 rounded-lg"
            />
            <label htmlFor="forBorrowing" className="ml-3 block text-lg font-bold text-gray-900">
              Available for borrowing
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