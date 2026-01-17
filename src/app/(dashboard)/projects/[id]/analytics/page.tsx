'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project, Page } from '@/types/database'

interface PageView {
  id: string
  page_id: string
  viewed_at: string
  user_agent: string | null
  referer: string | null
}

interface TrafficSource {
  name: string
  count: number
  percentage: number
  color: string
}

function categorizeReferer(referer: string | null): string {
  if (!referer) return 'Direct'

  const r = referer.toLowerCase()

  // AI Tools
  if (r.includes('chat.openai.com') || r.includes('chatgpt.com')) return 'ChatGPT'
  if (r.includes('perplexity.ai')) return 'Perplexity'
  if (r.includes('claude.ai')) return 'Claude'
  if (r.includes('copilot.microsoft.com')) return 'Copilot'
  if (r.includes('bard.google.com') || r.includes('gemini.google.com')) return 'Gemini'
  if (r.includes('you.com')) return 'You.com'

  // Search Engines
  if (r.includes('google.')) return 'Google Search'
  if (r.includes('bing.com')) return 'Bing'
  if (r.includes('duckduckgo.com')) return 'DuckDuckGo'
  if (r.includes('yahoo.')) return 'Yahoo'
  if (r.includes('baidu.com')) return 'Baidu'

  // Social Media
  if (r.includes('twitter.com') || r.includes('x.com')) return 'Twitter/X'
  if (r.includes('facebook.com') || r.includes('fb.com')) return 'Facebook'
  if (r.includes('linkedin.com')) return 'LinkedIn'
  if (r.includes('reddit.com')) return 'Reddit'

  return 'Other'
}

const sourceColors: Record<string, string> = {
  'Google Search': 'bg-blue-500',
  'ChatGPT': 'bg-green-500',
  'Perplexity': 'bg-purple-500',
  'Claude': 'bg-orange-500',
  'Copilot': 'bg-cyan-500',
  'Gemini': 'bg-yellow-500',
  'You.com': 'bg-pink-500',
  'Bing': 'bg-teal-500',
  'DuckDuckGo': 'bg-red-500',
  'Yahoo': 'bg-violet-500',
  'Baidu': 'bg-blue-700',
  'Twitter/X': 'bg-gray-800',
  'Facebook': 'bg-blue-600',
  'LinkedIn': 'bg-blue-800',
  'Reddit': 'bg-orange-600',
  'Direct': 'bg-gray-500',
  'Other': 'bg-gray-400',
}

export default function AnalyticsPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d')

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch project
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (projectData) {
        setProject(projectData as Project)

        // Fetch pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('project_id', params.id)

        if (pagesData) {
          setPages(pagesData as Page[])

          // Calculate time filter
          let fromDate: string | null = null
          const now = new Date()
          if (timeRange === '24h') {
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          } else if (timeRange === '7d') {
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          } else if (timeRange === '30d') {
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }

          // Fetch page views for all pages
          const pageIds = pagesData.map(p => p.id)
          let query = supabase
            .from('page_views')
            .select('*')
            .in('page_id', pageIds)
            .order('viewed_at', { ascending: false })

          if (fromDate) {
            query = query.gte('viewed_at', fromDate)
          }

          const { data: viewsData } = await query

          if (viewsData) {
            setPageViews(viewsData as PageView[])
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id, timeRange, supabase])

  // Calculate traffic sources
  const trafficSources = pageViews.reduce((acc, view) => {
    const source = categorizeReferer(view.referer)
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalViews = pageViews.length
  const sortedSources: TrafficSource[] = Object.entries(trafficSources)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalViews > 0 ? (count / totalViews) * 100 : 0,
      color: sourceColors[name] || 'bg-gray-400',
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate AI vs Traditional breakdown
  const aiSources = ['ChatGPT', 'Perplexity', 'Claude', 'Copilot', 'Gemini', 'You.com']
  const searchSources = ['Google Search', 'Bing', 'DuckDuckGo', 'Yahoo', 'Baidu']

  const aiTraffic = sortedSources.filter(s => aiSources.includes(s.name)).reduce((sum, s) => sum + s.count, 0)
  const searchTraffic = sortedSources.filter(s => searchSources.includes(s.name)).reduce((sum, s) => sum + s.count, 0)
  const directTraffic = trafficSources['Direct'] || 0
  const otherTraffic = totalViews - aiTraffic - searchTraffic - directTraffic

  // Page-level stats
  const pageStats = pages.map(page => {
    const views = pageViews.filter(v => v.page_id === page.id)
    return {
      ...page,
      viewCount: views.length,
      sources: views.reduce((acc, v) => {
        const source = categorizeReferer(v.referer)
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }).sort((a, b) => b.viewCount - a.viewCount)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Project
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traffic Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">{project.domain}</p>
        </div>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">Total Views</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalViews}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">AI Traffic</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{aiTraffic}</p>
          <p className="text-xs text-gray-400">
            {totalViews > 0 ? ((aiTraffic / totalViews) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">Search Traffic</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{searchTraffic}</p>
          <p className="text-xs text-gray-400">
            {totalViews > 0 ? ((searchTraffic / totalViews) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">Direct / Other</p>
          <p className="mt-2 text-3xl font-bold text-gray-600">{directTraffic + otherTraffic}</p>
          <p className="text-xs text-gray-400">
            {totalViews > 0 ? (((directTraffic + otherTraffic) / totalViews) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {sortedSources.length > 0 ? (
            <div className="space-y-4">
              {sortedSources.map((source) => (
                <div key={source.name} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">{source.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${source.color} rounded-full`}
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-600 text-right">
                    {source.count} ({source.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No traffic data yet</p>
          )}
        </div>
      </div>

      {/* Page Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Page Performance</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {pageStats.length > 0 ? (
            pageStats.map((page) => (
              <div key={page.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/projects/${project.id}/pages/${page.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {page.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">{page.path}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{page.viewCount} views</p>
                    <div className="flex space-x-2 mt-1">
                      {Object.entries(page.sources).slice(0, 3).map(([source, count]) => (
                        <span
                          key={source}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {source}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No pages yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Views */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Views</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageViews.slice(0, 20).map((view) => {
                const page = pages.find(p => p.id === view.page_id)
                const source = categorizeReferer(view.referer)
                return (
                  <tr key={view.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(view.viewed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        aiSources.includes(source) ? 'bg-green-100 text-green-800' :
                        searchSources.includes(source) ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                      {view.referer || '-'}
                    </td>
                  </tr>
                )
              })}
              {pageViews.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No views recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
