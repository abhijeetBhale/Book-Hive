import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const DamageReportModal = ({ isOpen, onClose, borrowRequest, onSubmit }) => {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [penaltyPreview, setPenaltyPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const watchSeverity = watch('severity');

  // Calculate penalty preview when severity changes
  useEffect(() => {
    if (watchSeverity && borrowRequest?.book?.condition && borrowRequest?.depositAmount) {
      const penalty = calculatePenaltyPreview(
        borrowRequest.book.condition,
        watchSeverity,
        borrowRequest.depositAmount
      );
      setPenaltyPreview(penalty);
    } else {
      setPenaltyPreview(null);
    }
  }, [watchSeverity, borrowRequest]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedImages([]);
      setImagePreviews([]);
      setPenaltyPreview(null);
    }
  }, [isOpen, reset]);

  const calculatePenaltyPreview = (originalCondition, severity, depositAmount) => {
    // Mirror the backend penalty calculation logic
    const penaltyRules = {
      'new': {
        'minor': 0.10,
        'moderate': 0.30,
        'severe': 0.50
      },
      'good': {
        'minor': 0.05,
        'moderate': 0.20,
        'severe': 0.35
      },
      'worn': {
        'minor': 0.03,
        'moderate': 0.15,
        'severe': 0.20
      }
    };

    const penaltyPercentage = penaltyRules[originalCondition]?.[severity] || 0;
    const calculatedAmount = Math.round(depositAmount * penaltyPercentage * 100) / 100;

    return {
      percentage: penaltyPercentage * 100,
      amount: calculatedAmount,
      explanation: `${penaltyPercentage * 100}% of ₹${depositAmount} security deposit`
    };
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(files);

    // Create previews
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index].url);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleFormSubmit = async (data) => {
    if (selectedImages.length === 0) {
      alert('Please upload at least one image as evidence');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('severity', data.severity);
      formData.append('description', data.description);
      
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting damage report:', error);
      alert('Failed to submit damage report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityOptions = [
    { 
      value: 'minor', 
      label: 'Minor', 
      description: 'Light wear, small marks, or minor damage that doesn\'t affect readability',
      color: 'text-yellow-600'
    },
    { 
      value: 'moderate', 
      label: 'Moderate', 
      description: 'Noticeable damage like bent pages, stains, or writing that affects appearance',
      color: 'text-orange-600'
    },
    { 
      value: 'severe', 
      label: 'Severe', 
      description: 'Significant damage like torn pages, water damage, or missing parts',
      color: 'text-red-600'
    }
  ];

  if (!borrowRequest) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Book Damage">
      <div className="max-w-2xl mx-auto">
        {/* Book Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            {borrowRequest.book?.coverImage && (
              <img 
                src={borrowRequest.book.coverImage} 
                alt={borrowRequest.book.title}
                className="w-16 h-20 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{borrowRequest.book?.title}</h3>
              <p className="text-gray-600">by {borrowRequest.book?.author}</p>
              <p className="text-sm text-gray-500">
                Original condition: <span className="capitalize font-medium">{borrowRequest.book?.condition}</span>
              </p>
              <p className="text-sm text-gray-500">
                Security deposit: ₹{borrowRequest.depositAmount || 0}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Damage Severity */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Damage Severity *
            </label>
            <div className="space-y-3">
              {severityOptions.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...register('severity', { required: 'Please select damage severity' })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${option.color}`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.severity && (
              <p className="text-red-600 text-sm mt-2">{errors.severity.message}</p>
            )}
          </div>

          {/* Penalty Preview */}
          {penaltyPreview && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Penalty Calculation</h4>
              <p className="text-sm text-yellow-700">
                Based on the book's original condition ({borrowRequest.book?.condition}) and {watchSeverity} damage:
              </p>
              <p className="text-lg font-bold text-yellow-800 mt-1">
                ₹{penaltyPreview.amount} ({penaltyPreview.percentage}% of deposit)
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                The borrower will be notified and can accept or dispute this penalty.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Damage Description *
            </label>
            <textarea
              {...register('description', { 
                required: 'Please describe the damage',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
                maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
              })}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe the damage in detail. Include what was damaged, how it happened (if known), and the extent of the damage..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-2">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Damage Evidence (Images) *
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload up to 5 images showing the damage. Clear photos help resolve disputes faster.
            </p>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview.url}
                      alt={`Damage evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {preview.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Important Notice</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The borrower will be notified and have 7 days to respond</li>
              <li>• They can accept the penalty or dispute it for admin review</li>
              <li>• If no response is received, the penalty will be automatically applied</li>
              <li>• False or exaggerated damage reports may result in account penalties</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting || selectedImages.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Damage Report'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DamageReportModal;