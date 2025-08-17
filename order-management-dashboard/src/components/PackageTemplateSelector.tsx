import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, ChevronDown, Star, AlertCircle, CheckCircle, Box } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShippingTemplate {
  id: number;
  name: string;
  template_code: string;
  length_inches: number;
  width_inches: number;
  height_inches: number;
  max_weight_lbs: number;
  package_type: string;
  description: string;
  recommended_for: string[];
  score?: number;
  reasons?: string[];
  recommendation_level?: string;
  canHandleWeight?: boolean;
}

interface PackageTemplateSelectorProps {
  orderItems: any[];
  selectedTemplate: ShippingTemplate | null;
  onTemplateSelected: (template: ShippingTemplate) => void;
  estimatedWeight?: number;
}

const PackageTemplateSelector: React.FC<PackageTemplateSelectorProps> = ({
  orderItems,
  selectedTemplate,
  onTemplateSelected,
  estimatedWeight = 1
}) => {
  const [templates, setTemplates] = useState<ShippingTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<ShippingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);

  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      fetchTemplateRecommendations();
    }
  }, [orderItems, estimatedWeight]);

  const fetchTemplateRecommendations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('shipping-template-recommendation', {
        body: {
          orderItems,
          totalWeight: estimatedWeight
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setTemplates(data.allTemplates || []);
      
      // Auto-select the top recommendation if none selected
      if (!selectedTemplate && data.recommendations && data.recommendations.length > 0) {
        const topRecommendation = data.recommendations[0];
        if (topRecommendation.recommendation_level === 'highly_recommended') {
          onTemplateSelected(topRecommendation);
        }
      }
      
    } catch (error) {
      console.error('Error fetching template recommendations:', error);
      toast.error('Failed to load package recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadge = (level: string) => {
    switch (level) {
      case 'highly_recommended':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Star className="w-3 h-3 mr-1" />
            Highly Recommended
          </span>
        );
      case 'recommended':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recommended
          </span>
        );
      case 'possible':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Possible
          </span>
        );
      default:
        return null;
    }
  };

  const formatDimensions = (template: ShippingTemplate) => {
    return `${template.length_inches}" × ${template.width_inches}" × ${template.height_inches}"`;
  };

  const renderTemplateCard = (template: ShippingTemplate, isRecommendation = false) => {
    const isSelected = selectedTemplate?.id === template.id;
    const isExpanded = expandedTemplate === template.id;
    
    return (
      <div
        key={template.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => onTemplateSelected(template)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Box className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              {isRecommendation && template.recommendation_level && (
                <div>{getRecommendationBadge(template.recommendation_level)}</div>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Dimensions:</strong> {formatDimensions(template)}</p>
              <p><strong>Max Weight:</strong> {template.max_weight_lbs} lbs</p>
              <p><strong>Type:</strong> {template.package_type}</p>
              
              {!template.canHandleWeight && estimatedWeight > template.max_weight_lbs && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">Weight limit exceeded ({estimatedWeight} lbs)</span>
                </div>
              )}
            </div>
            
            {template.description && (
              <p className="text-sm text-gray-500 mt-2">{template.description}</p>
            )}
            
            {isRecommendation && template.reasons && template.reasons.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTemplate(isExpanded ? null : template.id);
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <span>Why recommended?</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {isExpanded && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    <ul className="space-y-1">
                      {template.reasons.map((reason, index) => (
                        <li key={index}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isSelected && (
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading package recommendations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Package Template Selection</h3>
        </div>
        
        {selectedTemplate && (
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">{selectedTemplate.name}</span>
          </div>
        )}
      </div>

      {/* Order Analysis */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Order Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Items:</span>
            <p className="font-medium">{orderItems.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Est. Weight:</span>
            <p className="font-medium">{estimatedWeight} lbs</p>
          </div>
          <div>
            <span className="text-gray-600">Recommendations:</span>
            <p className="font-medium">{recommendations.length} found</p>
          </div>
          <div>
            <span className="text-gray-600">Total Templates:</span>
            <p className="font-medium">{templates.length} available</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Recommended Templates
          </h4>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map(template => renderTemplateCard(template, true))}
          </div>
        </div>
      )}

      {/* All Templates Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAllTemplates(!showAllTemplates)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <span>{showAllTemplates ? 'Hide' : 'Show'} All Templates</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAllTemplates ? 'rotate-180' : ''}`} />
        </button>
        
        {showAllTemplates && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">All Available Templates</h4>
            {templates.map(template => renderTemplateCard(template, false))}
          </div>
        )}
      </div>

      {!selectedTemplate && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Please select a package template to continue with shipping rate calculation.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTemplateSelector;