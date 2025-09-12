'use client'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState([{ date: '2025-01', balance: 1200 }])
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
        <h2 className="text-xl font-semibold mb-2">Saldo</h2>
        <p className="opacity-80 text-sm">Em breve: gráfico e saldos consolidados.</p>
      </div>
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
        <h2 className="text-xl font-semibold mb-2">Integração Open Finance</h2>
        <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30" onClick={async () => {
          const r = await fetch('/api/pluggy/link-token', { method: 'POST' })
          const json = await r.json() as any
          const connectToken = json.connectToken || json.linkToken
          // @ts-ignore
          const connect = new window.PluggyConnect({ connectToken })
          connect.onSuccess((item: any) => alert('Conta vinculada: ' + item.id))
          connect.init()
        }}>Conectar Conta</button>
      </div>
    </div>
  )
}
