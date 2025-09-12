'use client'
import { useState } from 'react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function doRegister() {
    const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) })
    const j = await r.json()
    if (!j.ok) { alert(j.error || 'Erro'); return }
    window.location.href = '/(auth)/login'
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-3">
      <h1 className="text-2xl font-semibold">Registrar</h1>
      <input className="w-full px-3 py-2 rounded bg-white/10" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full px-3 py-2 rounded bg-white/10" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="px-4 py-2 rounded bg-white/20" onClick={doRegister}>Criar conta</button>
    </div>
  )
}
