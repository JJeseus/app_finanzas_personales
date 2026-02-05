'use client'

import React from "react"

import { useEffect, useState } from 'react'
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

export default function PresupuestosPage() {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [budgets, setBudgets] = useState<BudgetWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = () => {
    const cats = categoryService.getAll().filter((c) => c.type === 'expense' || c.type === 'both')
    setCategories(cats)
    
    const monthBudgets = budgetService.getByMonth(currentMonth)
    const budgetsWithDetails: BudgetWithDetails[] = monthBudgets.map((budget) => {
      const category = cats.find((c) => c.id === budget.categoryId)
      const spent = budgetService.getSpentAmount(budget.categoryId, currentMonth)
      const percentage = budget.limitAmount > 0 ? Math.min((spent / budget.limitAmount) * 100, 100) : 0
      
      return {
        ...budget,
        category,
        spent,
        percentage,
      }
    })
    
    setBudgets(budgetsWithDetails)
  }

  useEffect(() => {
    loadData()
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
    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecciona una categoría'
    }
    if (formData.limitAmount <= 0) {
      newErrors.limitAmount = 'El límite debe ser mayor a 0'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (editingBudget) {
      budgetService.update(editingBudget.id, {
        ...formData,
        month: currentMonth,
      })
      toast({
        title: 'Presupuesto actualizado',
        description: 'El presupuesto se ha actualizado correctamente.',
      })
    } else {
      budgetService.create({
        ...formData,
        month: currentMonth,
      })
      toast({
        title: 'Presupuesto creado',
        description: 'El presupuesto se ha creado correctamente.',
      })
    }

    loadData()
    setIsModalOpen(false)
    setEditingBudget(null)
    setFormData(defaultFormData)
  }

  const handleDelete = () => {
    if (!deletingId) return
    budgetService.delete(deletingId)
    loadData()
    setDeletingId(null)
    toast({
      title: 'Presupuesto eliminado',
      description: 'El presupuesto se ha eliminado correctamente.',
    })
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

  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

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
          <p className="text-muted-foreground">
            Controla tus gastos mensuales por categoría
          </p>
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

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Resumen del Mes</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={cn(
                  'text-3xl font-bold',
                  totalPercentage > 100 ? 'text-expense' : 'text-foreground'
                )}>
                  {formatCurrency(totalSpent)}
                </span>
                <span className="text-muted-foreground">
                  de {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="mt-3">
                <Progress
                  value={Math.min(totalPercentage, 100)}
                  className={cn(
                    'h-2',
                    totalPercentage > 100 && '[&>div]:bg-expense',
                    totalPercentage > 80 && totalPercentage <= 100 && '[&>div]:bg-warning'
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalPercentage > 100 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-expense" />
                  <span className="text-sm font-medium text-expense">
                    Excedido por {formatCurrency(totalSpent - totalBudget)}
                  </span>
                </>
              ) : totalPercentage > 80 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    {(100 - totalPercentage).toFixed(0)}% restante
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-income" />
                  <span className="text-sm font-medium text-income">
                    {(100 - totalPercentage).toFixed(0)}% restante
                  </span>
                </>
              )}
            </div>
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
                    <span className={cn(
                      'text-2xl font-bold',
                      isOverBudget ? 'text-expense' : 'text-foreground'
                    )}>
                      {formatCurrency(budget.spent)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {formatCurrency(budget.limitAmount)}
                    </span>
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
            <DialogTitle>
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </DialogTitle>
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
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="limitAmount"
                  type="number"
                  value={formData.limitAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, limitAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className={cn('pl-8', errors.limitAmount && 'border-destructive')}
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.limitAmount && (
                <p className="text-sm text-destructive">{errors.limitAmount}</p>
              )}
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
