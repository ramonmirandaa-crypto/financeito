"use client"

import * as React from 'react'
import { useState, createContext, useContext } from "react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  activeHref?: string
}

const MenuContext = createContext<MenuContextType>({
  isExpanded: false,
  setIsExpanded: () => {},
})

interface MenuContainerProps {
  children: React.ReactNode
  className?: string
}

export function MenuContainer({ children, className }: MenuContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()
  
  // Fecha o menu automaticamente quando a rota muda
  React.useEffect(() => {
    setIsExpanded(false)
  }, [pathname])
  
  return (
    <MenuContext.Provider value={{ isExpanded, setIsExpanded, activeHref: pathname }}>
      <nav 
        className={`relative flex items-center justify-center ${className || ''}`}
        data-expanded={isExpanded}
        aria-label="Menu principal de navegação"
      >
        {children}
      </nav>
    </MenuContext.Provider>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  index?: number
  label: string // Obrigatório para acessibilidade
  isMainButton?: boolean
}

export function MenuItem({ 
  icon, 
  href, 
  onClick, 
  className, 
  index = 0, 
  label,
  isMainButton = false
}: MenuItemProps) {
  const { isExpanded, setIsExpanded, activeHref } = useContext(MenuContext)
  const isActive = href && activeHref === href

  const handleClick = () => {
    if (isMainButton) {
      setIsExpanded(!isExpanded)
    } else {
      if (onClick) {
        onClick()
      }
      setIsExpanded(false) // Fecha o menu após clicar em um item
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ': // Espaço
        e.preventDefault()
        handleClick()
        break
      case 'Escape':
        if (isExpanded && !isMainButton) {
          e.preventDefault()
          setIsExpanded(false)
        }
        break
      case 'Tab':
        // Fecha o menu ao navegar por Tab para fora
        if (isExpanded && !isMainButton) {
          setIsExpanded(false)
        }
        break
    }
  }

  // Cálculo da posição para distribuir os itens verticalmente
  const itemSpacing = 60 // Espaçamento entre itens
  const x = 0 // Sem deslocamento horizontal
  const y = isMainButton ? 0 : index * itemSpacing // Distribui verticalmente

  const buttonElement = (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-500 ease-in-out backdrop-blur-md border shadow-lg focus-ring ${
        isMainButton
          ? "w-16 h-16 bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/20 shadow-2xl border-slate-300/70 dark:border-white/20"
          : "w-12 h-12 bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/20 border-slate-300/60 dark:border-white/10"
      } ${
        isActive && !isMainButton
          ? "bg-slate-300/80 dark:bg-white/20 border-foreground dark:border-white/50"
          : ""
      } ${
        className || ""
      }`}
      style={{
        transform: !isMainButton && isExpanded 
          ? `translate(-50%, ${y}px)` 
          : !isMainButton 
            ? "translate(-50%, 0px) scale(0)" 
            : undefined,
        opacity: isMainButton ? 1 : isExpanded ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        left: !isMainButton ? "50%" : undefined,
        top: !isMainButton ? "50%" : undefined,
        pointerEvents: !isMainButton && !isExpanded ? "none" : undefined
      }}
      aria-hidden={!isMainButton && !isExpanded}
      aria-label={label}
      aria-expanded={isMainButton ? isExpanded : undefined}
      tabIndex={!isMainButton && !isExpanded ? -1 : 0}
    >
      <div className="text-slate-800 hover:text-slate-900 dark:text-white/80 dark:hover:text-white transition-colors duration-200">
        {icon}
      </div>

      {/* Indicador de item ativo */}
      {isActive && !isMainButton && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-foreground dark:bg-white border-2 border-foreground dark:border-white/60" />
      )}
    </button>
  )

  if (href && !isMainButton) {
    return (
      <Link 
        href={href} 
        className={`absolute flex items-center justify-center rounded-full transition-all duration-500 ease-in-out backdrop-blur-md border w-12 h-12 focus-ring ${
          isActive
            ? "bg-slate-300/80 dark:bg-white/20 border-foreground dark:border-white/50"
            : "bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/20 border-slate-300/60 dark:border-white/10"
        } shadow-lg`}
        onClick={() => setIsExpanded(false)}
        onKeyDown={handleKeyDown}
        style={{
          transform: isExpanded 
            ? `translate(-50%, ${y}px)` 
            : "translate(-50%, 0px) scale(0)",
          opacity: isExpanded ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          left: "50%",
          top: "50%",
          pointerEvents: !isExpanded ? "none" : undefined
        }}
        aria-label={label}
        tabIndex={!isExpanded ? -1 : 0}
        aria-hidden={!isExpanded}
      >
        <div className="text-slate-800 hover:text-slate-900 dark:text-white/80 dark:hover:text-white transition-colors duration-200">
          {icon}
        </div>

        {/* Indicador de item ativo */}
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-foreground dark:bg-white border-2 border-foreground dark:border-white/60" />
        )}
      </Link>
    )
  }

  return (
    <div 
      className={isMainButton ? "" : "absolute"}
      style={!isMainButton ? {
        left: "50%",
        top: "50%",
        transform: isExpanded 
          ? `translate(-50%, ${y}px)` 
          : "translate(-50%, 0px) scale(0)",
        opacity: isExpanded ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: !isExpanded ? "none" : undefined
      } : undefined}
      aria-hidden={!isMainButton && !isExpanded}
    >
      {buttonElement}
    </div>
  )
}