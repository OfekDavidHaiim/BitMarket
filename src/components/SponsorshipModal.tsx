import React, { useState } from 'react';
import { X, Star, Zap, CreditCard, Check } from 'lucide-react';

interface SponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number) => void;
  productTitle: string;
}

const SponsorshipModal: React.FC<SponsorshipModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productTitle
}) => {
  const [selectedPlan, setSelectedPlan] = useState<number>(7);
  const [isProcessing, setIsProcessing] = useState(false);

  const sponsorshipPlans = [
    {
      duration: 3,
      price: 0.01,
      currency: 'ETH',
      usdPrice: 20,
      features: ['3 days at top', 'Basic highlighting', '2x visibility']
    },
    {
      duration: 7,
      price: 0.02,
      currency: 'ETH',
      usdPrice: 40,
      features: ['7 days at top', 'Premium highlighting', '5x visibility', 'Featured badge'],
      popular: true
    },
    {
      duration: 14,
      price: 0.035,
      currency: 'ETH',
      usdPrice: 70,
      features: ['14 days at top', 'Premium highlighting', '10x visibility', 'Featured badge', 'Priority support']
    }
  ];

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onConfirm(selectedPlan);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <span>Sponsor Your Listing</span>
            </h2>
            <p className="text-gray-600 mt-1">Boost visibility for "{productTitle}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>Sponsorship Benefits</span>
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your listing appears at the top of search results</li>
              <li>• Highlighted with special badges and styling</li>
              <li>• Increased visibility to potential buyers</li>
              <li>• Higher engagement and faster sales</li>
            </ul>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {sponsorshipPlans.map((plan) => (
              <div
                key={plan.duration}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.duration
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setSelectedPlan(plan.duration)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.duration} days
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {plan.price} {plan.currency}
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ ${plan.usdPrice}
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.duration && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span>Payment Method</span>
            </h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">ETH</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Ethereum Wallet</div>
                <div className="text-sm text-gray-500">Payment will be processed via MetaMask</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  <span>Sponsor for {sponsorshipPlans.find(p => p.duration === selectedPlan)?.price} ETH</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorshipModal;