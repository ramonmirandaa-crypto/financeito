import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallback() {
  return <AuthenticateWithRedirectCallback />
}

export const metadata = {
  title: "Autenticando... - Financeito",
  description: "Processando sua autenticação"
};