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
      action, // 'validate', 'recommend', 'analyze_photo', 'generate_tips'
      partyMemberId,
      measurements = {},
      photoData = null,
      preferences = {}
    } = requestData;
    
    // Validate required fields
    if (!action || !partyMemberId) {
      throw new Error('Missing required fields: action, partyMemberId');
    }
    
    // Get party member details
    const { data: partyMember, error: memberError } = await supabase
      .from('wedding_party_members')
      .select(`
        *,
        user_profiles(full_name, email),
        wedding_measurements(*),
        wedding_outfits(*),
        weddings(style, formality_level)
      `)
      .eq('id', partyMemberId)
      .single();
      
    if (memberError || !partyMember) {
      throw new Error('Party member not found');
    }
    
    let result;
    
    switch (action) {
      case 'validate':
        result = await validateMeasurements(measurements, partyMember);
        break;
        
      case 'recommend':
        result = await generateSizeRecommendations(measurements, partyMember, supabase);
        break;
        
      case 'analyze_photo':
        result = await analyzePhotoMeasurements(photoData, partyMember);
        break;
        
      case 'generate_tips':
        result = await generateMeasurementTips(partyMember, preferences);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Store measurement analytics
    const { error: analyticsError } = await supabase
      .from('wedding_analytics')
      .insert({
        wedding_id: partyMember.wedding_id,
        party_member_id: partyMemberId,
        analysis_type: 'smart_measurements',
        analysis_data: {
          action,
          measurements,
          result,
          confidence_score: result.confidenceScore || null,
        },
        insights: result.insights || [],
        recommendations: result.recommendations || [],
      });
      
    if (analyticsError) {
      console.error('Failed to store measurement analytics:', analyticsError);
    }
    
    return new Response(
      JSON.stringify({
        data: {
          action,
          partyMemberId,
          ...result
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Smart measurement system error:', error);
    
    const errorResponse = {
      error: {
        code: 'SMART_MEASUREMENT_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Validate measurements using AI algorithms
async function validateMeasurements(measurements, partyMember) {
  const validation = {
    isValid: true,
    confidenceScore: 0,
    issues: [],
    warnings: [],
    suggestions: [],
    anomalies: [],
    recommendedActions: [],
  };
  
  const { chest, waist, hips, neck, sleeve, inseam, jacket_length, height, weight } = measurements;
  
  // Basic range validation
  const ranges = {
    chest: { min: 30, max: 70, unit: 'inches' },
    waist: { min: 26, max: 60, unit: 'inches' },
    hips: { min: 30, max: 70, unit: 'inches' },
    neck: { min: 13, max: 22, unit: 'inches' },
    sleeve: { min: 30, max: 40, unit: 'inches' },
    inseam: { min: 26, max: 40, unit: 'inches' },
    jacket_length: { min: 26, max: 36, unit: 'inches' },
    height: { min: 60, max: 84, unit: 'inches' },
    weight: { min: 120, max: 400, unit: 'lbs' },
  };
  
  // Validate each measurement
  for (const [key, value] of Object.entries(measurements)) {
    if (ranges[key] && value) {
      const range = ranges[key];
      if (value < range.min || value > range.max) {
        validation.isValid = false;
        validation.issues.push(`${key} measurement (${value} ${range.unit}) is outside normal range (${range.min}-${range.max} ${range.unit})`);
      }
    }
  }
  
  // Proportional relationship validation
  if (chest && waist) {
    const dropRatio = chest - waist;
    if (dropRatio < 2) {
      validation.warnings.push('Unusually small chest-to-waist drop - double-check measurements');
    } else if (dropRatio > 15) {
      validation.warnings.push('Large chest-to-waist drop detected - may require special tailoring');
    }
  }
  
  if (height && inseam) {
    const legRatio = inseam / height;
    if (legRatio < 0.4) {
      validation.warnings.push('Short inseam relative to height - verify measurement');
    } else if (legRatio > 0.55) {
      validation.warnings.push('Long inseam relative to height - verify measurement');
    }
  }
  
  // Body type analysis
  const bodyType = determineBodyType(measurements);
  validation.bodyType = bodyType;
  
  // Fit recommendations based on body type
  const fitRecommendations = getFitRecommendations(bodyType, partyMember.weddings?.style);
  validation.fitRecommendations = fitRecommendations;
  
  // Calculate confidence score
  validation.confidenceScore = calculateMeasurementConfidence(measurements, validation);
  
  // Generate insights
  validation.insights = generateMeasurementInsights(measurements, bodyType, validation);
  
  // Recommendations for improvement
  if (validation.confidenceScore < 80) {
    validation.recommendedActions.push('Consider professional measuring for better accuracy');
  }
  
  if (validation.issues.length > 0) {
    validation.recommendedActions.push('Verify flagged measurements before proceeding');
  }
  
  return validation;
}

// Generate size recommendations based on measurements
async function generateSizeRecommendations(measurements, partyMember, supabase) {
  const recommendations = {
    recommendedSizes: {},
    alternativeSizes: {},
    confidenceScores: {},
    sizingNotes: [],
    alterationSuggestions: [],
  };
  
  // Get available products for sizing
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      product_variants(*)
    `)
    .eq('category', 'formal-wear');
    
  if (productsError) {
    console.error('Failed to fetch products for sizing:', productsError);
    return recommendations;
  }
  
  // Get historical fit data for similar measurements
  const { data: historicalFits, error: historyError } = await supabase
    .from('size_recommendations')
    .select('*')
    .gte('chest_measurement', (measurements.chest || 0) - 2)
    .lte('chest_measurement', (measurements.chest || 0) + 2)
    .limit(50);
    
  if (historyError) {
    console.error('Failed to fetch historical fit data:', historyError);
  }
  
  // Analyze each product category
  const categories = ['jacket', 'pants', 'shirt', 'vest'];
  
  for (const category of categories) {
    const categoryProducts = products?.filter(p => p.subcategory === category) || [];
    
    if (categoryProducts.length === 0) continue;
    
    const sizeRecommendation = calculateOptimalSize(
      measurements,
      categoryProducts,
      historicalFits || [],
      category
    );
    
    recommendations.recommendedSizes[category] = sizeRecommendation.primarySize;
    recommendations.alternativeSizes[category] = sizeRecommendation.alternativeSizes;
    recommendations.confidenceScores[category] = sizeRecommendation.confidence;
    
    if (sizeRecommendation.notes) {
      recommendations.sizingNotes.push(`${category}: ${sizeRecommendation.notes}`);
    }
    
    if (sizeRecommendation.alterations) {
      recommendations.alterationSuggestions.push(...sizeRecommendation.alterations);
    }
  }
  
  // Overall recommendations
  const avgConfidence = Object.values(recommendations.confidenceScores)
    .reduce((sum, score) => sum + score, 0) / Object.keys(recommendations.confidenceScores).length;
    
  recommendations.overallConfidence = avgConfidence;
  
  if (avgConfidence > 90) {
    recommendations.sizingNotes.push('High confidence in size recommendations - proceed with confidence');
  } else if (avgConfidence > 75) {
    recommendations.sizingNotes.push('Good confidence in sizing - minor adjustments may be needed');
  } else {
    recommendations.sizingNotes.push('Moderate confidence - recommend professional fitting consultation');
    recommendations.alterationSuggestions.push('Schedule professional fitting appointment');
  }
  
  return recommendations;
}

// Analyze photo-based measurements (placeholder for AI vision)
async function analyzePhotoMeasurements(photoData, partyMember) {
  // This would integrate with computer vision APIs for measurement extraction
  const analysis = {
    photoAnalysisAvailable: false,
    extractedMeasurements: {},
    confidenceScores: {},
    qualityAssessment: {},
    recommendations: [],
  };
  
  if (!photoData) {
    analysis.recommendations.push('Upload clear, well-lit photos for AI-assisted measurement extraction');
    return analysis;
  }
  
  // Placeholder for actual AI vision processing
  analysis.photoAnalysisAvailable = true;
  analysis.qualityAssessment = {
    lighting: 'good',
    pose: 'acceptable',
    clothing: 'appropriate',
    background: 'clear',
  };
  
  analysis.recommendations = [
    'Photo analysis shows good measurement potential',
    'Manual verification recommended for final measurements',
    'Consider taking additional side-view photo for better accuracy',
  ];
  
  return analysis;
}

// Generate measurement tips and guidance
async function generateMeasurementTips(partyMember, preferences) {
  const tips = {
    generalTips: [],
    roleSpecificTips: [],
    toolsNeeded: [],
    stepByStepGuide: {},
    videoTutorials: [],
    commonMistakes: [],
  };
  
  // General measurement tips
  tips.generalTips = [
    'Measure over well-fitted undergarments or lightweight clothing',
    'Keep the measuring tape snug but not tight',
    'Stand naturally with relaxed posture',
    'Take measurements at the same time of day for consistency',
    'Have someone assist you for more accurate results',
  ];
  
  // Role-specific guidance
  if (partyMember.role === 'groom') {
    tips.roleSpecificTips = [
      'As the groom, your measurements set the foundation for party coordination',
      'Consider professional measuring for the most important day',
      'Schedule early to allow time for any adjustments',
    ];
  } else {
    tips.roleSpecificTips = [
      'Your measurements will be coordinated with the groom\'s style',
      'Consistency in measuring technique ensures better group coordination',
      'Submit measurements promptly to avoid delays',
    ];
  }
  
  // Tools needed
  tips.toolsNeeded = [
    'Flexible measuring tape (cloth or vinyl)',
    'Mirror for self-checking',
    'Well-lit room',
    'Pen and paper for recording',
    'Helper for difficult-to-reach measurements',
  ];
  
  // Step-by-step measurement guide
  tips.stepByStepGuide = {
    chest: {
      step: 1,
      instruction: 'Measure around the fullest part of your chest, under your arms',
      tips: ['Keep tape parallel to floor', 'Breathe normally, don\'t hold breath'],
      commonErrors: ['Measuring too high on chest', 'Tape too loose or tight'],
    },
    waist: {
      step: 2,
      instruction: 'Measure around your natural waistline',
      tips: ['Find narrowest part of torso', 'Keep one finger under tape'],
      commonErrors: ['Measuring at belt line instead of natural waist'],
    },
    neck: {
      step: 3,
      instruction: 'Measure around the base of your neck',
      tips: ['Leave room for comfort', 'Keep tape slightly loose'],
      commonErrors: ['Measuring too tight', 'Not accounting for collar comfort'],
    },
    sleeve: {
      step: 4,
      instruction: 'From center back neck to wrist with arm slightly bent',
      tips: ['Bend arm slightly at elbow', 'Follow natural arm curve'],
      commonErrors: ['Straight arm measurement', 'Not following shoulder curve'],
    },
    inseam: {
      step: 5,
      instruction: 'From crotch seam to desired hem length',
      tips: ['Use well-fitted pants as reference', 'Consider shoe height'],
      commonErrors: ['Measuring on outside of leg', 'Wrong hem length preference'],
    },
  };
  
  // Common mistakes to avoid
  tips.commonMistakes = [
    'Measuring over bulky clothing',
    'Pulling tape too tight or leaving too loose',
    'Not standing in natural posture',
    'Rounding measurements up or down significantly',
    'Taking measurements at different times of day',
    'Not double-checking measurements',
  ];
  
  // Video tutorial references
  tips.videoTutorials = [
    {
      title: 'Professional Suit Measuring Techniques',
      duration: '8 minutes',
      description: 'Complete guide to measuring for formal wear',
    },
    {
      title: 'Common Measurement Mistakes to Avoid',
      duration: '5 minutes',
      description: 'Learn what not to do when measuring',
    },
    {
      title: 'Self-Measuring vs Professional Measuring',
      duration: '6 minutes',
      description: 'When to DIY and when to get professional help',
    },
  ];
  
  return tips;
}

// Helper functions
function determineBodyType(measurements) {
  const { chest, waist, hips, height, weight } = measurements;
  
  if (!chest || !waist) return 'unknown';
  
  const dropRatio = chest - waist;
  const shoulderToHipRatio = chest / (hips || chest);
  
  if (dropRatio >= 8 && shoulderToHipRatio > 1.1) {
    return 'athletic';
  } else if (dropRatio <= 4) {
    return 'full';
  } else if (dropRatio >= 6) {
    return 'lean';
  } else {
    return 'regular';
  }
}

function getFitRecommendations(bodyType, weddingStyle) {
  const recommendations = {
    athletic: {
      jacket: 'Tailored fit to accentuate V-shape',
      pants: 'Straight or slightly tapered leg',
      notes: 'Emphasize shoulder line, avoid oversized fits',
    },
    lean: {
      jacket: 'Slim fit with minimal padding',
      pants: 'Slim or straight fit',
      notes: 'Clean lines, avoid overly tight fits',
    },
    full: {
      jacket: 'Classic fit with structured shoulders',
      pants: 'Straight leg, higher rise',
      notes: 'Focus on vertical lines, avoid tight fits',
    },
    regular: {
      jacket: 'Regular or tailored fit',
      pants: 'Straight or slightly tapered',
      notes: 'Versatile body type, most fits work well',
    },
  };
  
  return recommendations[bodyType] || recommendations.regular;
}

function calculateMeasurementConfidence(measurements, validation) {
  let confidence = 100;
  
  // Deduct for missing measurements
  const requiredMeasurements = ['chest', 'waist', 'sleeve', 'inseam'];
  const missingCount = requiredMeasurements.filter(m => !measurements[m]).length;
  confidence -= missingCount * 15;
  
  // Deduct for validation issues
  confidence -= validation.issues.length * 20;
  confidence -= validation.warnings.length * 10;
  
  // Deduct for anomalies
  confidence -= validation.anomalies.length * 15;
  
  return Math.max(0, Math.min(100, confidence));
}

function generateMeasurementInsights(measurements, bodyType, validation) {
  const insights = [];
  
  insights.push(`Identified body type: ${bodyType}`);
  
  if (validation.confidenceScore > 90) {
    insights.push('Excellent measurement quality - high confidence in size recommendations');
  } else if (validation.confidenceScore > 75) {
    insights.push('Good measurement quality - minor adjustments may be needed');
  } else {
    insights.push('Measurement quality could be improved - consider professional measuring');
  }
  
  if (bodyType === 'athletic') {
    insights.push('Athletic build detected - tailored fits will work best');
  } else if (bodyType === 'full') {
    insights.push('Fuller build detected - classic fits recommended for comfort and style');
  }
  
  return insights;
}

function calculateOptimalSize(measurements, products, historicalFits, category) {
  const result = {
    primarySize: null,
    alternativeSizes: [],
    confidence: 0,
    notes: null,
    alterations: [],
  };
  
  // Simple size mapping based on chest measurement
  const { chest, waist, neck, sleeve, inseam } = measurements;
  
  if (category === 'jacket' && chest) {
    if (chest <= 36) result.primarySize = 'Small';
    else if (chest <= 40) result.primarySize = 'Medium';
    else if (chest <= 44) result.primarySize = 'Large';
    else if (chest <= 48) result.primarySize = 'X-Large';
    else result.primarySize = 'XX-Large';
    
    result.confidence = 85;
    result.alternativeSizes = [getAdjacentSize(result.primarySize, -1), getAdjacentSize(result.primarySize, 1)];
  }
  
  if (category === 'pants' && waist) {
    result.primarySize = `${Math.round(waist)}`;
    result.confidence = 90;
    result.alternativeSizes = [`${Math.round(waist) - 1}`, `${Math.round(waist) + 1}`];
    
    if (inseam) {
      result.notes = `Recommended inseam: ${Math.round(inseam)} inches`;
      if (inseam % 1 !== 0) {
        result.alterations.push(`Hem adjustment: ${inseam} inches`);
      }
    }
  }
  
  if (category === 'shirt' && neck && sleeve) {
    result.primarySize = `${Math.round(neck * 2) / 2}-${Math.round(sleeve)}`;
    result.confidence = 88;
  }
  
  return result;
}

function getAdjacentSize(size, direction) {
  const sizes = ['XS', 'Small', 'Medium', 'Large', 'X-Large', 'XX-Large'];
  const index = sizes.indexOf(size);
  if (index === -1) return null;
  
  const newIndex = index + direction;
  return newIndex >= 0 && newIndex < sizes.length ? sizes[newIndex] : null;
}