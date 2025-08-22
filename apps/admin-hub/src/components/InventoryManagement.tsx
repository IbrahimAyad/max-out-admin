import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { ProductWithVariants, InventoryFilters, SUIT_SIZES, SHIRT_SIZES, SUIT_COLORS, LOW_STOCK_THRESHOLD } from '../types/inventory';
import SizeMatrix from './SizeMatrix';

const InventoryManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    category: '',
    subcategory: '',
    search: '',
    size: '',
    color: '',
    stockStatus: 'all'
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  // Fetch products and their variants
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (productsError) throw productsError;

        // Fetch all variants for these products
        const { data: variantsData, error: variantsError } = await supabase
          .from('enhanced_product_variants')
          .select('*');

        if (variantsError) throw variantsError;

        console.log('Products data:', productsData);
        console.log('Variants data:', variantsData);

        // Group variants by product_id
        const variantsByProduct = variantsData.reduce((acc, variant) => {
          if (!acc[variant.product_id]) {
            acc[variant.product_id] = [];
          }
          acc[variant.product_id].push(variant);
          return acc;
        }, {} as Record<string, any[]>);

        // Combine products with their variants
        const productsWithVariants = productsData.map(product => ({
          ...product,
          variants: variantsByProduct[product.id] || []
        }));

        setProducts(productsWithVariants);

        // Extract unique categories and subcategories
        const uniqueCategories = [...new Set(productsData.map(p => p.category))].filter(Boolean);
        const uniqueSubcategories = [...new Set(productsData.map(p => p.subcategory))].filter(Boolean);
        
        setCategories(uniqueCategories as string[]);
        setSubcategories(uniqueSubcategories as string[]);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on current filters
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }

      // Search by name
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Size filter
      if (filters.size) {
        const hasSizeVariant = product.variants.some(variant => 
          variant.size === filters.size
        );
        if (!hasSizeVariant) return false;
      }

      // Color filter
      if (filters.color) {
        const hasColorVariant = product.variants.some(variant => 
          variant.color === filters.color
        );
        if (!hasColorVariant) return false;
      }

      // Stock status filter
      if (filters.stockStatus !== 'all') {
        const variantsMatchingStockStatus = product.variants.filter(variant => {
          const stockLevel = variant.inventory_quantity || 0;
          
          switch (filters.stockStatus) {
            case 'in-stock':
              return stockLevel > 0;
            case 'low-stock':
              return stockLevel > 0 && stockLevel <= LOW_STOCK_THRESHOLD;
            case 'out-of-stock':
              return stockLevel === 0;
            default:
              return true;
          }
        });
        
        if (variantsMatchingStockStatus.length === 0) return false;
      }

      return true;
    });
  }, [products, filters]);

  // Handle stock quantity update
  const handleStockUpdate = async (variantId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('enhanced_product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', variantId);

      if (error) throw error;

      // Update local state
      setProducts(prevProducts => {
        return prevProducts.map(product => {
          const updatedVariants = product.variants.map(variant => {
            if (variant.id === variantId) {
              return { ...variant, inventory_quantity: newQuantity };
            }
            return variant;
          });

          return { ...product, variants: updatedVariants };
        });
      });
    } catch (error) {
      console.error('Error updating stock quantity:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Subcategory filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.subcategory}
              onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}
            >
              <option value="">All Subcategories</option>
              {subcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>
          
          {/* Size filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.size}
              onChange={(e) => setFilters({ ...filters, size: e.target.value })}
            >
              <option value="">All Sizes</option>
              <optgroup label="Suit Sizes">
                {SUIT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </optgroup>
              <optgroup label="Shirt Sizes">
                {SHIRT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Color filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.color}
              onChange={(e) => setFilters({ ...filters, color: e.target.value })}
            >
              <option value="">All Colors</option>
              {SUIT_COLORS.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          
          {/* Stock Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value as any })}
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Products with Size Matrix */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading inventory data...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-700">No products found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or adding new products.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    Total Stock: <span className="font-medium">{product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku || 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Size Matrix for this product */}
              <SizeMatrix 
                product={product} 
                onStockUpdate={handleStockUpdate} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
