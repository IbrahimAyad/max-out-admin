import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface MarketIntelligenceProps {
  timeframe: string;
}

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ timeframe }) => {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-intelligence', timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-intelligence', {
          body: {
            intelligence_type: 'competitive',
            market_segments: ['menswear', 'luxury', 'online'],
            analysis_depth: 'comprehensive'
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Market Intelligence API Error:', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const data = marketData?.data || marketData;

  return (
    <div className="space-y-8">
      {/* Market Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Globe className="h-6 w-6 text-blue-500 mr-2" />
          Market Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Market Size</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${((data?.market_overview?.total_market_size || 0) / 1000000).toFixed(0)}M
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Market Growth</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{((data?.market_overview?.growth_rate || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Our Market Share</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {((data?.market_overview?.our_market_share || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Position</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {data?.market_overview?.competitive_position || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="h-6 w-6 text-red-500 mr-2" />
          Competitive Analysis
        </h3>
        
        <div className="space-y-6">
          {data?.competitive_analysis?.map((competitor: any, index: number) => {
            const threatColors = {
              high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
              medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
              low: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            };
            
            const threatTextColors = {
              high: 'text-red-800 dark:text-red-300',
              medium: 'text-amber-800 dark:text-amber-300',
              low: 'text-emerald-800 dark:text-emerald-300'
            };
            
            return (
              <div key={index} className={`p-6 rounded-xl border-l-4 ${threatColors[competitor.threat_level as keyof typeof threatColors]}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{competitor.competitor}</h4>
                    <p className={`text-sm font-medium ${threatTextColors[competitor.threat_level as keyof typeof threatTextColors]}`}>
                      {competitor.threat_level.toUpperCase()} THREAT
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Market Share</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(competitor.market_share * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {competitor.strengths?.map((strength: string, sIndex: number) => (
                        <li key={sIndex} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          {strength}
                        </li>
                      )) || []}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-red-800 dark:text-red-300 mb-2">Weaknesses</h5>
                    <ul className="space-y-1">
                      {competitor.weaknesses?.map((weakness: string, wIndex: number) => (
                        <li key={wIndex} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          {weakness}
                        </li>
                      )) || []}
                    </ul>
                  </div>
                </div>
              </div>
            );
          }) || []}
        </div>
      </div>

      {/* Market Trends & Pricing Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-emerald-500 mr-2" />
            Market Trends
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4">Growing Segments</h4>
              <div className="space-y-3">
                {data?.market_trends?.growing_segments?.map((segment: any, index: number) => (
                  <div key={index} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-emerald-900 dark:text-emerald-300">{segment.segment}</h5>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{(segment.growth_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Opportunity: ${(segment.opportunity_size / 1000000).toFixed(1)}M
                    </p>
                  </div>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-4">Declining Segments</h4>
              <div className="space-y-3">
                {data?.market_trends?.declining_segments?.map((segment: any, index: number) => (
                  <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-red-900 dark:text-red-300">{segment.segment}</h5>
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {(segment.decline_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Risk Level: {segment.risk_level}
                    </p>
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Intelligence */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <DollarSign className="h-6 w-6 text-blue-500 mr-2" />
            Pricing Intelligence
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Our Avg Price</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${data?.pricing_intelligence?.our_avg_price || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Avg</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${data?.pricing_intelligence?.market_avg_price || 0}
                </p>
              </div>
            </div>
            
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price Positioning</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {data?.pricing_intelligence?.price_positioning || 'N/A'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Premium Opportunities</h4>
              <div className="space-y-3">
                {data?.pricing_intelligence?.premium_opportunities?.map((opp: any, index: number) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    <h5 className="font-medium text-purple-900 dark:text-purple-300">{opp.category}</h5>
                    <div className="flex justify-between items-center mt-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        ${opp.current_price} → ${opp.market_ceiling}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        +{(opp.potential_uplift * 100).toFixed(0)}% uplift
                      </span>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Lightbulb className="h-6 w-6 text-amber-500 mr-2" />
          SWOT Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths & Weaknesses */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                Strengths
              </h4>
              <div className="space-y-2">
                {data?.swot_analysis?.strengths?.map((strength: string, index: number) => (
                  <div key={index} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm text-emerald-800 dark:text-emerald-300">
                    {strength}
                  </div>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Weaknesses
              </h4>
              <div className="space-y-2">
                {data?.swot_analysis?.weaknesses?.map((weakness: string, index: number) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-300">
                    {weakness}
                  </div>
                )) || []}
              </div>
            </div>
          </div>
          
          {/* Opportunities & Threats */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Opportunities
              </h4>
              <div className="space-y-2">
                {data?.swot_analysis?.opportunities?.map((opportunity: string, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    {opportunity}
                  </div>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-4 flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                Threats
              </h4>
              <div className="space-y-2">
                {data?.swot_analysis?.threats?.map((threat: string, index: number) => (
                  <div key={index} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                    {threat}
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MarketIntelligence };