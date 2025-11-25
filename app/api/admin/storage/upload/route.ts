import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucketName = formData.get('bucketName') as string
    const filePath = formData.get('filePath') as string

    if (!file || !bucketName) {
      return NextResponse.json(
        { error: 'File and bucket name are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceClient()
    
    // Convert File to ArrayBuffer, then to Buffer for Node.js environment
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload using Buffer - Supabase JS client accepts Buffer in Node.js
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      path: data.path,
      message: `File "${file.name}" uploaded successfully`
    })
  } catch (error) {
    console.error('Error in upload API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
}

