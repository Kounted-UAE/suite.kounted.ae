import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Matching functionality has been deprecated',
    message: 'This feature is no longer available'
  }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Matching functionality has been deprecated',
    message: 'This feature is no longer available'
  }, { status: 410 })
}
