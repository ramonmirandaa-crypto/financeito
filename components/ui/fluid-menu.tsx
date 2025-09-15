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
      <div 
        className={`relative flex items-center justify-center ${className || ''}`}
        data-expanded={isExpanded}
      >
        {children}
      </div>
    </MenuContext.Provider>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  index?: number
  label?: string
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

  // Cálculo da posição para distribuir os itens em círculo
  const totalItems = 5 // 5 itens de navegação
  const angle = isMainButton ? 0 : (index - 1) * (360 / totalItems) // Distribui os 5 itens
  const radius = 80 // Raio do círculo
  const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius
  const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius

  const buttonElement = (
    <button
      onClick={handleClick}
      className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-500 ease-in-out backdrop-blur-xl border border-card-glass/20 shadow-lg bg-card-glass/30 hover:bg-card-glass/50 ${
        isMainButton 
          ? "w-16 h-16 bg-card-glass/40 hover:bg-card-glass/60 shadow-xl" 
          : "w-12 h-12"
      } ${
        isActive && !isMainButton ? "bg-primary/20 border-primary/40 shadow-primary/20" : ""
      } ${
        className || ""
      }`}
      style={{
        transform: !isMainButton && isExpanded 
          ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
          : !isMainButton 
            ? "translate(-50%, -50%) scale(0)" 
            : undefined,
        opacity: isMainButton ? 1 : isExpanded ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        left: !isMainButton ? "50%" : undefined,
        top: !isMainButton ? "50%" : undefined
      }}
      title={label}
    >
      <div className="text-slate-200 hover:text-white transition-colors duration-200">
        {icon}
      </div>
      
      {/* Indicador de item ativo */}
      {isActive && !isMainButton && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
      )}
    </button>
  )

  if (href && !isMainButton) {
    return (
      <Link 
        href={href} 
        className={`absolute flex items-center justify-center rounded-full transition-all duration-500 ease-in-out backdrop-blur-xl border border-card-glass/20 shadow-lg bg-card-glass/30 hover:bg-card-glass/50 w-12 h-12 ${
          isActive ? "bg-primary/20 border-primary/40 shadow-primary/20" : ""
        }`}
        onClick={() => setIsExpanded(false)}
        style={{
          transform: isExpanded 
            ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
            : "translate(-50%, -50%) scale(0)",
          opacity: isExpanded ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          left: "50%",
          top: "50%"
        }}
        title={label}
      >
        <div className="text-slate-200 hover:text-white transition-colors duration-200">
          {icon}
        </div>
        
        {/* Indicador de item ativo */}
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
        )}
      </Link>
    )
  }

  return <div className={isMainButton ? "" : "absolute"}>{buttonElement}</div>
}