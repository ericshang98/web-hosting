export type ProjectStatus = 'pending' | 'active' | 'inactive'
export type PageStatus = 'draft' | 'published' | 'offline'

export interface Project {
  id: string
  user_id: string
  domain: string
  path_prefix: string
  project_key: string
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  project_id: string
  path: string
  title: string
  content: string
  meta_description: string
  meta_keywords: string
  status: PageStatus
  view_count: number
  created_at: string
  updated_at: string
}

export interface PageView {
  id: string
  page_id: string
  viewed_at: string
  user_agent: string | null
  referer: string | null
}
