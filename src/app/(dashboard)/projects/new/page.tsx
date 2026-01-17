'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewProjectPage() {
  const [domain, setDomain] = useState('')
  const [pathPrefix, setPathPrefix] = useState('/seo')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate domain
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      setError('Please enter a valid domain (e.g., example.com)')
      setLoading(false)
      return
    }

    // Validate path prefix
    if (!pathPrefix.startsWith('/')) {
      setError('Path prefix must start with /')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        domain: domain.toLowerCase(),
        path_prefix: pathPrefix,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You already have a project for this domain')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}/setup`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Projects
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            Create New Project
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-gray-700"
              >
                Domain
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                The domain where you want to host SEO pages
              </p>
            </div>

            <div>
              <label
                htmlFor="pathPrefix"
                className="block text-sm font-medium text-gray-700"
              >
                Path Prefix
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="pathPrefix"
                  value={pathPrefix}
                  onChange={(e) => setPathPrefix(e.target.value)}
                  placeholder="/seo"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                All SEO pages will be hosted under this path (e.g., {domain || 'example.com'}{pathPrefix}/)
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
