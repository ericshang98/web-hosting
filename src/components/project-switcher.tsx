'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function ProjectSwitcher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const projectId = searchParams.get('project')

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setProjects(data as Project[])

        // Auto-select project from URL or first project
        if (projectId) {
          const found = data.find(p => p.id === projectId)
          if (found) setSelectedProject(found as Project)
        } else if (data.length > 0) {
          // Auto-select first project and update URL
          setSelectedProject(data[0] as Project)
          router.replace(`/dashboard?project=${data[0].id}`)
        }
      }
      setLoading(false)
    }

    fetchProjects()
  }, [projectId, supabase, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    setIsOpen(false)
    router.push(`/dashboard?project=${project.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-400">/</span>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          {selectedProject ? (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedProject.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="font-medium">{selectedProject.domain}</span>
            </>
          ) : (
            <span className="text-gray-500">Select Project</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects
              </div>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 ${
                      selectedProject?.id === project.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        project.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.domain}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {project.path_prefix}/*
                      </p>
                    </div>
                    {selectedProject?.id === project.id && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No projects yet
                </div>
              )}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link
                  href="/projects/new"
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Project</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedProject && (
        <>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{selectedProject.path_prefix}</span>
        </>
      )}
    </div>
  )
}
