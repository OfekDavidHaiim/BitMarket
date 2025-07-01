import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  className?: string;
}

interface SearchFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  sortBy: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    currency: 'all',
    sortBy: 'newest'
  });

  const categories = ['all', 'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Other'];
  const currencies = ['all', 'ETH', 'USDT', 'BTC'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      minPrice: '',
      maxPrice: '',
      currency: 'all',
      sortBy: 'newest'
    };
    setFilters(clearedFilters);
    onSearch(query, clearedFilters);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Main Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search products, brands, or keywords..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-blue-50 border-blue-200 text-blue-600' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency === 'all' ? 'All Currencies' : currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="10.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;