'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project, Page } from '@/types/database'

interface PageView {
  id: string
  page_id: string
  viewed_at: string
  referer: string | null
}

function categorizeReferer(referer: string | null): string {
  if (!referer) return 'Direct'
  const r = referer.toLowerCase()
  if (r.includes('chat.openai.com') || r.includes('chatgpt.com')) return 'ChatGPT'
  if (r.includes('perplexity.ai')) return 'Perplexity'
  if (r.includes('claude.ai')) return 'Claude'
  if (r.includes('copilot.microsoft.com')) return 'Copilot'
  if (r.includes('google.')) return 'Google'
  if (r.includes('bing.com')) return 'Bing'
  return 'Other'
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [project, setProject] = useState<Project | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setLoading(false)
        return
      }

      setLoading(true)

      // Fetch project
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectData) {
        setProject(projectData as Project)

        // Fetch pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (pagesData) {
          setPages(pagesData as Page[])

          // Fetch page views for last 7 days
          const pageIds = pagesData.map(p => p.id)
          if (pageIds.length > 0) {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            const { data: viewsData } = await supabase
              .from('page_views')
              .select('*')
              .in('page_id', pageIds)
              .gte('viewed_at', sevenDaysAgo)

            if (viewsData) {
              setPageViews(viewsData as PageView[])
            }
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [projectId, supabase])

  // Calculate traffic stats
  const aiSources = ['ChatGPT', 'Perplexity', 'Claude', 'Copilot']
  const searchSources = ['Google', 'Bing']

  const trafficBySource = pageViews.reduce((acc, view) => {
    const source = categorizeReferer(view.referer)
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalViews = pageViews.length
  const aiTraffic = aiSources.reduce((sum, s) => sum + (trafficBySource[s] || 0), 0)
  const searchTraffic = searchSources.reduce((sum, s) => sum + (trafficBySource[s] || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!projectId || !project) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select a project from the dropdown above or create a new one.
        </p>
        <div className="mt-6">
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            + New Project
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.domain}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {project.path_prefix}/* &middot; {pages.length} pages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {project.status}
          </span>
          <Link
            href={`/projects/${project.id}/settings`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500">Total Views (7d)</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalViews}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500">AI Traffic</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{aiTraffic}</p>
          <p className="text-xs text-gray-400">ChatGPT, Perplexity, Claude</p>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500">Search Traffic</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{searchTraffic}</p>
          <p className="text-xs text-gray-400">Google, Bing</p>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500">Pages</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{pages.length}</p>
          <p className="text-xs text-gray-400">{pages.filter(p => p.status === 'published').length} published</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Pages</h3>
                <Link
                  href={`/projects/${project.id}/pages/new`}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  + Add Page
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pages.length > 0 ? (
                pages.map((page) => {
                  const pageViewCount = pageViews.filter(v => v.page_id === page.id).length
                  return (
                    <div key={page.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/projects/${project.id}/pages/${page.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            {page.title}
                          </Link>
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {project.path_prefix}{page.path}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {pageViewCount} views
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              page.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : page.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {page.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No pages yet</p>
                  <Link
                    href={`/projects/${project.id}/pages/new`}
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Create your first page
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Traffic Sources */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
              {Object.keys(trafficBySource).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(trafficBySource)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{source}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No traffic data yet</p>
              )}
              <Link
                href={`/projects/${project.id}/analytics`}
                className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View detailed analytics &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/projects/${project.id}/setup`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Setup Instructions
                </Link>
                <a
                  href={`https://${project.domain}${project.path_prefix === '/' ? '' : project.path_prefix}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Visit Site
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Info</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Project Key</dt>
                  <dd className="mt-1 font-mono text-xs bg-gray-50 p-2 rounded break-all">
                    {project.project_key}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(project.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
