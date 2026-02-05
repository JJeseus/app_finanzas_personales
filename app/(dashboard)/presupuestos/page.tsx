'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import { budgetService, categoryService, formatCurrency } from '@/lib/data-service'
import type { Budget, Category } from '@/lib/types'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Wallet,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetWithDetails extends Budget {
  category?: Category
  spent: number
  percentage: number
}

interface BudgetFormData {
  categoryId: string
  limitAmount: number
}

const defaultFormData: BudgetFormData = {
  categoryId: '',
  limitAmount: 0,
}

/**
 * Esperado de budgetService.getMonthlyBalance(month):
 * {
 *   month: string
 *   income: number
 *   spent: number
 *   budgeted: number
 *   ... (otros campos pueden venir, no los usamos)
 * }
 */
type MonthlyBalance = {
  month: string
  income: number
  spent: number
  budgeted: number
}

export default function PresupuestosPage() {
  const { toast } = useToast()

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))

  const [budgets, setBudgets] = useState<BudgetWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [monthlyBalance, setMonthlyBalance] = useState<MonthlyBalance | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      // Categorías de gasto para presupuestos
      const catsAll = await categoryService.getAll()
      const cats = (Array.isArray(catsAll) ? catsAll : []).filter(
        (c) => c.type === 'expense' || c.type === 'both'
      )
      setCategories(cats)

      // Presupuestos del mes
      const monthBudgets = await budgetService.getByMonth(currentMonth)

      const budgetsWithDetails: BudgetWithDetails[] = await Promise.all(
        (Array.isArray(monthBudgets) ? monthBudgets : []).map(async (budget) => {
          const category = cats.find((c) => c.id === budget.categoryId)
          const spent = await budgetService.getSpentAmount(budget.categoryId, currentMonth)
          const percentage =
            budget.limitAmount > 0 ? Math.min((spent / budget.limitAmount) * 100, 100) : 0

          return { ...budget, category, spent, percentage }
        })
      )

      setBudgets(budgetsWithDetails)

      // Balance mensual (ingreso confirmado y gasto confirmado)
      const mb = await budgetService.getMonthlyBalance(currentMonth)
      setMonthlyBalance(mb as MonthlyBalance)
    } catch (e) {
      console.error('Error loading budgets data', e)
      setBudgets([])
      setCategories([])
      setMonthlyBalance(null)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentMonth])

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        categoryId: editingBudget.categoryId,
        limitAmount: editingBudget.limitAmount,
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [editingBudget])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.categoryId) newErrors.categoryId = 'Selecciona una categoría'
    if (!Number.isFinite(formData.limitAmount) || formData.limitAmount <= 0) {
      newErrors.limitAmount = 'El límite debe ser mayor a 0'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, { ...formData, month: currentMonth })
        toast({
          title: 'Presupuesto actualizado',
          description: 'El presupuesto se ha actualizado correctamente.',
        })
      } else {
        await budgetService.create({ ...formData, month: currentMonth })
        toast({
          title: 'Presupuesto creado',
          description: 'El presupuesto se ha creado correctamente.',
        })
      }

      await loadData()
      setIsModalOpen(false)
      setEditingBudget(null)
      setFormData(defaultFormData)
      setErrors({})
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo guardar el presupuesto.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await budgetService.delete(deletingId)
      await loadData()
      setDeletingId(null)
      toast({
        title: 'Presupuesto eliminado',
        description: 'El presupuesto se ha eliminado correctamente.',
      })
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo eliminar el presupuesto.',
        variant: 'destructive',
      })
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1)
    setCurrentMonth(date.toISOString().slice(0, 7))
  }

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }

  // === 🔥 ÚNICA MÉTRICA: Flujo de efectivo vs Presupuesto ===
  const totals = useMemo(() => {
    const income = Number(monthlyBalance?.income ?? 0)
    const spent = Number(monthlyBalance?.spent ?? 0)

    // Si por alguna razón getMonthlyBalance no trae budgeted,
    // usamos la suma de presupuestos como fallback.
    const fallbackBudgeted = budgets.reduce((s, b) => s + Number(b.limitAmount ?? 0), 0)
    const budgeted = Number(monthlyBalance?.budgeted ?? fallbackBudgeted)

    const realFlow = income - spent // ✅ flujo neto real del mes
    const coveragePct = budgeted > 0 ? (realFlow / budgeted) * 100 : 0
    const coverageClamped = Math.min(Math.max(coveragePct, 0), 100)

    // Diferencia contra el plan (positivo: cubres; negativo: falta)
    const gapVsBudget = realFlow - budgeted

    return {
      income,
      spent,
      budgeted,
      realFlow,
      coveragePct,
      coverageClamped,
      gapVsBudget,
    }
  }, [monthlyBalance, budgets])

  const statusUi = useMemo(() => {
    // Criterio simple y claro:
    // - budgeted = 0: no hay plan, mostramos neutral
    // - realFlow >= budgeted: control
    // - si falta: alerta
    if (totals.budgeted <= 0) {
      return {
        badgeText: 'Sin presupuesto',
        badgeClass: 'bg-muted text-muted-foreground',
        icon: Wallet,
        message: 'Define un presupuesto para comparar contra tu flujo real.',
        messageClass: 'text-muted-foreground',
      }
    }

    if (totals.gapVsBudget >= 0) {
      return {
        badgeText: 'En control',
        badgeClass: 'bg-income/10 text-income',
        icon: CheckCircle,
        message: `Cubres el presupuesto (+${formatCurrency(totals.gapVsBudget)})`,
        messageClass: 'text-income',
      }
    }

    return {
      badgeText: 'Riesgo',
      badgeClass: 'bg-warning/10 text-warning',
      icon: AlertTriangle,
      message: `Te faltan ${formatCurrency(Math.abs(totals.gapVsBudget))} para cubrir el presupuesto`,
      messageClass: 'text-warning',
    }
  }, [totals])

  // Get categories that don't have a budget yet
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.categoryId === cat.id) || editingBudget?.categoryId === cat.id
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-muted-foreground">Compara tu flujo de efectivo real vs tu presupuesto</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[200px] text-center text-lg font-medium capitalize">
          {formatMonthDisplay(currentMonth)}
        </span>
        <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* === Balance Card (solo flujo vs presupuesto) === */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Flujo vs Presupuesto
          </CardTitle>
          <Badge className={cn('font-normal', statusUi.badgeClass)}>{statusUi.badgeText}</Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Flujo real del mes</p>
              <p className={cn('mt-1 text-3xl font-bold', totals.realFlow >= 0 ? 'text-income' : 'text-expense')}>
                {formatCurrency(totals.realFlow)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ingreso {formatCurrency(totals.income)} − Gasto {formatCurrency(totals.spent)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Presupuesto total</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(totals.budgeted)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Suma de presupuestos del mes</p>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobertura del presupuesto</p>
                <p className="mt-1 text-3xl font-bold">{Math.max(totals.coveragePct, 0).toFixed(0)}%</p>
                <p className={cn('mt-1 text-sm font-medium', statusUi.messageClass)}>{statusUi.message}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cobertura (flujo / presupuesto)</span>
              <span className="font-medium">
                {formatCurrency(totals.realFlow)} / {formatCurrency(totals.budgeted)}
              </span>
            </div>
            <Progress value={totals.coverageClamped} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Budgets Grid */}
      {budgets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const isOverBudget = budget.spent > budget.limitAmount
            const isNearLimit = budget.percentage > 80 && !isOverBudget

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${budget.category?.color || '#64748b'}20` }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: budget.category?.color || '#64748b' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {budget.category?.name || 'Sin categoría'}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'mt-1 font-normal',
                          isOverBudget
                            ? 'bg-expense/10 text-expense'
                            : isNearLimit
                              ? 'bg-warning/10 text-warning'
                              : 'bg-income/10 text-income'
                        )}
                      >
                        {budget.percentage.toFixed(0)}% usado
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingBudget(budget)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingId(budget.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className={cn('text-2xl font-bold', isOverBudget ? 'text-expense' : 'text-foreground')}>
                      {formatCurrency(budget.spent)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {formatCurrency(budget.limitAmount)}</span>
                  </div>
                  <Progress
                    value={Math.min(budget.percentage, 100)}
                    className={cn(
                      'mt-3 h-2',
                      isOverBudget && '[&>div]:bg-expense',
                      isNearLimit && '[&>div]:bg-warning'
                    )}
                  />
                  {isOverBudget && (
                    <p className="mt-2 text-sm text-expense">
                      Excedido por {formatCurrency(budget.spent - budget.limitAmount)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title="Sin presupuestos"
          description="Crea presupuestos mensuales para controlar mejor tus gastos por categoría."
          action={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Presupuesto
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen || !!editingBudget}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
            setEditingBudget(null)
            setFormData(defaultFormData)
            setErrors({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
              >
                <SelectTrigger className={cn(errors.categoryId && 'border-destructive')}>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
              {availableCategories.length === 0 && !editingBudget && (
                <p className="text-sm text-muted-foreground">
                  Todas las categorías de gasto ya tienen un presupuesto para este mes.
                </p>
              )}
            </div>

            {/* Limit Amount */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="limitAmount">Límite Mensual</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="limitAmount"
                  type="number"
                  value={formData.limitAmount || ''}
                  onChange={(e) => setFormData({ ...formData, limitAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className={cn('pl-8', errors.limitAmount && 'border-destructive')}
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.limitAmount && <p className="text-sm text-destructive">{errors.limitAmount}</p>}
            </div>

            {/* Month Display */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Mes del presupuesto</p>
              <p className="font-medium capitalize">{formatMonthDisplay(currentMonth)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingBudget(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={availableCategories.length === 0 && !editingBudget}>
                {editingBudget ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
