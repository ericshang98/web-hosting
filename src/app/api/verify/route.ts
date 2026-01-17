import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SEO-Pages-Verification/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      })
    }

    const data = await response.json()

    if (data.success && data.projectKey) {
      return NextResponse.json({
        success: true,
        projectKey: data.projectKey,
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid verification response',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify',
    })
  }
}
