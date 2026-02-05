'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search } from 'lucide-react'
import type {
  TransactionFilters,
  Category,
  Account,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from '@/lib/types'
import { categoryService, accountService } from '@/lib/data-service'

interface FiltersBarProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  showSearch?: boolean
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
]

export function FiltersBar({ filters, onChange, showSearch = true }: FiltersBarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const [cats, accs] = await Promise.all([
          categoryService.getAll(),
          accountService.getAll(),
        ])
        if (!alive) return
        setCategories(Array.isArray(cats) ? cats : [])
        setAccounts(Array.isArray(accs) ? accs : [])
      } catch (e) {
        if (!alive) return
        setCategories([])
        setAccounts([])
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const updateFilter = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const clearFilters = () => onChange({})

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  const activeFilterCount = Object.entries(filters).filter(
    ([, value]) =>
      value !== undefined &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0)
  ).length

  const getFilterLabel = (key: string, value: unknown): string => {
    switch (key) {
      case 'type':
        return value === 'income' ? 'Ingresos' : 'Gastos'
      case 'categoryId': {
        const cat = safeCategories.find((c) => c.id === value)
        return cat?.name || ''
      }
      case 'accountId': {
        const acc = safeAccounts.find((a) => a.id === value)
        return acc?.name || ''
      }
      case 'method': {
        const method = paymentMethods.find((m) => m.value === value)
        return method?.label || ''
      }
      case 'status':
        return value === 'confirmed' ? 'Confirmado' : 'Pendiente'
      case 'startDate':
        return `Desde: ${value}`
      case 'endDate':
        return `Hasta: ${value}`
      case 'minAmount':
        return `Min: $${value}`
      case 'maxAmount':
        return `Max: $${value}`
      default:
        return String(value)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        {showSearch && (
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={filters.searchText || ''}
              onChange={(e) => updateFilter('searchText', e.target.value || undefined)}
              className="pl-10 w-full"
            />
          </div>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-80" align="end">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
                  />
                </div>
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={filters.type ?? 'all'}
                  onValueChange={(v) =>
                    updateFilter('type', (v === 'all' ? undefined : (v as TransactionType)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={filters.categoryId ?? 'all'}
                  onValueChange={(v) =>
                    updateFilter('categoryId', v === 'all' ? undefined : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {safeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Cuenta</Label>
                <Select
                  value={filters.accountId ?? 'all'}
                  onValueChange={(v) =>
                    updateFilter('accountId', v === 'all' ? undefined : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {safeAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Método</Label>
                <Select
                  value={filters.method ?? 'all'}
                  onValueChange={(v) =>
                    updateFilter('method', (v === 'all' ? undefined : (v as PaymentMethod)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Estado</Label>
                <Select
                  value={filters.status ?? 'all'}
                  onValueChange={(v) =>
                    updateFilter('status', (v === 'all' ? undefined : (v as TransactionStatus)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Monto mínimo</Label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={filters.minAmount ?? ''}
                    onChange={(e) =>
                      updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Monto máximo</Label>
                  <Input
                    type="number"
                    placeholder="$999,999"
                    value={filters.maxAmount ?? ''}
                    onChange={(e) =>
                      updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
            Filtros activos:
          </span>

          {Object.entries(filters).map(([key, value]) => {
            if (value === undefined || value === '' || key === 'searchText') return null
            if (Array.isArray(value) && value.length === 0) return null

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {getFilterLabel(key, value)}
                <button
                  onClick={() => updateFilter(key as keyof TransactionFilters, undefined)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
