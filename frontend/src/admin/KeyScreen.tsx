import { useState, type FormEvent } from 'react'

interface Props {
  /** Shown above the form, e.g. after a rejected key. */
  notice?: string | null
  onSubmit: (key: string) => void
}

/** Asks for the admin key. The key is handed to the parent, which keeps it in sessionStorage only. */
export default function KeyScreen({ notice, onSubmit }: Props) {
  const [value, setValue] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const key = value.trim()
    if (key) onSubmit(key)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-card space-y-4">
        <h1 className="text-2xl font-semibold text-primary display-font">Admin key</h1>
        <p className="text-gray-600">
          Enter the admin key to manage articles and secret links. It is kept only until this tab is closed.
        </p>
        {notice && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {notice}
          </p>
        )}
        <div>
          <label htmlFor="admin-key" className="block text-sm font-medium text-gray-700 mb-1">Admin key</label>
          <input
            id="admin-key"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" className="btn-primary w-full">Open admin</button>
      </form>
    </div>
  )
}
