'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { categoryService } from '@/lib/data-service'
import type { Category, CategoryType } from '@/lib/types'
import { Plus, MoreHorizontal, Pencil, Trash2, Tags, Wallet, ShoppingCart, Car, Film, Zap, Heart, BookOpen, Shirt, Home, TrendingUp, Laptop, MoveIcon as MoreIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconOptions = [
  { value: 'Wallet', label: 'Billetera', icon: Wallet },
  { value: 'ShoppingCart', label: 'Compras', icon: ShoppingCart },
  { value: 'Car', label: 'Auto', icon: Car },
  { value: 'Film', label: 'Entretenimiento', icon: Film },
  { value: 'Zap', label: 'Servicios', icon: Zap },
  { value: 'Heart', label: 'Salud', icon: Heart },
  { value: 'BookOpen', label: 'Educación', icon: BookOpen },
  { value: 'Shirt', label: 'Ropa', icon: Shirt },
  { value: 'Home', label: 'Hogar', icon: Home },
  { value: 'TrendingUp', label: 'Inversiones', icon: TrendingUp },
  { value: 'Laptop', label: 'Tecnología', icon: Laptop },
  { value: 'MoreHorizontal', label: 'Otros', icon: MoreIcon },
]

const colorOptions = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7',
  '#0ea5e9', '#64748b',
]

const typeLabels: Record<CategoryType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  both: 'Ambos',
}

const typeColors: Record<CategoryType, string> = {
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  both: 'bg-chart-2/10 text-chart-2',
}

interface CategoryFormData {
  name: string
  type: CategoryType
  icon: string
  color: string
}

const defaultFormData: CategoryFormData = {
  name: '',
  type: 'expense',
  icon: 'ShoppingCart',
  color: '#10b981',
}

export default function CategoriasPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

const loadCategories = async () => {
  try {
    const data = await categoryService.getAll()
    setCategories(Array.isArray(data) ? data : [])
  } catch (e) {
    console.error('Error loading categories', e)
    setCategories([])
  }
}


useEffect(() => {
  void loadCategories()
}, [])

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        type: editingCategory.type,
        icon: editingCategory.icon,
        color: editingCategory.color,
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [editingCategory])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (editingCategory) {
      categoryService.update(editingCategory.id, formData)
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría se ha actualizado correctamente.',
      })
    } else {
      categoryService.create(formData)
      toast({
        title: 'Categoría creada',
        description: 'La categoría se ha creado correctamente.',
      })
    }

    loadCategories()
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData(defaultFormData)
  }

  const handleDelete = () => {
    if (!deletingId) return
    categoryService.delete(deletingId)
    loadCategories()
    setDeletingId(null)
    toast({
      title: 'Categoría eliminada',
      description: 'La categoría se ha eliminado correctamente.',
    })
  }

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find((i) => i.value === iconName)
    return found?.icon || MoreIcon
  }

  const incomeCategories = categories.filter((c) => c.type === 'income' || c.type === 'both')
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both')

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Organiza tus movimientos por categorías
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-income/10">
                  <TrendingUp className="h-3.5 w-3.5 text-income" />
                </div>
                Categorías de Ingreso
                <Badge variant="secondary" className="ml-auto font-normal">
                  {incomeCategories.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y divide-border">
                {incomeCategories.map((category) => {
                  const Icon = getIconComponent(category.icon)
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs font-normal', typeColors[category.type])}
                          >
                            {typeLabels[category.type]}
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
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(category.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
                {incomeCategories.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay categorías de ingreso
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-expense/10">
                  <ShoppingCart className="h-3.5 w-3.5 text-expense" />
                </div>
                Categorías de Gasto
                <Badge variant="secondary" className="ml-auto font-normal">
                  {expenseCategories.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y divide-border">
                {expenseCategories.map((category) => {
                  const Icon = getIconComponent(category.icon)
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs font-normal', typeColors[category.type])}
                          >
                            {typeLabels[category.type]}
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
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(category.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
                {expenseCategories.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay categorías de gasto
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Tags}
          title="Sin categorías"
          description="Crea categorías para organizar mejor tus ingresos y gastos."
          action={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
            setEditingCategory(null)
            setFormData(defaultFormData)
            setErrors({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as CategoryType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: option.value })}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors',
                      formData.icon === option.value
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    )}
                    title={option.label}
                  >
                    <option.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform',
                      formData.color === color
                        ? 'scale-110 border-foreground'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                {(() => {
                  const Icon = getIconComponent(formData.icon)
                  return <Icon className="h-5 w-5" style={{ color: formData.color }} />
                })()}
              </div>
              <div>
                <p className="font-medium">{formData.name || 'Vista previa'}</p>
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-normal', typeColors[formData.type])}
                >
                  {typeLabels[formData.type]}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingCategory(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los movimientos asociados a esta categoría quedarán sin categoría.
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
