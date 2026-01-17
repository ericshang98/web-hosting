'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

type Platform = 'vercel' | 'netlify' | 'nginx' | 'cloudflare' | 'other'

export default function SetupPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [platform, setPlatform] = useState<Platform>('vercel')
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<'success' | 'error' | null>(null)
  const [verifyMessage, setVerifyMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const proxyEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'https://seopages.app'}/api/proxy/${project?.project_key}`

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) {
        setProject(data as Project)
      }
    }
    fetchProject()
  }, [params.id, supabase])

  const getConfigCode = () => {
    if (!project) return ''

    switch (platform) {
      case 'vercel':
        return `// vercel.json
{
  "rewrites": [
    {
      "source": "${project.path_prefix}/:path*",
      "destination": "${proxyEndpoint}/:path*"
    }
  ]
}`

      case 'netlify':
        return `# netlify.toml
[[redirects]]
  from = "${project.path_prefix}/*"
  to = "${proxyEndpoint}/:splat"
  status = 200
  force = true`

      case 'nginx':
        return `# nginx.conf
location ${project.path_prefix}/ {
    proxy_pass ${proxyEndpoint}/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`

      case 'cloudflare':
        return `// Cloudflare Workers
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('${project.path_prefix}')) {
      const newUrl = '${proxyEndpoint}' + url.pathname.slice('${project.path_prefix}'.length);
      return fetch(newUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }

    // Handle other requests normally
    return fetch(request);
  }
}`

      default:
        return `Proxy all requests from ${project.domain}${project.path_prefix}/* to ${proxyEndpoint}/*`
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getConfigCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (!project) return

    setVerifying(true)
    setVerifyResult(null)
    setVerifyMessage('')

    try {
      const verifyUrl = `https://${project.domain}${project.path_prefix}/__verify__`
      const response = await fetch(`/api/verify?url=${encodeURIComponent(verifyUrl)}`)
      const data = await response.json()

      if (data.success && data.projectKey === project.project_key) {
        setVerifyResult('success')
        setVerifyMessage('Configuration verified successfully! Your project is now active.')

        // Update project status to active
        await supabase
          .from('projects')
          .update({ status: 'active' })
          .eq('id', project.id)

        setProject({ ...project, status: 'active' })
      } else {
        setVerifyResult('error')
        // Provide more helpful error messages
        let errorMessage = data.error || 'Verification failed.'
        if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
          errorMessage = 'Unable to connect to your domain. Please check:\n1. Your domain is correctly configured\n2. The vercel.json/configuration has been deployed (run git push)\n3. Wait 1-2 minutes for Vercel to deploy, then try again'
        } else if (errorMessage.includes('404')) {
          errorMessage = 'The proxy endpoint returned 404. Please verify your rewrite rules are correct and deployed.'
        } else if (errorMessage.includes('Invalid verification')) {
          errorMessage = 'The endpoint responded but the project key does not match. Check your configuration.'
        }
        setVerifyMessage(errorMessage)
      }
    } catch {
      setVerifyResult('error')
      setVerifyMessage('Network error. Please check your internet connection and try again.')
    }

    setVerifying(false)
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Project
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Instructions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your website to proxy requests to our service
          </p>
        </div>

        {/* Step 1: Select Platform */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step 1: Select your platform
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['vercel', 'netlify', 'nginx', 'cloudflare', 'other'] as Platform[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${
                      platform === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Configuration Code */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Step 2: Add this configuration
              </h3>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
              {getConfigCode()}
            </pre>
            <div className="mt-4 text-sm text-gray-500">
              <p>
                <strong>Proxy Endpoint:</strong>{' '}
                <code className="bg-gray-100 px-1 rounded">{proxyEndpoint}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Deploy & Verify */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step 3: Deploy and verify
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              After deploying your configuration, click the button below to verify
              the setup is working correctly.
            </p>

            {verifyResult && (
              <div
                className={`mb-4 px-4 py-3 rounded-md text-sm ${
                  verifyResult === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                <div className="whitespace-pre-line">{verifyMessage}</div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Configuration'}
              </button>

              {project.status === 'active' && (
                <span className="inline-flex items-center text-sm text-green-600">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Project is active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Troubleshooting
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Verification fails?</strong> Make sure you&apos;ve deployed
                your configuration changes and wait a few seconds before verifying.
              </p>
              <p>
                <strong>404 errors?</strong> Check that the path prefix in your
                configuration matches exactly: <code className="bg-gray-100 px-1 rounded">{project.path_prefix}</code>
              </p>
              <p>
                <strong>Still having issues?</strong> Test manually by visiting{' '}
                <code className="bg-gray-100 px-1 rounded">
                  https://{project.domain}{project.path_prefix}/__verify__
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push(`/projects/${project.id}`)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Continue to Project
          </button>
        </div>
      </div>
    </div>
  )
}
