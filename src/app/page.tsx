import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">SEO Pages</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <main className="py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Host SEO Pages on Your Domain
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Keep your website, add our SEO-optimized content.
              We host the pages, you get the traffic from AI search engines.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-blue-700"
              >
                Start Free
              </Link>
              <a
                href="#how-it-works"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md font-medium text-lg hover:bg-gray-50"
              >
                Learn More
              </a>
            </div>
          </div>

          <div id="how-it-works" className="mt-32">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a Project</h3>
                <p className="text-gray-600">
                  Add your domain and choose the path prefix where your SEO pages will live.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Configure Your Site</h3>
                <p className="text-gray-600">
                  Add a simple rewrite rule to your Vercel, Netlify, or server configuration.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Publish Content</h3>
                <p className="text-gray-600">
                  Create SEO-optimized pages and publish them. They appear on your domain instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-32 bg-gray-50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Perfect for AI Search Optimization
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex items-start space-x-4">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold">Your Domain, Our Content</h3>
                  <p className="text-gray-600">Pages appear on your domain with proper canonical URLs.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold">Complete SEO Control</h3>
                  <p className="text-gray-600">Set titles, descriptions, and keywords for each page.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold">No Disruption</h3>
                  <p className="text-gray-600">Keep your existing site exactly as it is.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold">Analytics Included</h3>
                  <p className="text-gray-600">Track page views and performance.</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-12 border-t border-gray-200">
          <div className="text-center text-gray-500">
            <p>SEO Pages Hosting Service</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
