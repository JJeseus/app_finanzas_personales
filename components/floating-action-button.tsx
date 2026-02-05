'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg',
        'bg-primary hover:bg-primary/90 active:scale-95 transition-transform',
        className
      )}
    >
      <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="sr-only">Agregar movimiento</span>
    </Button>
  )
}
