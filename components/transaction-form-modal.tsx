'use client'

import React from 'react'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  Transaction,
  Category,
  Account,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from '@/lib/types'
import { categoryService, accountService } from '@/lib/data-service'

interface TransactionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  initialData?: Transaction
  mode?: 'create' | 'edit'
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
]

export function TransactionFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: TransactionFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('tarjeta')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<TransactionStatus>('confirmed')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ✅ FIX: cargar data con await (antes se guardaban Promises en state)
  useEffect(() => {
    let alive = true

    ;(async () => {
      const [cats, accs] = await Promise.all([
        categoryService.getAll(),
        accountService.getAll(),
      ])

      if (!alive) return
      setCategories(Array.isArray(cats) ? cats : [])
      setAccounts(Array.isArray(accs) ? accs : [])
    })().catch(() => {
      if (!alive) return
      setCategories([])
      setAccounts([])
    })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setType(initialData.type)
      setAmount(initialData.amount.toString())
      setDate((initialData.date || '').slice(0, 10))
      setCategoryId(initialData.categoryId)
      setAccountId(initialData.accountId)
      setMethod(initialData.method)
      setDescription(initialData.description)
      setTags(initialData.tags || [])
      setStatus(initialData.status)
      setErrors({})
    } else if (open && mode === 'create') {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, mode, open])

  const resetForm = () => {
    setType('expense')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setCategoryId('')
    setAccountId('')
    setMethod('tarjeta')
    setDescription('')
    setTagInput('')
    setTags([])
    setStatus('confirmed')
    setErrors({})
  }

  // ✅ defensivo
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  const filteredCategories = safeCategories.filter(
    (c) => c.type === type || c.type === 'both'
  )

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'El monto debe ser mayor a 0'
    if (!date) newErrors.date = 'Selecciona una fecha'
    if (!categoryId) newErrors.categoryId = 'Selecciona una categoría'
    if (!accountId) newErrors.accountId = 'Selecciona una cuenta'
    if (!description.trim()) newErrors.description = 'Agrega una descripción'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      // ✅ FIX: tu BD usa DATE → manda YYYY-MM-DD (no ISO completo)
      date,
      type,
      amount: parseFloat(amount),
      currency: 'MXN',
      categoryId,
      accountId,
      method,
      description,
      tags,
      status,
    })

    onOpenChange(false)
    resetForm()
  }

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'create' ? 'Agregar Movimiento' : 'Editar Movimiento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn('flex-1', type === 'expense' && 'bg-expense text-white hover:bg-expense/90')}
              onClick={() => {
                setType('expense')
                setCategoryId('')
              }}
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn('flex-1', type === 'income' && 'bg-income text-primary-foreground hover:bg-income/90')}
              onClick={() => {
                setType('income')
                setCategoryId('')
              }}
            >
              Ingreso
            </Button>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount" className="text-sm">Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={cn('pl-8 sm:pl-10 text-2xl sm:text-3xl font-bold h-14 sm:h-16', errors.amount && 'border-destructive')}
                step="0.01"
                min="0"
              />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(errors.date && 'border-destructive')}
              required
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label>Categoría *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className={cn(errors.categoryId && 'border-destructive')}>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
          </div>

          {/* Account and Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-2">
              <Label>Cuenta *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className={cn(errors.accountId && 'border-destructive')}>
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {safeAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-sm text-destructive">{errors.accountId}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del movimiento..."
              rows={2}
              className={cn(errors.description && 'border-destructive')}
              required
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label>Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Agregar etiqueta..."
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="status" className="cursor-pointer">
                Confirmado
              </Label>
              <p className="text-sm text-muted-foreground">
                {status === 'confirmed' ? 'El movimiento está confirmado' : 'Movimiento pendiente'}
              </p>
            </div>
            <Switch
              id="status"
              checked={status === 'confirmed'}
              onCheckedChange={(checked) => setStatus(checked ? 'confirmed' : 'pending')}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {mode === 'create' ? 'Guardar' : 'Actualizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
