import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface RouteParams {
  params: Promise<{ projectKey: string; path: string[] }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { projectKey, path } = await params
  const pagePath = '/' + path.join('/')

  // Handle verification endpoint
  if (pagePath === '/__verify__') {
    return NextResponse.json({
      success: true,
      projectKey,
      timestamp: new Date().toISOString(),
    })
  }

  const supabase = getSupabase()

  // Find the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('project_key', projectKey)
    .eq('status', 'active')
    .single()

  if (projectError || !project) {
    return new NextResponse(
      generateErrorPage('Project Not Found', 'This project does not exist or is not active.'),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Find the page
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', project.id)
    .eq('path', pagePath)
    .eq('status', 'published')
    .single()

  if (pageError || !page) {
    return new NextResponse(
      generateErrorPage('Page Not Found', 'The requested page does not exist.'),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Record page view (async, don't wait)
  supabase
    .from('page_views')
    .insert({
      page_id: page.id,
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    })
    .then(() => {
      supabase
        .from('pages')
        .update({ view_count: page.view_count + 1 })
        .eq('id', page.id)
    })

  const html = generatePage({
    title: page.title,
    content: page.content,
    metaDescription: page.meta_description,
    metaKeywords: page.meta_keywords,
    domain: project.domain,
    path: `${project.path_prefix}${page.path}`,
  })

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  })
}

interface PageData {
  title: string
  content: string
  metaDescription: string
  metaKeywords: string
  domain: string
  path: string
}

function generatePage(data: PageData): string {
  const canonicalUrl = `https://${data.domain}${data.path}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  ${data.metaDescription ? `<meta name="description" content="${escapeHtml(data.metaDescription)}">` : ''}
  ${data.metaKeywords ? `<meta name="keywords" content="${escapeHtml(data.metaKeywords)}">` : ''}
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(data.title)}">
  ${data.metaDescription ? `<meta property="og:description" content="${escapeHtml(data.metaDescription)}">` : ''}
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  ${data.metaDescription ? `<meta name="twitter:description" content="${escapeHtml(data.metaDescription)}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4, h5, h6 { margin: 1.5rem 0 1rem; line-height: 1.3; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin: 1rem 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin: 0.5rem 0; }
    code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
    pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; color: #6b7280; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <article>
    ${data.content}
  </article>
</body>
</html>`
}

function generateErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f3f4f6;
    }
    .error {
      text-align: center;
      padding: 2rem;
    }
    h1 { color: #1f2937; margin-bottom: 0.5rem; }
    p { color: #6b7280; }
  </style>
</head>
<body>
  <div class="error">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
