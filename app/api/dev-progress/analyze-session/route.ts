// API route for analyzing development session summaries with OpenAI

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { AISessionAnalysis } from '@/lib/types/dev-progress';
import { getAllFeatures } from '@/lib/utils/extract-features';

export const runtime = 'nodejs'


const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export async function POST(request: NextRequest) {
  try {
    const { summary_text, session_date } = await request.json();

    if (!summary_text || !summary_text.trim()) {
      return NextResponse.json(
        { error: 'Summary text is required' },
        { status: 400 }
      );
    }

    // Get current features for context
    const allFeatures = getAllFeatures();
    const featureList = allFeatures.map(f => f.feature_key).join(', ');

    const prompt = `
You are an expert development project analyst. Analyze this development session summary and provide structured insights.

CONTEXT:
- This is a development session for a UAE accounting practice management platform
- Current project features include: ${featureList}
- Session Date: ${session_date || 'Not specified'}

SESSION SUMMARY:
${summary_text}

Please analyze and return ONLY a valid JSON object with these exact fields:
{
  "estimated_hours": <number between 0.5 and 40>,
  "confidence_score": <number between 0 and 1>,
  "features_worked_on": [<array of feature keys that were mentioned or worked on>],
  "achievements": [<array of specific accomplishments from this session>],
  "blockers": [<array of challenges or blockers identified>],
  "technical_notes": "<brief technical summary of work done>"
}

GUIDELINES:
- estimated_hours: Realistic estimate based on work described (0.5-40 hours)
- confidence_score: How confident you are in this analysis (0.0-1.0)
- features_worked_on: Match to actual feature keys from the context list
- achievements: Specific deliverables or milestones completed
- blockers: Technical or project challenges mentioned
- technical_notes: 1-2 sentence summary of technical work

Focus on extracting concrete information. If something isn't clearly mentioned, don't invent it.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a development project analyst. Return only valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let analysis: AISessionAnalysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from AI analysis');
    }

    // Validate the response structure
    const validatedAnalysis = validateAnalysis(analysis);

    return NextResponse.json({
      success: true,
      analysis: validatedAnalysis,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('Error in session analysis:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate and sanitize the AI analysis response
 */
function validateAnalysis(analysis: any): AISessionAnalysis {
  // Ensure all required fields exist with defaults
  const validated: AISessionAnalysis = {
    estimated_hours: Math.min(Math.max(Number(analysis.estimated_hours) || 1, 0.5), 40),
    confidence_score: Math.min(Math.max(Number(analysis.confidence_score) || 0.5, 0), 1),
    features_worked_on: Array.isArray(analysis.features_worked_on) 
      ? analysis.features_worked_on.filter((f: any) => typeof f === 'string')
      : [],
    achievements: Array.isArray(analysis.achievements)
      ? analysis.achievements.filter((a: any) => typeof a === 'string')
      : [],
    blockers: Array.isArray(analysis.blockers)
      ? analysis.blockers.filter((b: any) => typeof b === 'string')
      : [],
    technical_notes: typeof analysis.technical_notes === 'string' 
      ? analysis.technical_notes.substring(0, 500) // Limit length
      : undefined
  };

  return validated;
}

/**
 * Alternative analysis method if OpenAI is unavailable
 */
function fallbackAnalysis(summaryText: string): AISessionAnalysis {
  // Simple keyword-based analysis as fallback
  const wordCount = summaryText.split(/\s+/).length;
  const estimatedHours = Math.min(Math.max(wordCount / 100, 0.5), 8); // Rough estimate
  
  const allFeatures = getAllFeatures();
  const featuresWorkedOn = allFeatures
    .filter(feature => {
      const keywords = [
        feature.feature_key,
        feature.title.toLowerCase(),
        ...feature.title.toLowerCase().split(' ')
      ];
      return keywords.some(keyword => 
        summaryText.toLowerCase().includes(keyword.toLowerCase())
      );
    })
    .map(f => f.feature_key);

  return {
    estimated_hours: estimatedHours,
    confidence_score: 0.3, // Low confidence for fallback
    features_worked_on: featuresWorkedOn,
    achievements: [], // Can't reliably extract without AI
    blockers: [],
    technical_notes: 'Analysis performed using fallback method'
  };
}