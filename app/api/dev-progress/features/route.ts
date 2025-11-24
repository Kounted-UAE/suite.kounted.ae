// API routes for managing development features

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import type { CreateFeatureRequest, ProjectFeature } from '@/lib/types/dev-progress';

export const runtime = 'nodejs'


async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// GET - Fetch all features
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: features, error } = await supabase
      .from('dev_project_features')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      features: features || []
    });

  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch features',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new feature
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const featureData: CreateFeatureRequest = await request.json();

    // Validate required fields
    if (!featureData.feature_key || !featureData.title || !featureData.category) {
      return NextResponse.json(
        { error: 'Missing required fields: feature_key, title, category' },
        { status: 400 }
      );
    }

    // Check if feature_key already exists
    const { data: existingFeature } = await supabase
      .from('dev_project_features')
      .select('id')
      .eq('feature_key', featureData.feature_key)
      .single();

    if (existingFeature) {
      return NextResponse.json(
        { error: 'Feature with this key already exists' },
        { status: 409 }
      );
    }

    // Insert new feature
    const { data: newFeature, error } = await supabase
      .from('dev_project_features')
      .insert({
        feature_key: featureData.feature_key,
        category: featureData.category,
        title: featureData.title,
        description: featureData.description,
        objectives: featureData.objectives || [],
        estimated_hours: featureData.estimated_hours || 0,
        priority: featureData.priority || 50,
        url_path: featureData.url_path,
        icon_name: featureData.icon_name,
        dependencies: featureData.dependencies || []
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      feature: newFeature
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create feature',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update feature
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedFeature, error } = await supabase
      .from('dev_project_features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      feature: updatedFeature
    });

  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update feature',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}