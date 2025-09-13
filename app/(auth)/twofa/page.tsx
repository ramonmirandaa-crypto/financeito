'use client'
import { useState } from 'react'
import QRCode from 'qrcode'

export default function TwoFA() {
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')

  async function setup() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('2fa_token') : null
    const r = await fetch('/api/auth/twofa/setup', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    const j = await r.json()
    setSecret(j.secret)
    const dataUrl = await QRCode.toDataURL(j.otpauth_url)
    setQr(dataUrl)
  }

  async function verify() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('2fa_token') : null
    const r = await fetch('/api/auth/twofa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ secret, token: code })
    })
    const j = await r.json()
    if (j.ok) setMsg('2FA ativado com sucesso')
    else setMsg(j.error || 'Código inválido')
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-3">
      <h1 className="text-2xl font-semibold">Ativar 2FA</h1>
      <button className="px-4 py-2 rounded bg-white/20" onClick={setup}>Gerar QR</button>
      {qr && <img src={qr} alt="QR Code" className="w-48 h-48" />}
      {qr && (
        <>
          <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Código" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="px-4 py-2 rounded bg-white/20" onClick={verify}>Verificar</button>
        </>
      )}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  )
}
