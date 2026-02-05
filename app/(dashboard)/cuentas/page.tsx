'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { accountService, formatCurrency } from '@/lib/data-service'
import type { Account, AccountType } from '@/lib/types'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
  Building,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const accountTypeConfig: Record<AccountType, { label: string; icon: typeof Wallet; color: string }> = {
  cash: { label: 'Efectivo', icon: Wallet, color: 'text-income' },
  bank: { label: 'Banco', icon: Building, color: 'text-chart-2' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'text-chart-4' },
}

interface AccountFormData {
  name: string
  type: AccountType
  initialBalance: number
  notes: string
}

const defaultFormData: AccountFormData = {
  name: '',
  type: 'bank',
  initialBalance: 0,
  notes: '',
}

export default function CuentasPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AccountFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadAccounts = () => {
    const accs = accountService.getAll()
    setAccounts(accs)
    
    // Calculate balances for each account
    const bals: Record<string, number> = {}
    accs.forEach((acc) => {
      bals[acc.id] = accountService.getBalance(acc.id)
    })
    setBalances(bals)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name,
        type: editingAccount.type,
        initialBalance: editingAccount.initialBalance,
        notes: editingAccount.notes,
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [editingAccount])

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

    if (editingAccount) {
      accountService.update(editingAccount.id, formData)
      toast({
        title: 'Cuenta actualizada',
        description: 'La cuenta se ha actualizado correctamente.',
      })
    } else {
      accountService.create(formData)
      toast({
        title: 'Cuenta creada',
        description: 'La cuenta se ha creado correctamente.',
      })
    }

    loadAccounts()
    setIsModalOpen(false)
    setEditingAccount(null)
    setFormData(defaultFormData)
  }

  const handleDelete = () => {
    if (!deletingId) return
    accountService.delete(deletingId)
    loadAccounts()
    setDeletingId(null)
    toast({
      title: 'Cuenta eliminada',
      description: 'La cuenta se ha eliminado correctamente.',
    })
  }

  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0)

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground">
            Administra tus cuentas y tarjetas
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
            <p className={cn(
              'text-4xl font-bold tracking-tight',
              totalBalance >= 0 ? 'text-income' : 'text-expense'
            )}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-sm text-muted-foreground">
              {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'} registradas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const config = accountTypeConfig[account.type]
            const balance = balances[account.id] || 0
            const Icon = config.icon

            return (
              <Card key={account.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg bg-secondary',
                      config.color
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 font-normal">
                        {config.label}
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
                      <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingId(account.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Saldo actual</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      balance >= 0 ? 'text-foreground' : 'text-expense'
                    )}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  {account.notes && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {account.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title="Sin cuentas"
          description="Agrega tus cuentas bancarias, efectivo o tarjetas para llevar un mejor control de tus finanzas."
          action={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen || !!editingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
            setEditingAccount(null)
            setFormData(defaultFormData)
            setErrors({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
                placeholder="Nombre de la cuenta"
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
                onValueChange={(v) => setFormData({ ...formData, type: v as AccountType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial Balance */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="initialBalance">Saldo Inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="initialBalance"
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="pl-8"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El saldo con el que inicia la cuenta
              </p>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre la cuenta..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingAccount(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingAccount ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los movimientos asociados a esta cuenta quedarán sin cuenta.
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
