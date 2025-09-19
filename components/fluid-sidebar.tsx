"use client"

import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu"
import { useTheme } from "@/contexts/theme-context"
import { navigationItems } from "@/config/navigation"
import { Menu as MenuIcon, X, Moon, Sun } from "lucide-react"

export default function FluidSidebar() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="fixed top-8 left-8 z-50">
      <div className="relative">
        {/* Efeito de background blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent blur-3xl -z-10 rounded-full scale-150" />
        
        <MenuContainer>
          {/* Botão principal com ícone que muda */}
          <MenuItem
            isMainButton
            label="Menu de navegação"
            icon={
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 transition-all duration-500 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180">
                  <MenuIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 transition-all duration-500 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0">
                  <X size={24} strokeWidth={1.5} />
                </div>
              </div>
            }
          />
          
          {/* Itens de navegação */}
          {navigationItems.map((item, index) => {
            const Icon = item.icon

            return (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={
                  Icon ? <Icon size={20} strokeWidth={1.5} /> : undefined
                }
                index={index + 1}
                label={item.label}
              />
            )
          })}
          <MenuItem
            onClick={toggleTheme}
            index={navigationItems.length + 1}
            label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            icon={
              <div className="relative flex h-6 w-6 items-center justify-center">
                <Sun
                  strokeWidth={1.5}
                  className={`h-5 w-5 transition-all duration-300 ${
                    isDark
                      ? 'rotate-90 scale-0 opacity-0'
                      : 'rotate-0 scale-100 opacity-100 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]'
                  }`}
                />
                <Moon
                  strokeWidth={1.5}
                  className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 transition-all duration-300 ${
                    isDark
                      ? 'rotate-0 scale-100 opacity-100 text-sky-300 drop-shadow-[0_0_10px_rgba(125,211,252,0.45)]'
                      : '-rotate-90 scale-0 opacity-0'
                  }`}
                />
              </div>
            }
          />
        </MenuContainer>
      </div>
    </div>
  )
}
