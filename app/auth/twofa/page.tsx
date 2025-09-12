"use client"
import { useState } from "react";

export default function TwoFASetupPage() {
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function handleGenerate() {
    const res = await fetch("/api/auth/twofa/setup");
    const data = await res.json();
    setQr(data.qr);
  }

  async function handleVerify() {
    const res = await fetch("/api/auth/twofa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (res.ok) setMsg("2FA ativado com sucesso");
    else setMsg("Código inválido");
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ativar 2FA</h1>
      <button onClick={handleGenerate} className="bg-purple-600 text-white p-2 rounded">Gerar QR</button>
      {qr && <img src={qr} alt="QR Code" className="my-4" />}
      <input
        type="text"
        placeholder="Código do app"
        value={code}
        onChange={e => setCode(e.target.value)}
        className="p-2 border rounded"
      />
      <button onClick={handleVerify} className="bg-blue-600 text-white p-2 rounded mt-2">Verificar</button>
      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}
