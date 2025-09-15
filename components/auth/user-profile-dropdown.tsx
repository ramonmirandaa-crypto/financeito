"use client";

import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Shield, 
  CreditCard, 
  LogOut, 
  ChevronDown,
  Bell,
  HelpCircle 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function UserProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const menuItems = [
    {
      icon: User,
      label: 'Meu Perfil',
      action: () => router.push('/profile'),
      shortcut: 'P'
    },
    {
      icon: Settings,
      label: 'Configurações',
      action: () => router.push('/settings'),
      shortcut: 'S'
    },
    {
      icon: Shield,
      label: 'Segurança',
      action: () => router.push('/security'),
      shortcut: 'Ctrl+S'
    },
    {
      icon: CreditCard,
      label: 'Planos & Cobrança',
      action: () => router.push('/billing'),
      shortcut: 'B'
    },
    {
      icon: Bell,
      label: 'Notificações',
      action: () => router.push('/notifications'),
      shortcut: 'N'
    },
    {
      icon: HelpCircle,
      label: 'Ajuda & Suporte',
      action: () => router.push('/help'),
      shortcut: '?'
    }
  ];

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user.fullName || `${user.firstName} ${user.lastName}` || 'Usuário';
  const userEmail = user.primaryEmailAddress?.emailAddress || '';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 hover:bg-card-glass/30 transition-colors"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.imageUrl} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground truncate max-w-32">
            {userName}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-32">
            {userEmail}
          </p>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-card-glass/80 backdrop-blur-xl border border-card-border/50 rounded-xl shadow-2xl z-50"
            >
              <div className="p-4 border-b border-card-border/30">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.imageUrl} alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-card-glass/30 transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="flex-1 text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.shortcut}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="py-2 border-t border-card-border/30">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/10 transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                  <span className="flex-1 text-sm font-medium text-foreground group-hover:text-destructive transition-colors">
                    Sair da conta
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}