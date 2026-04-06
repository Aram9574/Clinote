const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  token?: string
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail?.message || error.detail || `API error ${res.status}`)
  }
  return res
}

export async function fetchCases(token: string, page = 1) {
  const res = await apiFetch(`/api/v1/cases?page=${page}&per_page=20`, { token })
  return res.json()
}

export async function fetchCase(token: string, caseId: string) {
  const res = await apiFetch(`/api/v1/cases/${caseId}`, { token })
  return res.json()
}

export async function updateSOAP(
  token: string,
  caseId: string,
  soap: { S?: string; O?: string; A?: string; P?: string }
) {
  const res = await apiFetch(`/api/v1/cases/${caseId}/soap`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(soap),
  })
  return res.json()
}

export async function acknowledgeAlert(token: string, caseId: string, alertId: string) {
  const res = await apiFetch(`/api/v1/cases/${caseId}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    token,
  })
  return res.json()
}

export async function fetchEvidence(token: string, caseId: string) {
  const res = await apiFetch(`/api/v1/cases/${caseId}/evidence`, { token })
  return res.json()
}

export { API_BASE }
