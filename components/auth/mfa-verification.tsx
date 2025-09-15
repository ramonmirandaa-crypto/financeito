"use client";

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertCircle, Smartphone, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MFAVerificationProps {
  redirectUrl?: string;
}

export default function MFAVerification({ redirectUrl = "/dashboard" }: MFAVerificationProps) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState<'phone_code' | 'totp' | 'backup_code'>('phone_code');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: strategy as any, // Clerk types may be restrictive
        code: code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl);
      }
    } catch (err: any) {
      // Sanitize MFA error messages
      const errorCode = err.errors?.[0]?.code;
      if (errorCode === 'form_code_incorrect') {
        setError('Código de verificação incorreto. Tente novamente.');
      } else if (errorCode === 'form_code_expired') {
        setError('Código de verificação expirado. Solicite um novo código.');
      } else if (errorCode === 'form_code_already_used') {
        setError('Este código já foi utilizado. Solicite um novo código.');
      } else {
        setError('Erro na verificação. Tente novamente.');
      }
      
      // Log detailed error for debugging (only in development)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('MFA verification error:', err.errors?.[0]);
      }
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.prepareSecondFactor({
        strategy: strategy as any, // Clerk types may be restrictive
      });
      setError('');
      // Show success message (you could add a toast here)
    } catch (err) {
      setError('Erro ao reenviar código. Tente novamente.');
    }
  };

  const handleGoBack = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/10 to-primary-glow/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-glow/5 backdrop-blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-card-glass/60 backdrop-blur-xl border-card-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Verificação de Segurança
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Digite o código de verificação para continuar
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            <div className="space-y-3">
              <Label className="text-foreground">Método de verificação:</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStrategy('phone_code')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    strategy === 'phone_code'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border/50 text-muted-foreground hover:border-card-border'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">SMS</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setStrategy('totp')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    strategy === 'totp'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border/50 text-muted-foreground hover:border-card-border'
                  }`}
                >
                  <Key className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">Autenticador</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">
                  Código de verificação
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={strategy === 'phone_code' ? '123456' : '123456'}
                  className="text-center text-2xl tracking-widest bg-card-glass/30 border-card-border/50"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  {strategy === 'phone_code' 
                    ? 'Digite o código de 6 dígitos enviado por SMS'
                    : 'Digite o código do seu app autenticador'
                  }
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !code || code.length < 6}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold py-3"
              >
                {isLoading ? 'Verificando...' : 'Verificar código'}
              </Button>
            </form>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full bg-card-glass/30 border-card-border/50 hover:bg-card-glass/50"
              >
                Reenviar código
              </Button>

              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Autenticação de dois fatores ativa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}