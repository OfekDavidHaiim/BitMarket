import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadMultipleImages } = useImageUpload();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || uploading) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    // Filter for image files only
    const imageFiles = filesToUpload.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    try {
      const { urls, errors } = await uploadMultipleImages(imageFiles);
      
      if (errors.length > 0) {
        console.error('Upload errors:', errors);
        alert(`Failed to upload ${errors.length} image(s)`);
      }

      if (urls.length > 0) {
        onImagesChange([...images, ...urls]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Product Images ({images.length}/{maxImages})
      </label>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
            <img 
              src={image} 
              alt={`Product ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
          </div>
        ))}
        
        {/* Upload Area */}
        {images.length < maxImages && (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-sm text-blue-600 text-center px-2">
                  Uploading...
                </span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 text-center px-2">
                  Click or drag images
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages || uploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <span>{uploading ? 'Uploading...' : 'Choose Files'}</span>
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Upload up to {maxImages} images. Images will be stored securely in Supabase Storage.
      </p>
    </div>
  );
};

export default ImageUpload;