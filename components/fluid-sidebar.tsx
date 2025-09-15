"use client"

import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu"
import { 
  Menu as MenuIcon, 
  X, 
  Home, 
  PiggyBank, 
  Target, 
  CreditCard, 
  TrendingUp 
} from "lucide-react"

export default function FluidSidebar() {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} strokeWidth={1.5} /> },
    { href: '/budget', label: 'Orçamento', icon: <PiggyBank size={20} strokeWidth={1.5} /> },
    { href: '/goals', label: 'Metas', icon: <Target size={20} strokeWidth={1.5} /> },
    { href: '/subscriptions', label: 'Assinaturas', icon: <CreditCard size={20} strokeWidth={1.5} /> },
    { href: '/loans', label: 'Empréstimos', icon: <TrendingUp size={20} strokeWidth={1.5} /> },
  ]

  return (
    <div className="fixed top-8 left-8 z-50">
      <div className="relative">
        {/* Efeito de background blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20 blur-3xl -z-10 rounded-full scale-150" />
        
        <MenuContainer>
          {/* Botão principal com ícone que muda */}
          <MenuItem
            isMainButton
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
          {navItems.map((item, index) => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              index={index + 1}
              label={item.label}
            />
          ))}
        </MenuContainer>
      </div>
    </div>
  )
}