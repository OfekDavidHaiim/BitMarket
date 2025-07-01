import React from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';

interface UserRatingProps {
  rating: number;
  totalRatings: number;
  successfulTrades: number;
  responseTime: string;
  className?: string;
}

const UserRating: React.FC<UserRatingProps> = ({ 
  rating, 
  totalRatings, 
  successfulTrades, 
  responseTime, 
  className = '' 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex items-center space-x-1">
          {renderStars(rating)}
        </div>
        <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
        <span className="text-sm text-gray-500">({totalRatings} reviews)</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <ThumbsUp className="w-4 h-4 text-green-500" />
          <div>
            <div className="font-medium text-gray-900">{successfulTrades}</div>
            <div className="text-gray-500">Successful trades</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">{responseTime}</div>
            <div className="text-gray-500">Response time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRating;