import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get('bucketName')
    const filePath = searchParams.get('filePath')

    if (!bucketName || !filePath) {
      return NextResponse.json(
        { error: 'Bucket name and file path are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceClient()
    
    // Check if bucket is public
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json(
        { error: bucketsError.message },
        { status: 500 }
      )
    }

    const bucket = buckets?.find(b => b.name === bucketName)
    const isPublic = bucket?.public || false

    let url: string

    if (isPublic) {
      // Get public URL for public buckets
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      url = publicUrlData.publicUrl
    } else {
      // Create signed URL for private buckets (valid for 1 year to make it shareable)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiration
      
      if (signedError || !signedUrlData?.signedUrl) {
        return NextResponse.json(
          { error: signedError?.message || 'Failed to create signed URL' },
          { status: 500 }
        )
      }
      
      url = signedUrlData.signedUrl
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error in URL API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get file URL' },
      { status: 500 }
    )
  }
}

