Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { 
      weddingId, 
      action, // 'analyze', 'recommend', 'validate', 'optimize'
      preferences = {},
      budgetConstraints = {}
    } = requestData;
    
    // Validate required fields
    if (!weddingId || !action) {
      throw new Error('Missing required fields: weddingId, action');
    }
    
    // Get wedding details and party data
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select(`
        *,
        wedding_party_members(
          *,
          user_profiles(full_name, email),
          wedding_outfits(*),
          wedding_measurements(*)
        )
      `)
      .eq('id', weddingId)
      .single();
      
    if (weddingError || !wedding) {
      throw new Error('Wedding not found');
    }
    
    const partyMembers = wedding.wedding_party_members || [];
    
    // Get available products for recommendations
    const { data: availableProducts, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*)
      `)
      .eq('category', 'formal-wear')
      .eq('is_active', true);
      
    if (productsError) {
      console.error('Failed to fetch products:', productsError);
    }
    
    // AI Coordination Logic
    const coordinationResults = await performOutfitCoordination(
      action,
      wedding,
      partyMembers,
      availableProducts || [],
      preferences,
      budgetConstraints
    );
    
    // Store analysis results
    const { error: analyticsError } = await supabase
      .from('wedding_analytics')
      .insert({
        wedding_id: weddingId,
        analysis_type: 'outfit_coordination',
        analysis_data: {
          action,
          results: coordinationResults,
          party_size: partyMembers.length,
          preferences,
          budget_constraints: budgetConstraints,
        },
        insights: coordinationResults.insights || [],
        recommendations: coordinationResults.recommendations || [],
      });
      
    if (analyticsError) {
      console.error('Failed to store analytics:', analyticsError);
    }
    
    return new Response(
      JSON.stringify({
        data: coordinationResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('AI outfit coordination error:', error);
    
    const errorResponse = {
      error: {
        code: 'AI_COORDINATION_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// AI Outfit Coordination Engine
async function performOutfitCoordination(
  action,
  wedding,
  partyMembers,
  availableProducts,
  preferences,
  budgetConstraints
) {
  const weddingStyle = wedding.style || preferences.style || 'classic';
  const colorScheme = wedding.color_scheme || preferences.colors || ['navy', 'gray'];
  const formalityLevel = wedding.formality_level || preferences.formality || 'formal';
  const budget = budgetConstraints.maxBudget || 10000;
  const budgetPerPerson = budgetConstraints.maxPerPerson || budget / partyMembers.length;
  
  switch (action) {
    case 'analyze':
      return analyzeCurrentCoordination(wedding, partyMembers, colorScheme, formalityLevel);
      
    case 'recommend':
      return generateRecommendations(wedding, partyMembers, availableProducts, {
        style: weddingStyle,
        colors: colorScheme,
        formality: formalityLevel,
        budget: budgetPerPerson,
      });
      
    case 'validate':
      return validateOutfitCoordination(wedding, partyMembers, {
        style: weddingStyle,
        colors: colorScheme,
        formality: formalityLevel,
      });
      
    case 'optimize':
      return optimizeForBudget(wedding, partyMembers, availableProducts, budgetConstraints);
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Analyze current outfit coordination
function analyzeCurrentCoordination(wedding, partyMembers, colorScheme, formalityLevel) {
  const analysis = {
    overallScore: 0,
    colorHarmony: 0,
    styleConsistency: 0,
    formalityAlignment: 0,
    issues: [],
    strengths: [],
    insights: [],
  };
  
  const outfits = partyMembers.map(member => member.wedding_outfits?.[0]).filter(Boolean);
  
  if (outfits.length === 0) {
    analysis.insights.push('No outfits assigned yet. Start by selecting the groom\'s outfit as the foundation.');
    return analysis;
  }
  
  // Color Harmony Analysis
  const colors = outfits.map(outfit => outfit.primary_color).filter(Boolean);
  const uniqueColors = [...new Set(colors)];
  
  if (uniqueColors.length <= 2) {
    analysis.colorHarmony = 90;
    analysis.strengths.push('Excellent color coordination with minimal palette');
  } else if (uniqueColors.length <= 3) {
    analysis.colorHarmony = 75;
    analysis.strengths.push('Good color coordination');
  } else {
    analysis.colorHarmony = 50;
    analysis.issues.push('Too many colors may create visual confusion');
  }
  
  // Style Consistency Analysis
  const styles = outfits.map(outfit => outfit.style).filter(Boolean);
  const uniqueStyles = [...new Set(styles)];
  
  if (uniqueStyles.length === 1) {
    analysis.styleConsistency = 95;
    analysis.strengths.push('Perfect style consistency across all party members');
  } else if (uniqueStyles.length === 2) {
    analysis.styleConsistency = 80;
    analysis.insights.push('Minor style variations detected - ensure they complement each other');
  } else {
    analysis.styleConsistency = 60;
    analysis.issues.push('Multiple style types may lack cohesion');
  }
  
  // Formality Alignment
  const formalityLevels = outfits.map(outfit => outfit.formality_level).filter(Boolean);
  const avgFormality = formalityLevels.reduce((sum, level) => {
    const score = { 'casual': 1, 'smart-casual': 2, 'semi-formal': 3, 'formal': 4, 'black-tie': 5 }[level] || 3;
    return sum + score;
  }, 0) / formalityLevels.length;
  
  const targetFormality = { 'casual': 1, 'smart-casual': 2, 'semi-formal': 3, 'formal': 4, 'black-tie': 5 }[formalityLevel] || 3;
  
  analysis.formalityAlignment = Math.max(0, 100 - Math.abs(avgFormality - targetFormality) * 20);
  
  if (analysis.formalityAlignment > 80) {
    analysis.strengths.push('Formality level perfectly matches wedding style');
  } else {
    analysis.issues.push(`Formality mismatch detected - target is ${formalityLevel}`);
  }
  
  // Overall Score
  analysis.overallScore = Math.round(
    (analysis.colorHarmony + analysis.styleConsistency + analysis.formalityAlignment) / 3
  );
  
  // Generate insights
  if (analysis.overallScore >= 90) {
    analysis.insights.push('Outstanding coordination! Your wedding party will look cohesive and elegant.');
  } else if (analysis.overallScore >= 75) {
    analysis.insights.push('Good coordination with room for minor improvements.');
  } else if (analysis.overallScore >= 60) {
    analysis.insights.push('Decent coordination but consider addressing the identified issues.');
  } else {
    analysis.insights.push('Significant coordination improvements needed for optimal visual harmony.');
  }
  
  return {
    action: 'analyze',
    weddingId: wedding.id,
    analysis,
    memberAnalysis: partyMembers.map(member => analyzeIndividualMember(member, wedding)),
  };
}

// Generate AI-powered recommendations
function generateRecommendations(wedding, partyMembers, availableProducts, preferences) {
  const recommendations = {
    foundation: null,
    partyRecommendations: [],
    alternativeOptions: [],
    budgetOptimizations: [],
  };
  
  // Find or recommend groom's outfit as foundation
  const groom = partyMembers.find(member => member.role === 'groom');
  const groomeOutfit = groom?.wedding_outfits?.[0];
  
  if (!groomeOutfit) {
    // Recommend foundation outfit for groom
    const foundationOptions = availableProducts
      .filter(product => 
        product.style === preferences.style &&
        product.formality_level === preferences.formality &&
        (product.price || 0) <= preferences.budget
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
      
    recommendations.foundation = {
      member: groom,
      recommendedProducts: foundationOptions,
      reasoning: 'Start with the groom\'s outfit as it sets the foundation for the entire party coordination.',
    };
  } else {
    recommendations.foundation = {
      member: groom,
      currentOutfit: groomeOutfit,
      reasoning: 'Using groom\'s current outfit as coordination foundation.',
    };
  }
  
  // Generate recommendations for each party member
  for (const member of partyMembers.filter(m => m.role !== 'groom')) {
    const memberRecommendations = [];
    
    // Filter products based on coordination rules
    const suitableProducts = availableProducts.filter(product => {
      // Color coordination
      const colorMatch = preferences.colors.includes(product.primary_color) ||
                         product.primary_color === 'neutral' ||
                         isComplementaryColor(product.primary_color, preferences.colors);
      
      // Style consistency
      const styleMatch = product.style === preferences.style ||
                        isCompatibleStyle(product.style, preferences.style);
      
      // Formality alignment
      const formalityMatch = product.formality_level === preferences.formality;
      
      // Budget constraint
      const budgetMatch = (product.price || 0) <= preferences.budget;
      
      return colorMatch && styleMatch && formalityMatch && budgetMatch;
    });
    
    // Score and rank products
    const scoredProducts = suitableProducts.map(product => {
      let score = 0;
      
      // Color harmony score
      if (preferences.colors.includes(product.primary_color)) score += 30;
      if (product.primary_color === 'neutral') score += 20;
      
      // Style compatibility
      if (product.style === preferences.style) score += 25;
      
      // Rating and popularity
      score += (product.rating || 0) * 5;
      score += Math.min((product.popularity_score || 0) * 0.1, 10);
      
      // Budget efficiency (lower price = higher score within budget)
      const budgetEfficiency = (preferences.budget - (product.price || 0)) / preferences.budget;
      score += budgetEfficiency * 10;
      
      return { ...product, coordinationScore: score };
    }).sort((a, b) => b.coordinationScore - a.coordinationScore);
    
    memberRecommendations.push({
      member,
      topRecommendations: scoredProducts.slice(0, 3),
      alternativeOptions: scoredProducts.slice(3, 6),
      reasoning: generateRecommendationReasoning(member, scoredProducts[0], preferences),
    });
    
    recommendations.partyRecommendations.push(...memberRecommendations);
  }
  
  return {
    action: 'recommend',
    weddingId: wedding.id,
    preferences,
    recommendations,
    insights: generateCoordinationInsights(recommendations, preferences),
  };
}

// Validate current outfit coordination
function validateOutfitCoordination(wedding, partyMembers, preferences) {
  const validation = {
    isValid: true,
    issues: [],
    warnings: [],
    suggestions: [],
    memberValidations: [],
  };
  
  const outfits = partyMembers.map(member => ({ 
    member, 
    outfit: member.wedding_outfits?.[0] 
  })).filter(item => item.outfit);
  
  if (outfits.length < partyMembers.length) {
    validation.isValid = false;
    validation.issues.push(`${partyMembers.length - outfits.length} party members still need outfit assignments`);
  }
  
  // Check color coordination
  const colors = outfits.map(item => item.outfit.primary_color);
  const colorCounts = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
  
  if (Object.keys(colorCounts).length > 3) {
    validation.isValid = false;
    validation.issues.push('Too many different colors - limit to 2-3 colors for better coordination');
  }
  
  // Check style consistency
  const styles = outfits.map(item => item.outfit.style);
  const uniqueStyles = [...new Set(styles)];
  
  if (uniqueStyles.length > 2) {
    validation.warnings.push('Multiple style types detected - ensure they are complementary');
  }
  
  // Check formality levels
  const formalityLevels = outfits.map(item => item.outfit.formality_level);
  const inconsistentFormality = formalityLevels.some(level => level !== preferences.formality);
  
  if (inconsistentFormality) {
    validation.isValid = false;
    validation.issues.push(`Formality level inconsistency - all outfits should be ${preferences.formality}`);
  }
  
  // Individual member validations
  for (const { member, outfit } of outfits) {
    const memberValidation = {
      memberId: member.id,
      memberName: member.user_profiles?.full_name,
      memberRole: member.role,
      isValid: true,
      issues: [],
      warnings: [],
    };
    
    // Size validation
    if (member.wedding_measurements && outfit.size_chart) {
      const sizeValidation = validateSize(member.wedding_measurements, outfit.size_chart);
      if (!sizeValidation.isValid) {
        memberValidation.isValid = false;
        memberValidation.issues.push(`Size mismatch: ${sizeValidation.issue}`);
      }
    }
    
    // Role-appropriate styling
    if (member.role === 'groom' && outfit.style !== 'distinguished') {
      memberValidation.warnings.push('Consider a more distinguished style for the groom');
    }
    
    validation.memberValidations.push(memberValidation);
  }
  
  return {
    action: 'validate',
    weddingId: wedding.id,
    validation,
    overallScore: calculateValidationScore(validation),
  };
}

// Optimize for budget constraints
function optimizeForBudget(wedding, partyMembers, availableProducts, budgetConstraints) {
  const optimization = {
    currentTotal: 0,
    optimizedTotal: 0,
    savings: 0,
    optimizations: [],
    alternatives: [],
  };
  
  // Calculate current total
  const currentOutfits = partyMembers
    .map(member => member.wedding_outfits?.[0])
    .filter(Boolean);
    
  optimization.currentTotal = currentOutfits.reduce((sum, outfit) => 
    sum + (outfit.rental_price || outfit.price || 0), 0
  );
  
  const targetBudget = budgetConstraints.maxBudget || optimization.currentTotal * 0.8;
  
  if (optimization.currentTotal <= targetBudget) {
    optimization.optimizations.push({
      type: 'no_optimization_needed',
      message: 'Current selection is within budget',
      savings: 0,
    });
    return optimization;
  }
  
  // Find budget-friendly alternatives
  for (const member of partyMembers) {
    const currentOutfit = member.wedding_outfits?.[0];
    if (!currentOutfit) continue;
    
    const alternatives = availableProducts
      .filter(product => 
        product.style === currentOutfit.style &&
        product.formality_level === currentOutfit.formality_level &&
        (product.price || 0) < (currentOutfit.price || 0)
      )
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, 3);
      
    if (alternatives.length > 0) {
      const bestAlternative = alternatives[0];
      const savings = (currentOutfit.price || 0) - (bestAlternative.price || 0);
      
      optimization.alternatives.push({
        member,
        currentOutfit,
        alternative: bestAlternative,
        savings,
        reasoning: `Save $${savings} while maintaining style and quality`,
      });
    }
  }
  
  // Calculate optimized total
  optimization.optimizedTotal = optimization.currentTotal - 
    optimization.alternatives.reduce((sum, alt) => sum + alt.savings, 0);
  optimization.savings = optimization.currentTotal - optimization.optimizedTotal;
  
  return {
    action: 'optimize',
    weddingId: wedding.id,
    budgetConstraints,
    optimization,
    recommendations: optimization.alternatives.slice(0, 5), // Top 5 cost-saving opportunities
  };
}

// Helper functions
function analyzeIndividualMember(member, wedding) {
  const analysis = {
    memberId: member.id,
    memberName: member.user_profiles?.full_name,
    role: member.role,
    hasOutfit: !!member.wedding_outfits?.[0],
    hasMeasurements: !!member.wedding_measurements,
    issues: [],
    suggestions: [],
  };
  
  if (!analysis.hasOutfit) {
    analysis.issues.push('No outfit assigned');
  }
  
  if (!analysis.hasMeasurements) {
    analysis.suggestions.push('Submit measurements for better size recommendations');
  }
  
  return analysis;
}

function isComplementaryColor(color, colorScheme) {
  const complementaryPairs = {
    'navy': ['gray', 'charcoal', 'silver'],
    'gray': ['navy', 'burgundy', 'forest'],
    'charcoal': ['navy', 'silver'],
    'burgundy': ['gray', 'navy'],
  };
  
  return complementaryPairs[color]?.some(c => colorScheme.includes(c)) || false;
}

function isCompatibleStyle(style1, style2) {
  const compatibleStyles = {
    'classic': ['modern', 'traditional'],
    'modern': ['classic', 'contemporary'],
    'traditional': ['classic'],
    'contemporary': ['modern'],
  };
  
  return compatibleStyles[style1]?.includes(style2) || false;
}

function generateRecommendationReasoning(member, product, preferences) {
  const reasons = [];
  
  if (product.primary_color && preferences.colors.includes(product.primary_color)) {
    reasons.push(`Perfect color match with ${product.primary_color}`);
  }
  
  if (product.style === preferences.style) {
    reasons.push(`Consistent ${product.style} style`);
  }
  
  if (product.rating && product.rating > 4.5) {
    reasons.push('Highly rated by customers');
  }
  
  return reasons.join(', ') || 'Good overall coordination fit';
}

function generateCoordinationInsights(recommendations, preferences) {
  const insights = [
    `Coordinating ${recommendations.partyRecommendations.length} party members in ${preferences.style} style`,
    `Color scheme: ${preferences.colors.join(', ')}`,
    `Formality level: ${preferences.formality}`,
  ];
  
  if (recommendations.foundation) {
    insights.push('Foundation outfit establishes the coordination baseline');
  }
  
  return insights;
}

function validateSize(measurements, sizeChart) {
  // Simple size validation logic
  const chest = measurements.chest || 0;
  const waist = measurements.waist || 0;
  
  if (chest < 32 || chest > 60) {
    return { isValid: false, issue: 'Chest measurement out of range' };
  }
  
  if (waist < 28 || waist > 50) {
    return { isValid: false, issue: 'Waist measurement out of range' };
  }
  
  return { isValid: true };
}

function calculateValidationScore(validation) {
  const totalChecks = validation.memberValidations.length;
  const validMembers = validation.memberValidations.filter(v => v.isValid).length;
  const issueCount = validation.issues.length;
  const warningCount = validation.warnings.length;
  
  let score = (validMembers / totalChecks) * 100;
  score -= issueCount * 10;
  score -= warningCount * 5;
  
  return Math.max(0, Math.round(score));
}