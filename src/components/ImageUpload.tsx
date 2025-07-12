import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { useAuth } from '../contexts/AuthContext';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<{ canUpload: boolean; error: string | null } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadMultipleImages, checkStoragePermissions } = useImageUpload();
  const { user } = useAuth();

  // Check storage permissions on component mount and when user changes
  useEffect(() => {
    if (user) {
      checkStorageStatus();
    }
  }, [user]);

  const checkStorageStatus = async () => {
    const status = await checkStoragePermissions();
    setStorageStatus(status);
    if (!status.canUpload && status.error) {
      setUploadError(status.error);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || uploading) return;

    // Check authentication first
    if (!user) {
      setUploadError('Please log in to upload images');
      return;
    }

    // Check storage status before attempting upload
    if (storageStatus && !storageStatus.canUpload) {
      setUploadError(storageStatus.error || 'Storage access not available');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Filter for image files only
    const imageFiles = filesToUpload.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setUploadError('Please select only image files (JPG, PNG, WebP, GIF)');
      return;
    }

    if (imageFiles.length !== filesToUpload.length) {
      setUploadError(`${filesToUpload.length - imageFiles.length} non-image files were skipped`);
    }

    try {
      console.log('Starting upload of', imageFiles.length, 'images');
      const { urls, errors } = await uploadMultipleImages(imageFiles);
      
      if (errors.length > 0) {
        console.error('Upload errors:', errors);
        
        // Show the first error with more context
        const firstError = errors[0];
        if (firstError.includes('Storage bucket') && firstError.includes('not found')) {
          setUploadError('Storage bucket not configured. Please create the "product-images" bucket in your Supabase Dashboard.');
        } else if (firstError.includes('Storage access denied') || firstError.includes('Supabase URL/Anon Key')) {
          setUploadError('Storage configuration error. Please check your environment variables and restart the development server.');
        } else if (firstError.includes('RLS policies')) {
          setUploadError('Storage permissions not configured. Please apply the required RLS policies in your Supabase Dashboard.');
        } else {
          setUploadError(`Upload failed: ${firstError}`);
        }
        
        // If multiple errors, show count
        if (errors.length > 1) {
          setUploadError(prev => `${prev} (${errors.length} files failed)`);
        }
      }

      if (urls.length > 0) {
        console.log('Successfully uploaded', urls.length, 'images');
        onImagesChange([...images, ...urls]);
        
        if (errors.length === 0) {
          setUploadError(null);
          setUploadSuccess(`Successfully uploaded ${urls.length} image(s)`);
          setRetryCount(0); // Reset retry count on success
          // Clear success message after 3 seconds
          setTimeout(() => setUploadSuccess(null), 3000);
        }
      } else if (errors.length > 0) {
        setUploadError('All uploads failed. Please check your Supabase configuration.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Upload failed. Please try again or check your configuration.');
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setUploadError(null);
    await checkStorageStatus();
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
    setUploadError(null);
    setUploadSuccess(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Product Images ({images.length}/{maxImages})
      </label>
      
      {/* Authentication Warning */}
      {!user && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-700">Please log in to upload images</p>
          </div>
        </div>
      )}

      {/* Storage Status Warning */}
      {user && storageStatus && !storageStatus.canUpload && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">Storage Configuration Issue</p>
            <p className="text-sm text-red-600 mt-1">{storageStatus.error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 flex items-center space-x-1 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{uploadError}</p>
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="mt-2 flex items-center space-x-1 text-sm text-red-700 hover:text-red-800 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again ({3 - retryCount} attempts left)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Display */}
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-700">{uploadSuccess}</p>
          </div>
        </div>
      )}
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
            <img 
              src={image} 
              alt={`Product ${index + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image load error:', image);
                e.currentTarget.src = 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500&h=300&fit=crop';
              }}
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
            } ${uploading || !user || (storageStatus && !storageStatus.canUpload) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => user && !uploading && storageStatus?.canUpload && fileInputRef.current?.click()}
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
                  {!user 
                    ? 'Login to upload' 
                    : storageStatus && !storageStatus.canUpload
                    ? 'Storage unavailable'
                    : 'Click or drag images'
                  }
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
        disabled={uploading || !user || (storageStatus && !storageStatus.canUpload)}
      />

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages || uploading || !user || (storageStatus && !storageStatus.canUpload)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <span>
            {uploading 
              ? 'Uploading...' 
              : !user 
              ? 'Login Required' 
              : storageStatus && !storageStatus.canUpload
              ? 'Storage Unavailable'
              : 'Choose Files'
            }
          </span>
        </button>

        {user && storageStatus && !storageStatus.canUpload && (
          <button
            type="button"
            onClick={checkStorageStatus}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Storage</span>
          </button>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-500">
          Upload up to {maxImages} images. Supported formats: JPG, PNG, WebP, GIF (max 10MB each)
        </p>
        {images.length === 0 && (
          <p className="text-sm text-orange-600">
            ⚠️ At least one image is required to create a listing
          </p>
        )}
        {!user && (
          <p className="text-sm text-red-600">
            🔒 You must be logged in to upload images
          </p>
        )}
        {user && storageStatus && !storageStatus.canUpload && (
          <p className="text-sm text-red-600">
            🔧 Storage configuration required - check Supabase setup
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;