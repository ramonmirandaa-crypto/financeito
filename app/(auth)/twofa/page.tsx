'use client'
import { useState } from 'react'

export default function TwoFA() {
  const [url, setUrl] = useState<string>('')
  const [verified, setVerified] = useState(false)
  async function setup() {
    const r = await fetch('/api/auth/twofa-setup', { method:'POST' })
    const j = await r.json()
    setUrl(j.otpauth_url)
  }
  return (
    <div className="max-w-sm mx-auto mt-16 space-y-3">
      <h1 className="text-2xl font-semibold">Ativar 2FA</h1>
      <button className="px-4 py-2 rounded bg-white/20" onClick={setup}>Gerar QR</button>
      {url && <p className="text-xs break-all">{url}</p>}
    </div>
  )
}
