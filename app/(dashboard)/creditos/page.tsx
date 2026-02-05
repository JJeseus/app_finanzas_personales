// app/(dashboard)/creditos/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  creditService,
  creditPaymentService,
  accountService,
  formatCurrency,
  formatDate,
} from '@/lib/data-service'
import type { Account, Credit, CreditPayment, PaymentFrequency, CreditStatus, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Banknote,
  CalendarCheck,
} from 'lucide-react'

// ⚠️ Debe existir en tu tabla categories (FK).
// Cambia esto por el ID REAL (ej: "cat_credit_payment" o el que uses en DB).
const CATEGORY_ID_PAGO_CREDITO = 'PAGO_CREDITO'

const frequencyLabels: Record<PaymentFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const statusLabels: Record<CreditStatus, string> = {
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const statusColors: Record<CreditStatus, string> = {
  active: 'bg-chart-2/20 text-chart-2',
  paid: 'bg-income/20 text-income',
  overdue: 'bg-expense/20 text-expense',
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

export default function CreditosPage() {
  const { toast } = useToast()

  const [credits, setCredits] = useState<Credit[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<CreditPayment[]>([])

  // Guardamos solo el id, para evitar tener un objeto "viejo" cuando recargues data
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null)
  const selectedCredit = useMemo(
    () => credits.find((c) => c.id === selectedCreditId) ?? null,
    [credits, selectedCreditId]
  )

  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null)

  // ====== MODAL DE PAGO ======
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [payingPayment, setPayingPayment] = useState<CreditPayment | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [payForm, setPayForm] = useState<{
    paidDate: string
    method: PaymentMethod
    accountId: string
    amount: string
    notes: string
  }>({
    paidDate: new Date().toISOString().slice(0, 10),
    method: 'efectivo',
    accountId: '',
    amount: '',
    notes: '',
  })

  const openPayModal = async (payment: CreditPayment) => {
    setPayingPayment(payment)
    setIsPayOpen(true)

    // set defaults
    setPayForm((prev) => ({
      ...prev,
      paidDate: new Date().toISOString().slice(0, 10),
      amount: String(payment.amount ?? ''),
      notes: payment.notes ?? '',
    }))

    // ensure accounts loaded
    try {
      const a = await accountService.getAll()
      const safe = Array.isArray(a) ? a : []
      setAccounts(safe)

      setPayForm((prev) => ({
        ...prev,
        accountId: prev.accountId || safe[0]?.id || '',
      }))
    } catch (e: any) {
      setAccounts([])
      toast({
        title: 'Aviso',
        description: e?.message ?? 'No se pudieron cargar las cuentas.',
        variant: 'destructive',
      })
    }
  }

  const closePayModal = () => {
    setIsPayOpen(false)
    setPayingPayment(null)
  }

  // ====== FORM DE CRÉDITO ======
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    nextPaymentDate: '',
    frequency: 'monthly' as PaymentFrequency,
    status: 'active' as CreditStatus,
    notes: '',
  })

  const loadData = async () => {
    try {
      const [allCredits, allPayments] = await Promise.all([creditService.getAll(), creditPaymentService.getAll()])

      const safeCredits = Array.isArray(allCredits) ? allCredits : []
      const safePayments = Array.isArray(allPayments) ? allPayments : []

      setCredits(safeCredits)

      const now = new Date()
      const limit = new Date()
      limit.setDate(limit.getDate() + 60)

      const upcoming = safePayments
        .filter((p: any) => {
          const d = new Date(p.date ?? p.dueDate ?? p.paymentDate ?? '')
          return Number.isFinite(d.getTime()) && d >= now && d <= limit
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.date ?? a.dueDate).getTime() - new Date(b.date ?? b.dueDate).getTime()
        )

      setUpcomingPayments(upcoming)
    } catch (e: any) {
      setCredits([])
      setUpcomingPayments([])
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudieron cargar los créditos.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Cargar pagos del crédito seleccionado
  useEffect(() => {
    const run = async () => {
      if (!selectedCreditId) {
        setCreditPayments([])
        return
      }

      try {
        const svcAny: any = creditPaymentService as any
        const payments: CreditPayment[] =
          typeof svcAny.getByCreditId === 'function'
            ? await svcAny.getByCreditId(selectedCreditId)
            : (await creditPaymentService.getAll()).filter((p) => p.creditId === selectedCreditId)

        setCreditPayments(Array.isArray(payments) ? payments : [])
      } catch (e: any) {
        setCreditPayments([])
        toast({
          title: 'Error',
          description: e?.message ?? 'No se pudieron cargar los pagos del crédito.',
          variant: 'destructive',
        })
      }
    }
    void run()
  }, [selectedCreditId, toast])

  const resetForm = () => {
    setFormData({
      name: '',
      totalAmount: '',
      remainingAmount: '',
      interestRate: '',
      monthlyPayment: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      nextPaymentDate: '',
      frequency: 'monthly',
      status: 'active',
      notes: '',
    })
    setEditingCredit(null)
  }

  const handleOpenForm = (credit?: Credit) => {
    if (credit) {
      setEditingCredit(credit)
      setFormData({
        name: credit.name,
        totalAmount: String(credit.totalAmount ?? ''),
        remainingAmount: String(credit.remainingAmount ?? ''),
        interestRate: String(credit.interestRate ?? ''),
        monthlyPayment: String(credit.monthlyPayment ?? ''),
        startDate: (credit.startDate ?? '').slice(0, 10),
        endDate: (credit.endDate ?? '').slice(0, 10),
        nextPaymentDate: (credit.nextPaymentDate ?? '').slice(0, 10),
        frequency: credit.frequency,
        status: credit.status,
        notes: credit.notes ?? '',
      })
    } else {
      resetForm()
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const totalAmount = parseFloat(formData.totalAmount)
      const remainingAmount = parseFloat(formData.remainingAmount || formData.totalAmount)
      const interestRate = parseFloat(formData.interestRate)
      const monthlyPayment = parseFloat(formData.monthlyPayment)

      if (!formData.name.trim()) {
        toast({ title: 'Error', description: 'Nombre requerido', variant: 'destructive' })
        return
      }
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        toast({ title: 'Error', description: 'Monto total inválido', variant: 'destructive' })
        return
      }
      if (!Number.isFinite(remainingAmount) || remainingAmount < 0) {
        toast({ title: 'Error', description: 'Saldo inválido', variant: 'destructive' })
        return
      }
      if (!Number.isFinite(interestRate) || interestRate < 0) {
        toast({ title: 'Error', description: 'Tasa inválida', variant: 'destructive' })
        return
      }
      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        toast({ title: 'Error', description: 'Pago mensual inválido', variant: 'destructive' })
        return
      }

      const creditData = {
        name: formData.name.trim(),
        totalAmount,
        remainingAmount,
        interestRate,
        monthlyPayment,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        nextPaymentDate: new Date(formData.nextPaymentDate).toISOString(),
        frequency: formData.frequency,
        status: formData.status,
        notes: formData.notes ?? '',
      }

      if (editingCredit) {
        await creditService.update(editingCredit.id, creditData as any)
        toast({ title: 'Crédito actualizado', description: `"${creditData.name}" ha sido actualizado.` })
      } else {
        await creditService.create(creditData as any)
        toast({ title: 'Crédito agregado', description: `"${creditData.name}" ha sido creado.` })
      }

      setIsFormOpen(false)
      resetForm()
      await loadData()
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo guardar el crédito.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!editingCredit) return
    try {
      await creditService.delete(editingCredit.id)
      toast({ title: 'Crédito eliminado', description: `"${editingCredit.name}" ha sido eliminado.` })
      setIsDeleteOpen(false)
      if (selectedCreditId === editingCredit.id) setSelectedCreditId(null)
      setEditingCredit(null)
      await loadData()
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo eliminar el crédito.',
        variant: 'destructive',
      })
    }
  }

  // ====== CONFIRMAR PAGO DESDE MODAL (FIX: ahora crea movimiento en transactions) ======
  const handleConfirmPay = async () => {
    if (!payingPayment) return

    const amount = Number(payForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Monto inválido', variant: 'destructive' })
      return
    }
    if (!payForm.paidDate) {
      toast({ title: 'Error', description: 'Fecha requerida', variant: 'destructive' })
      return
    }
    if (!payForm.accountId) {
      toast({ title: 'Error', description: 'Cuenta requerida', variant: 'destructive' })
      return
    }

    try {
      const methodInfo = `Método: ${paymentMethodLabels[payForm.method]}`
      const accountInfo = payForm.accountId ? `Cuenta: ${payForm.accountId}` : ''
      const extraNotes = [payForm.notes?.trim(), methodInfo, accountInfo].filter(Boolean).join(' | ')

      // ✅ Llamar al endpoint que inserta:
      // - credit_payments (paid)
      // - transactions (expense)
      // - update credits (remaining_amount, next_payment_date, status)
      const res = await fetch('/api/credit-payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        paymentId: payingPayment.id,       // ✅ ESTE ES EL UPDATE REAL
        creditId: payingPayment.creditId,  // opcional (validación extra)
        amount,
        date: payForm.paidDate,
        notes: extraNotes,
        accountId: payForm.accountId,
        categoryId: "cat-0",
        method: payForm.method,
        currency: 'MXN',
        tags: [],
      }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo registrar el pago.')

      toast({
        title: 'Pago registrado',
        description: data?.transactionId ? `Movimiento: ${data.transactionId}` : 'El pago fue registrado.',
      })

      closePayModal()
      await loadData()

      // refrescar pagos del crédito seleccionado
      if (selectedCreditId) {
        const svcAny: any = creditPaymentService as any
        const payments: CreditPayment[] =
          typeof svcAny.getByCreditId === 'function'
            ? await svcAny.getByCreditId(selectedCreditId)
            : (await creditPaymentService.getAll()).filter((p) => p.creditId === selectedCreditId)
        setCreditPayments(Array.isArray(payments) ? payments : [])
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo registrar el pago.',
        variant: 'destructive',
      })
    }
  }

  const totalDebt = useMemo(
    () => credits.filter((c) => c.status === 'active').reduce((sum, c) => sum + Number(c.remainingAmount ?? 0), 0),
    [credits]
  )

  const totalMonthlyPayment = useMemo(
    () => credits.filter((c) => c.status === 'active').reduce((sum, c) => sum + Number(c.monthlyPayment ?? 0), 0),
    [credits]
  )

  const activeCredits = useMemo(() => credits.filter((c) => c.status === 'active').length, [credits])

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créditos y Deudas</h1>
          <p className="text-muted-foreground">Administra tus préstamos, créditos y programa de pagos</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Crédito
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deuda Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-expense">{formatCurrency(totalDebt)}</div>
            <p className="text-xs text-muted-foreground">{activeCredits} créditos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pago Mensual</CardTitle>
            <Banknote className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</div>
            <p className="text-xs text-muted-foreground">Compromiso mensual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {upcomingPayments.length > 0 ? (
              <>
                <div className="text-lg sm:text-2xl font-bold">{formatCurrency(upcomingPayments[0].amount)}</div>
                <p className="text-xs text-muted-foreground truncate">{formatDate(upcomingPayments[0].date)}</p>
              </>
            ) : (
              <>
                <div className="text-lg sm:text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Sin pagos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pagos Próximos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground">En 60 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="credits" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="credits" className="text-xs sm:text-sm">
            Mis Créditos
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">
            Programación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Credits List */}
            <div className="flex flex-col gap-4">
              {credits.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Sin créditos registrados</h3>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Agrega tus préstamos y créditos para llevar un control de tus deudas.
                    </p>
                    <Button onClick={() => handleOpenForm()} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar Crédito
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                credits.map((credit) => {
                  const progress =
                    credit.totalAmount > 0
                      ? ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100
                      : 0

                  return (
                    <Card
                      key={credit.id}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/50',
                        selectedCreditId === credit.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedCreditId(credit.id)}
                    >
                      <CardHeader className="flex flex-row items-start justify-between p-3 sm:p-4 pb-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-base truncate">{credit.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            {frequencyLabels[credit.frequency]}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <Badge className={cn(statusColors[credit.status], 'text-xs')}>
                            {statusLabels[credit.status]}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenForm(credit)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingCredit(credit)
                                  setIsDeleteOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-lg sm:text-2xl font-bold">
                            {formatCurrency(credit.remainingAmount)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            de {formatCurrency(credit.totalAmount)}
                          </span>
                        </div>
                        <Progress value={progress} className="mt-2 sm:mt-3 h-2" />
                        <div className="mt-2 sm:mt-3 flex flex-wrap justify-between gap-1 text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Pago: {formatCurrency(credit.monthlyPayment)}
                          </span>
                          <span className="text-muted-foreground">{credit.interestRate}% interés</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            {/* Credit Details */}
            <Card>
              {selectedCredit ? (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {selectedCredit.name}
                    </CardTitle>
                    <CardDescription>Historial y próximos pagos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Original</p>
                        <p className="font-semibold">{formatCurrency(selectedCredit.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Actual</p>
                        <p className="font-semibold text-expense">{formatCurrency(selectedCredit.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                        <p className="font-semibold">{formatDate(selectedCredit.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha Fin</p>
                        <p className="font-semibold">{formatDate(selectedCredit.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Próximo Pago</p>
                        <p className="font-semibold">{formatDate(selectedCredit.nextPaymentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                        <p className="font-semibold">{selectedCredit.interestRate}% anual</p>
                      </div>
                    </div>

                    {selectedCredit.notes && (
                      <div className="mb-6 rounded-lg bg-muted p-3">
                        <p className="text-sm">{selectedCredit.notes}</p>
                      </div>
                    )}

                    <h4 className="mb-3 font-semibold">Historial de Pagos</h4>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>
                                {payment.status === 'paid' ? (
                                  <Badge className="bg-income/20 text-income">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Pagado
                                  </Badge>
                                ) : payment.status === 'pending' ? (
                                  <Badge className="bg-warning/20 text-warning">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Pendiente
                                  </Badge>
                                ) : (
                                  <Badge className="bg-expense/20 text-expense">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Vencido
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {payment.status === 'pending' && (
                                  <Button variant="ghost" size="sm" onClick={() => void openPayModal(payment)}>
                                    Pagar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-center text-muted-foreground">Selecciona un crédito para ver sus detalles</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Programación de Pagos</CardTitle>
              <CardDescription>Próximos pagos en los siguientes 60 días</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin pagos programados</h3>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    No tienes pagos pendientes en los próximos 60 días.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Crédito</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-20">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPayments.map((payment) => {
                      const credit = credits.find((c) => c.id === payment.creditId)

                      const daysUntil = Math.ceil(
                        (new Date(payment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatDate(payment.date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{credit?.name || 'Desconocido'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            {daysUntil <= 3 ? (
                              <Badge className="bg-warning/20 text-warning">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Próximo
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />
                                Programado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.status === 'pending' ? (
                              <Button size="sm" onClick={() => void openPayModal(payment)}>
                                Pagar
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                {payment.status === 'paid' ? 'Pagado' : 'Vencido'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCredit ? 'Editar Crédito' : 'Agregar Crédito'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre del Crédito</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Crédito Automotriz"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="totalAmount">Monto Total</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="remainingAmount">Saldo Actual</Label>
                <Input
                  id="remainingAmount"
                  type="number"
                  value={formData.remainingAmount}
                  onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="monthlyPayment">Pago Mensual</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="interestRate">Tasa de Interés (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nextPaymentDate">Próximo Pago</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={formData.nextPaymentDate}
                  onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Frecuencia</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({ ...formData, frequency: v as PaymentFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as CreditStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingCredit ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar crédito?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente &quot;{editingCredit?.name}&quot; y todo su historial de pagos. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====== Pay Dialog ====== */}
      <Dialog
        open={isPayOpen}
        onOpenChange={(open) => {
          if (!open) closePayModal()
          else setIsPayOpen(true)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>

          {!payingPayment ? (
            <p className="text-sm text-muted-foreground">No hay pago seleccionado.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3">
                <div className="text-sm text-muted-foreground">Pago programado</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-lg font-semibold">{formatCurrency(payingPayment.amount)}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(payingPayment.date)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payAmount">Monto a pagar</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="paidDate">Fecha de pago</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    value={payForm.paidDate}
                    onChange={(e) => setPayForm((p) => ({ ...p, paidDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Método</Label>
                  <Select
                    value={payForm.method}
                    onValueChange={(v) => setPayForm((p) => ({ ...p, method: v as PaymentMethod }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Cuenta</Label>
                  <Select value={payForm.accountId} onValueChange={(v) => setPayForm((p) => ({ ...p, accountId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={accounts.length ? 'Selecciona cuenta' : 'Sin cuentas'} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payNotes">Notas</Label>
                <Textarea
                  id="payNotes"
                  value={payForm.notes}
                  onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Referencia / comentario…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={closePayModal}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => void handleConfirmPay()}>
                  Confirmar pago
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Nota: este pago genera un movimiento en <span className="font-medium">transactions</span>. Si falla con
                <span className="font-medium"> categoryId</span>, asegúrate de que{' '}
                <span className="font-medium">{CATEGORY_ID_PAGO_CREDITO}</span> exista en tu tabla{' '}
                <span className="font-medium">categories</span>.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
