"use client";

import OAuthButtons from "./oauth-buttons";

interface AuthFormProps {
  title: string;
}

export function AuthForm({ title }: AuthFormProps) {
  return (
    <div className="max-w-sm mx-auto mt-16 space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <OAuthButtons />
    </div>
  );
}

export default AuthForm;
