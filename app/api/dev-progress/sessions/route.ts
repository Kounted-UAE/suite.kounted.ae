// API routes for managing development session logs

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import type { CreateSessionLogRequest, SessionLog } from '@/lib/types/dev-progress';

export const runtime = 'nodejs'


async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// GET - Fetch session logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const feature_key = searchParams.get('feature_key');

    let query = supabase
      .from('dev_session_logs')
      .select('*')
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by feature if provided
    if (feature_key) {
      query = query.contains('features_worked_on', [feature_key]);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      pagination: {
        limit,
        offset,
        total: sessions?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch session logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new session log
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const sessionData: CreateSessionLogRequest = await request.json();

    // Validate required fields
    if (!sessionData.summary_text || !sessionData.session_date) {
      return NextResponse.json(
        { error: 'Missing required fields: summary_text, session_date' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Analyze session summary with AI
    let aiAnalysis = null;
    try {
      const analysisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dev-progress/analyze-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary_text: sessionData.summary_text,
            session_date: sessionData.session_date
          })
        }
      );

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        aiAnalysis = analysisData.analysis;
      }
    } catch (error) {
      console.warn('AI analysis failed, proceeding without it:', error);
    }

    // Prepare session log data
    const sessionLogData = {
      session_date: sessionData.session_date,
      session_title: sessionData.session_title,
      summary_text: sessionData.summary_text,
      features_worked_on: sessionData.features_worked_on || [],
      created_by_user_id: user?.id,
      
      // Include AI analysis if available
      ...(aiAnalysis ? {
        ai_estimated_hours: (aiAnalysis as any).estimated_hours,
        ai_confidence_score: (aiAnalysis as any).confidence_score,
        features_worked_on: (aiAnalysis as any).features_worked_on.length > 0 
          ? (aiAnalysis as any).features_worked_on 
          : sessionData.features_worked_on || [],
        key_achievements: (aiAnalysis as any).achievements,
        blockers_identified: (aiAnalysis as any).blockers,
        tech_debt_notes: (aiAnalysis as any).technical_notes
      } : {})
    };

    // Insert new session log
    const { data: newSession, error } = await supabase
      .from('dev_session_logs')
      .insert(sessionLogData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update feature progress based on session
    if (sessionLogData.features_worked_on.length > 0) {
      await updateFeatureProgress(supabase, sessionLogData.features_worked_on, (aiAnalysis as any)?.estimated_hours);
    }

    return NextResponse.json({
      success: true,
      session: newSession,
      ai_analysis: aiAnalysis
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating session log:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create session log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update feature progress based on session activity
 */
async function updateFeatureProgress(
  supabase: any, 
  featuresWorkedOn: string[], 
  hoursSpent?: number
) {
  try {
    for (const featureKey of featuresWorkedOn) {
      // Get current feature
      const { data: feature } = await supabase
        .from('dev_project_features')
        .select('*')
        .eq('feature_key', featureKey)
        .single();

      if (!feature) continue;

      // Simple progress calculation - can be enhanced later
      let newProgress = feature.completion_percentage;
      
      // Increase progress based on hours spent
      if (hoursSpent && feature.estimated_hours > 0) {
        const progressIncrement = (hoursSpent / feature.estimated_hours) * 100;
        newProgress = Math.min(100, newProgress + progressIncrement);
      } else {
        // Small increment for any activity
        newProgress = Math.min(100, newProgress + 5);
      }

      // Update feature progress
      await supabase
        .from('dev_project_features')
        .update({ 
          completion_percentage: newProgress,
          status: newProgress >= 100 ? 'completed' : 
                 newProgress > 0 ? 'in-progress' : 'planned'
        })
        .eq('feature_key', featureKey);

      // Create progress snapshot
      await supabase
        .from('dev_progress_snapshots')
        .insert({
          feature_id: feature.id,
          snapshot_date: new Date().toISOString().split('T')[0],
          completion_percentage: newProgress,
          calculation_method: hoursSpent ? 'ai-estimated' : 'manual',
          contributing_factors: {
            session_hours: hoursSpent,
            method: 'session_activity'
          }
        });
    }
  } catch (error) {
    console.error('Error updating feature progress:', error);
    // Don't throw error here - session log creation should still succeed
  }
}