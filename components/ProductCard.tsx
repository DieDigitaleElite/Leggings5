
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isSelected, onSelect }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={() => onSelect(product)}
      className={`cursor-pointer transition-all duration-300 border-2 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md ${
        isSelected ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100'
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center">
        {!imageError ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-2 transform transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-400 font-medium">Bild nicht gefunden<br/>({product.imageUrl})</span>
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate text-center">{product.name}</h3>
      </div>
    </div>
  );
};

export default ProductCard;
