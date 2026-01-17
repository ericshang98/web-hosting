import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteProjectButton } from '@/components/delete-project-button'
import type { Project, Page } from '@/types/database'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const typedProject = project as Project
  const typedPages = (pages || []) as Page[]

  const proxyEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'https://seopages.app'}/api/proxy/${typedProject.project_key}`

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link
          href="/projects"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Projects
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{typedProject.domain}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Project ID: {typedProject.project_key}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              typedProject.status === 'active'
                ? 'bg-green-100 text-green-800'
                : typedProject.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {typedProject.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pages Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Pages</h3>
                <Link
                  href={`/projects/${id}/pages/new`}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  + Add Page
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {typedPages.length > 0 ? (
                typedPages.map((page) => (
                  <div key={page.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/projects/${id}/pages/${page.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          {page.title}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500">
                          {typedProject.path_prefix}{page.path}
                        </p>
                      </div>
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
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No pages yet</p>
                  <Link
                    href={`/projects/${id}/pages/new`}
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Create your first page
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Project Info
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Domain</dt>
                  <dd className="mt-1 text-sm text-gray-900">{typedProject.domain}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Path Prefix</dt>
                  <dd className="mt-1 text-sm text-gray-900">{typedProject.path_prefix}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Proxy Endpoint</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all font-mono text-xs bg-gray-50 p-2 rounded">
                    {proxyEndpoint}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(typedProject.created_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/projects/${id}/setup`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Setup Instructions
                </Link>
                <Link
                  href={`/projects/${id}/settings`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Project Settings
                </Link>
                <DeleteProjectButton projectId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
