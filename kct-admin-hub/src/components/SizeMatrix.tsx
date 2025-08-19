import React, { useState } from 'react';
import { ProductWithVariants, SUIT_SIZES, SHIRT_SIZES, LOW_STOCK_THRESHOLD } from '../types/inventory';

interface SizeMatrixProps {
  product: ProductWithVariants;
  onStockUpdate: (variantId: string, newQuantity: number) => Promise<void>;
}

const SizeMatrix: React.FC<SizeMatrixProps> = ({ product, onStockUpdate }) => {
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Determine if this product uses sizes
  const hasSizeVariants = product.variants.some(v => v.option1);
  const hasColorVariants = product.variants.some(v => v.option2);
  const hasPieceVariants = product.variants.some(v => v.option3);

  // Extract unique properties for building the matrix
  const sizes = [...new Set(product.variants.map(v => v.option1))].filter(Boolean).sort();
  const colors = [...new Set(product.variants.map(v => v.option2))].filter(Boolean);
  const pieceCounts = [...new Set(product.variants.map(v => v.option3))].filter(Boolean);

  // Determine which sizes are relevant
  const relevantSizes = product.category === 'suits' ? SUIT_SIZES : 
                        product.category === 'shirts' ? SHIRT_SIZES : [];

  // Begin editing a variant's stock quantity
  const handleEditClick = (variant: any) => {
    setEditingVariant(variant.id);
    setEditingQuantity(variant.stock_quantity || 0);
    setIsEditing(true);
  };

  // Save the updated stock quantity
  const handleSaveClick = async (variantId: string) => {
    await onStockUpdate(variantId, editingQuantity);
    setEditingVariant(null);
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditingVariant(null);
    setIsEditing(false);
  };

  // Get variant by size, color, and piece count
  const getVariant = (size?: string, color?: string, pieceCount?: string) => {
    return product.variants.find(v => 
      (!size || v.option1 === size) && 
      (!color || v.option2 === color) &&
      (!pieceCount || v.option3 === pieceCount)
    );
  };

  // Get stock level class for color-coding
  const getStockLevelClass = (quantity: number | undefined) => {
    if (quantity === undefined) return 'bg-gray-100 text-gray-400';
    if (quantity === 0) return 'bg-red-100 text-red-700';
    if (quantity <= LOW_STOCK_THRESHOLD) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  // If no size variants, show a simple list
  if (!hasSizeVariants) {
    return (
      <div className="p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              {hasColorVariants && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {product.variants.map(variant => (
              <tr key={variant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {variant.title || product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {variant.sku || 'N/A'}
                </td>
                {hasColorVariants && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.option2 || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingVariant === variant.id ? (
                    <input
                      type="number"
                      min="0"
                      className="w-20 p-1 border border-gray-300 rounded-md"
                      value={editingQuantity}
                      onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockLevelClass(variant.stock_quantity)}`}>
                      {variant.stock_quantity !== undefined ? variant.stock_quantity : 'N/A'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingVariant === variant.id ? (
                    <div className="flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 text-xs"
                        onClick={() => handleSaveClick(variant.id)}
                      >
                        Save
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 text-xs"
                        onClick={handleCancelClick}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-indigo-600 hover:text-indigo-900 text-xs"
                      onClick={() => handleEditClick(variant)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // For suit products with piece variants (2-piece/3-piece)
  if (hasPieceVariants) {
    return (
      <div className="p-4 overflow-x-auto">
        {pieceCounts.map(pieceCount => (
          <div key={pieceCount} className="mb-6">
            <h4 className="text-md font-medium mb-2">{pieceCount}-Piece</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size / Color</th>
                  {colors.map(color => (
                    <th key={color} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {color}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relevantSizes.map(size => {
                  // Check if any variants exist for this size
                  const hasVariantsForSize = colors.some(color => {
                    return getVariant(size, color, pieceCount);
                  });
                  
                  if (!hasVariantsForSize) return null;
                  
                  return (
                    <tr key={size}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {size}
                      </td>
                      {colors.map(color => {
                        const variant = getVariant(size, color, pieceCount);
                        return (
                          <td key={`${size}-${color}`} className="px-4 py-2 whitespace-nowrap text-center">
                            {variant ? (
                              editingVariant === variant.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  className="w-16 p-1 border border-gray-300 rounded-md"
                                  value={editingQuantity}
                                  onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveClick(variant.id);
                                    } else if (e.key === 'Escape') {
                                      handleCancelClick();
                                    }
                                  }}
                                />
                              ) : (
                                <span 
                                  className={`inline-flex justify-center items-center w-10 h-6 rounded text-xs font-medium cursor-pointer ${getStockLevelClass(variant.stock_quantity)}`}
                                  onClick={() => handleEditClick(variant)}
                                >
                                  {variant.stock_quantity !== undefined ? variant.stock_quantity : 'N/A'}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  // For products with just size and color (shirts)
  return (
    <div className="p-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size / Color</th>
            {colors.map(color => (
              <th key={color} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {color}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {relevantSizes.map(size => {
            // Check if any variants exist for this size
            const hasVariantsForSize = colors.some(color => {
              return getVariant(size, color);
            });
            
            if (!hasVariantsForSize) return null;
            
            return (
              <tr key={size}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {size}
                </td>
                {colors.map(color => {
                  const variant = getVariant(size, color);
                  return (
                    <td key={`${size}-${color}`} className="px-4 py-2 whitespace-nowrap text-center">
                      {variant ? (
                        editingVariant === variant.id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              className="w-16 p-1 border border-gray-300 rounded-md"
                              value={editingQuantity}
                              onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveClick(variant.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelClick();
                                }
                              }}
                            />
                            <div className="flex flex-col space-y-1">
                              <button 
                                className="text-xs bg-indigo-500 text-white px-1 rounded" 
                                onClick={() => handleSaveClick(variant.id)}
                              >
                                ✓
                              </button>
                              <button 
                                className="text-xs bg-gray-300 text-gray-700 px-1 rounded" 
                                onClick={handleCancelClick}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span 
                            className={`inline-flex justify-center items-center w-10 h-6 rounded text-xs font-medium cursor-pointer ${getStockLevelClass(variant.stock_quantity)}`}
                            onClick={() => handleEditClick(variant)}
                          >
                            {variant.stock_quantity !== undefined ? variant.stock_quantity : 'N/A'}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SizeMatrix;
