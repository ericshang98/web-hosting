'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectSwitcher } from './project-switcher'
import type { User } from '@supabase/supabase-js'

interface DashboardNavProps {
  user: User
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center space-x-1">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-lg font-bold text-gray-900">SEO Pages</span>
            </Link>
            <Suspense fallback={<span className="text-gray-400 text-sm ml-2">/ Loading...</span>}>
              <ProjectSwitcher />
            </Suspense>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
