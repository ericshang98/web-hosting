'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project, Page, PageStatus } from '@/types/database'

export default function EditPagePage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [path, setPath] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [status, setStatus] = useState<PageStatus>('draft')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [projectResult, pageResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', params.id).single(),
        supabase.from('pages').select('*').eq('id', params.pageId).single(),
      ])

      if (projectResult.data) {
        setProject(projectResult.data as Project)
      }

      if (pageResult.data) {
        const p = pageResult.data as Page
        setPage(p)
        setPath(p.path)
        setTitle(p.title)
        setContent(p.content)
        setMetaDescription(p.meta_description || '')
        setMetaKeywords(p.meta_keywords || '')
        setStatus(p.status)
      }
    }
    fetchData()
  }, [params.id, params.pageId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!path.startsWith('/')) {
      setError('Path must start with /')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('pages')
      .update({
        path,
        title,
        content,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        status,
      })
      .eq('id', params.pageId)

    if (updateError) {
      if (updateError.code === '23505') {
        setError('A page with this path already exists')
      } else {
        setError(updateError.message)
      }
      setLoading(false)
      return
    }

    setSuccess('Page updated successfully')
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)

    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', params.pageId)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    router.push(`/projects/${params.id}`)
  }

  const handleStatusChange = async (newStatus: PageStatus) => {
    setStatus(newStatus)

    const { error: updateError } = await supabase
      .from('pages')
      .update({ status: newStatus })
      .eq('id', params.pageId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(`Page ${newStatus === 'published' ? 'published' : newStatus === 'offline' ? 'taken offline' : 'saved as draft'}`)
    setTimeout(() => setSuccess(null), 3000)
  }

  if (!project || !page) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Project
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Page</h1>
        <div className="flex items-center space-x-3">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as PageStatus)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
              status === 'published'
                ? 'bg-green-50 border-green-200 text-green-700'
                : status === 'draft'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="path" className="block text-sm font-medium text-gray-700">
                Path
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {project.domain}{project.path_prefix}
                </span>
                <input
                  type="text"
                  id="path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  required
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">SEO Settings</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    id="metaKeywords"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Views: {page.view_count}</span>
                <span>Last updated: {new Date(page.updated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                {showDeleteConfirm ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600">Delete this page?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete Page
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
