'use client'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)

  async function doLogin() {
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) })
    const j = await r.json()
    if (!j.ok) { alert(j.error || 'Erro'); return }
    if (j.require2FA) {
      const token = r.headers.get('authorization')
      if (token) localStorage.setItem('2fa_token', token)
      setNeeds2fa(true)
    } else window.location.href = '/dashboard'
  }

  async function verify2FA() {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('2fa_token') : null
    const r = await fetch('/api/auth/twofa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ token: code })
    })
    const j = await r.json()
    if (!j.ok) { alert(j.error || 'Erro 2FA'); return }
    if (typeof window !== 'undefined') localStorage.removeItem('2fa_token')
    window.location.href = '/dashboard'
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-3">
      {!needs2fa ? (<>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-white/10" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 rounded bg-white/20" onClick={doLogin}>Entrar</button>
        <p className="text-sm opacity-80">Ainda não tem conta? <a href="/register" className="underline">Registrar</a></p>
      </>) : (<>
        <h1 className="text-2xl font-semibold">2FA</h1>
        <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Código 6 dígitos" value={code} onChange={e=>setCode(e.target.value)} />
        <button className="px-4 py-2 rounded bg-white/20" onClick={verify2FA}>Verificar</button>
      </>)}
    </div>
  )
}
