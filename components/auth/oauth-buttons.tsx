"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function OAuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="space-y-2">
        <p className="text-sm opacity-80">Logado como {session.user?.email}</p>
        <button
          className="w-full px-4 py-2 rounded bg-white/20"
          onClick={() => signOut()}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        className="w-full px-4 py-2 rounded bg-white/20"
        onClick={() => signIn("github")}
      >
        Entrar com GitHub
      </button>
    </div>
  );
}

export default OAuthButtons;
