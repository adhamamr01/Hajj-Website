import axios from 'axios'

// Admin calls are separate from the public client on purpose: they send the admin
// key, and nothing here is ever cached (every call goes to the network).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

export interface AdminArticleSummary {
  id: number
  titleEn: string | null
  titleAr: string | null
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  linkToken: string | null
}

export interface AdminArticle extends AdminArticleSummary {
  summaryEn: string | null
  summaryAr: string | null
  bodyEn: string | null
  bodyAr: string | null
}

export interface AdminLink {
  type: string
  key: string
  token: string
  createdAt: string
}

/** The editable text of an article; always strings (empty = not written yet). */
export interface ArticleFields {
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr: string
  bodyEn: string
  bodyAr: string
}

/** The backend refused the admin key (401/403). */
export class AdminAuthError extends Error {
  constructor() {
    super('Admin key not accepted')
  }
}

async function call<T>(key: string, method: 'get' | 'post' | 'put' | 'delete', url: string, data?: unknown): Promise<T> {
  try {
    const res = await api.request<T>({ method, url, data, headers: { 'X-Admin-Key': key } })
    return res.data
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 403) throw new AdminAuthError()
    throw err
  }
}

/** A readable message for a failed admin call (the backend's own message when it sent one). */
export function errorMessage(err: unknown): string {
  const res = (err as { response?: { status?: number; data?: { error?: string } } })?.response
  if (res?.status === 429) return 'Too many requests — wait a minute and try again.'
  if (res?.data?.error) return res.data.error
  return 'Something went wrong. Check the connection and try again.'
}

export const listArticles = (key: string) => call<AdminArticleSummary[]>(key, 'get', '/admin/articles')
export const getArticle = (key: string, id: number) => call<AdminArticle>(key, 'get', `/admin/articles/${id}`)
export const createArticle = (key: string, fields: ArticleFields) => call<AdminArticle>(key, 'post', '/admin/articles', fields)
export const updateArticle = (key: string, id: number, fields: ArticleFields) =>
  call<AdminArticle>(key, 'put', `/admin/articles/${id}`, fields)
export const deleteArticle = (key: string, id: number) => call<void>(key, 'delete', `/admin/articles/${id}`)
export const publishArticle = (key: string, id: number) => call<AdminArticle>(key, 'post', `/admin/articles/${id}/publish`)
export const unpublishArticle = (key: string, id: number) => call<AdminArticle>(key, 'post', `/admin/articles/${id}/unpublish`)
export const listLinks = (key: string) => call<AdminLink[]>(key, 'get', '/admin/links')
export const resetLink = (key: string, type: 'PAGE' | 'ARTICLE', target: string | number) =>
  call<AdminLink>(key, 'post', `/admin/links/${type}/${target}/reset`)
