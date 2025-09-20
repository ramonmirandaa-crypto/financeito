"use client";

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const allowedLogHostnames = (process.env.NEXT_PUBLIC_ALLOWED_LOG_HOSTNAMES ?? 'localhost,192.168.0.18')
  .split(',')
  .map((hostname) => hostname.trim())
  .filter(Boolean);

const isAllowedLogHostname = () =>
  typeof window !== 'undefined' && allowedLogHostnames.includes(window.location.hostname);

interface CustomSignUpProps {
  redirectUrl?: string;
}

export default function CustomSignUp({ redirectUrl = "/dashboard" }: CustomSignUpProps) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      await result.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      // Sanitize error messages for security
      const errorCode = err.errors?.[0]?.code;
      if (errorCode === 'form_identifier_exists') {
        setError('Este e-mail já está em uso');
      } else if (errorCode === 'form_password_pwned') {
        setError('Esta senha foi comprometida. Escolha uma senha mais segura.');
      } else if (errorCode === 'form_password_too_common') {
        setError('Escolha uma senha mais segura e única');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
      
      // Log detailed error for debugging (only in development)
      if (isAllowedLogHostname()) {
        console.error('Signup error:', err.errors?.[0]);
      }
    }

    setIsLoading(false);
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl);
      }
    } catch (err: any) {
      // Sanitize verification error messages
      const errorCode = err.errors?.[0]?.code;
      if (errorCode === 'form_code_incorrect') {
        setError('Código de verificação incorreto. Tente novamente.');
      } else if (errorCode === 'verification_expired') {
        setError('Código de verificação expirado. Solicite um novo código.');
      } else {
        setError('Erro na verificação. Tente novamente.');
      }
      
      // Log detailed error for debugging (only in development)
      if (isAllowedLogHostname()) {
        console.error('Verification error:', err.errors?.[0]);
      }
    }

    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      setError('Erro ao conectar com Google');
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-destructive', 'bg-warning', 'bg-warning', 'bg-success'];
  const strengthLabels = ['Fraca', 'Moderada', 'Boa', 'Forte'];

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
                💰 Financeito
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {pendingVerification ? 'Verifique seu e-mail' : 'Crie sua conta'}
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

            {!pendingVerification ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">
                        Nome
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="João"
                          className="pl-10 bg-card-glass/30 border-card-border/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">
                        Sobrenome
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Silva"
                        className="bg-card-glass/30 border-card-border/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 bg-card-glass/30 border-card-border/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-card-glass/30 border-card-border/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 w-full rounded ${
                                i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Força da senha: {strengthLabels[passwordStrength - 1] || 'Muito fraca'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !firstName || !lastName || !emailAddress || !password}
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold py-3"
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-card-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full bg-card-glass/30 border-card-border/50 hover:bg-card-glass/50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </>
            ) : (
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-success mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Enviamos um código de verificação para:
                  </p>
                  <p className="font-semibold text-foreground">{emailAddress}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-foreground">
                    Código de verificação
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest bg-card-glass/30 border-card-border/50"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !code || code.length < 6}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold py-3"
                >
                  {isLoading ? 'Verificando...' : 'Verificar e criar conta'}
                </Button>
              </form>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <button 
                  onClick={() => router.push('/login')}
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Fazer login
                </button>
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Protegido com criptografia de nível bancário</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}