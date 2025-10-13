// lib/teamwork/projects.ts

export interface TeamworkProject {
  id: string
  name: string
  description?: string
  status: string
  company?: {
    id: string
    name: string
  }
  category?: {
    id: string
    name: string
    color?: string
  }
  owner?: {
    id: string
    firstName: string
    lastName: string
  }
  startDate?: string
  endDate?: string
  createdOn?: string
  lastChangedOn?: string
  starred?: boolean
  tags?: Array<{
    id: string
    name: string
    color?: string
  }>
  [key: string]: any
}

export interface TeamworkCategory {
  id: string
  name: string
  color?: string
  projectCount?: number
}

export interface TeamworkPerson {
  id: string
  firstName: string
  lastName: string
  email?: string
}

export class TeamworkProjectsAPI {
  private baseUrl: string
  private headers: { [key: string]: string }

  constructor(site: string, apiKey: string) {
    // Ensure the site URL has https:// protocol
    let formattedSite = site
    if (!formattedSite.startsWith('http://') && !formattedSite.startsWith('https://')) {
      formattedSite = `https://${formattedSite}`
    }
    this.baseUrl = formattedSite.endsWith('/') ? formattedSite.slice(0, -1) : formattedSite
    this.headers = {
      'Authorization': `Basic ${Buffer.from(apiKey + ':xxx').toString('base64')}`,
      'Content-Type': 'application/json'
    }
  }

  async makeRequest(method: string, endpoint: string, data: any = null): Promise<any> {
    const url = `${this.baseUrl}/projects/api/v3${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: this.headers
    }
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      if (response.status === 204) return null
      return await response.json()
    } catch (error) {
      console.error(`API Request failed: ${method} ${endpoint}`, error instanceof Error ? error.message : error)
      throw error
    }
  }

  // Get all projects
  async getAllProjects(params?: {
    status?: 'active' | 'archived' | 'all'
    page?: number
    pageSize?: number
  }): Promise<{ projects: TeamworkProject[], meta?: any }> {
    const queryParams = new URLSearchParams()
    
    if (params?.status && params.status !== 'all') {
      queryParams.set('status', params.status)
    }
    if (params?.page) {
      queryParams.set('page', params.page.toString())
    }
    if (params?.pageSize) {
      queryParams.set('pageSize', params.pageSize.toString())
    }

    const endpoint = `/projects.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await this.makeRequest('GET', endpoint)
    return response
  }

  // Get a single project
  async getProject(projectId: string): Promise<{ project: TeamworkProject }> {
    return await this.makeRequest('GET', `/projects/${projectId}.json`)
  }

  // Update a project
  async updateProject(projectId: string, projectData: Partial<TeamworkProject>): Promise<any> {
    return await this.makeRequest('PUT', `/projects/${projectId}.json`, { project: projectData })
  }

  // Get all categories
  async getCategories(): Promise<{ categories: TeamworkCategory[] }> {
    const response = await this.makeRequest('GET', '/projectcategories.json')
    return response
  }

  // Get all people (for owners)
  async getPeople(): Promise<{ people: TeamworkPerson[] }> {
    const response = await this.makeRequest('GET', '/people.json')
    return response
  }

  // Get all companies
  async getCompanies(): Promise<{ companies: Array<{ id: string, name: string }> }> {
    const response = await this.makeRequest('GET', '/companies.json')
    return response
  }
}

// Helper to initialize the API client
export function getTeamworkProjectsAPI(): TeamworkProjectsAPI {
  const site = process.env.TEAMWORK_SITE
  const apiKey = process.env.TEAMWORK_PROJECT_API_KEY

  if (!site || !apiKey) {
    throw new Error('Missing TEAMWORK_SITE or TEAMWORK_PROJECT_API_KEY environment variables')
  }

  return new TeamworkProjectsAPI(site, apiKey)
}

