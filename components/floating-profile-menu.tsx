'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Headset, Moon, Settings as SettingsIcon, Sun, User as UserIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'
import { useToast } from '@/hooks/use-toast'

interface MenuAction {
  id: string
  label: string
  description?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  onSelect: () => void
}

const MENU_ID = 'floating-profile-menu-items'

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export default function FloatingProfileMenu() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [shouldFocusTrigger, setShouldFocusTrigger] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const displayName = useMemo(() => {
    if (!user) {
      return ''
    }

    const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return user.fullName || fallbackName || user.username || user.primaryEmailAddress?.emailAddress || 'Usuário'
  }, [user])

  const initials = useMemo(() => (displayName ? getInitials(displayName) : 'US'), [displayName])

  const closeMenu = useCallback((options?: { focusTrigger?: boolean }) => {
    setIsOpen(false)
    if (options?.focusTrigger) {
      setShouldFocusTrigger(true)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu({ focusTrigger: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [closeMenu, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const menuElement = menuRef.current
    if (!menuElement) {
      return
    }

    const focusable = menuElement.querySelectorAll<HTMLElement>('[data-menu-item]')
    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu({ focusTrigger: true })
        return
      }

      if (event.key === 'Tab') {
        if (focusable.length === 0) {
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement as HTMLElement | null

        if (!event.shiftKey && active === last) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && active === first) {
          event.preventDefault()
          last.focus()
        }
      }
    }

    menuElement.addEventListener('keydown', handleKeyDown)

    return () => {
      menuElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMenu, isOpen])

  useEffect(() => {
    if (!isOpen && shouldFocusTrigger) {
      triggerRef.current?.focus()
      setShouldFocusTrigger(false)
    }
  }, [isOpen, shouldFocusTrigger])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu({ focusTrigger: true })
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [closeMenu, isOpen])

  const handleMenuToggle = () => {
    setIsOpen(prev => !prev)
  }

  const handleNavigation = useCallback(
    (path: string, message?: { title: string; description?: string }) => {
      if (message) {
        toast.info(message.title, message.description)
      }
      router.push(path)
      closeMenu()
    },
    [closeMenu, router, toast]
  )

  const handleThemeToggle = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    toggleTheme()
    toast.success('Tema alterado', `Tema ${nextTheme === 'dark' ? 'escuro' : 'claro'} ativado.`)
    closeMenu()
  }, [closeMenu, theme, toggleTheme, toast])

  const menuActions: MenuAction[] = useMemo(
    () => [
      {
        id: 'support',
        label: 'Chamar agente',
        description: 'Fale com nosso time de suporte',
        icon: Headset,
        onSelect: () =>
          handleNavigation('/help', {
            title: 'Redirecionando para o suporte',
            description: 'Estamos levando você até a central de ajuda.'
          })
      },
      {
        id: 'profile',
        label: 'Meu perfil',
        description: 'Gerencie informações pessoais',
        icon: UserIcon,
        onSelect: () => handleNavigation('/profile')
      },
      {
        id: 'settings',
        label: 'Configurações',
        description: 'Preferências da conta',
        icon: SettingsIcon,
        onSelect: () => handleNavigation('/settings')
      }
    ],
    [handleNavigation]
  )

  const themeAction = useMemo<MenuAction>(() => {
    const isDark = theme === 'dark'
    return {
      id: 'theme',
      label: 'Alternar tema',
      description: isDark ? 'Ativar modo claro' : 'Ativar modo escuro',
      icon: isDark ? Sun : Moon,
      onSelect: handleThemeToggle
    }
  }, [handleThemeToggle, theme])

  if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user) {
    return null
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div
        className={cn(
          'origin-bottom-right rounded-2xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur-xl transition-all duration-200',
          isOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
        id={MENU_ID}
        ref={menuRef}
        role="menu"
        aria-labelledby="floating-profile-menu-trigger"
        hidden={!isOpen}
      >
        <div className="flex items-center gap-3 px-1 pb-3">
          <Avatar className="h-10 w-10 border border-border/60">
            <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-sm font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            {user.primaryEmailAddress?.emailAddress ? (
              <p className="text-xs text-muted-foreground truncate">
                {user.primaryEmailAddress.emailAddress}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {[...menuActions, themeAction].map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                data-menu-item
                tabIndex={-1}
                onClick={action.onSelect}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent/80 hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium leading-tight">{action.label}</span>
                  {action.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        ref={triggerRef}
        type="button"
        id="floating-profile-menu-trigger"
        aria-haspopup="menu"
        aria-controls={MENU_ID}
        aria-expanded={isOpen}
        onClick={handleMenuToggle}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="sr-only">Abrir menu do perfil</span>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    </div>
  )
}
