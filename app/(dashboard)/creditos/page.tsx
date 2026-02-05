'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { creditService, creditPaymentService, formatCurrency, formatDate } from '@/lib/data-service'
import type { Credit, CreditPayment, PaymentFrequency, CreditStatus } from '@/lib/types'
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

export default function CreditosPage() {
  const { toast } = useToast()
  const [credits, setCredits] = useState<Credit[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<CreditPayment[]>([])
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null)
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

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCredit) {
      const payments = creditPaymentService.getByCreditId(selectedCredit.id)
      setCreditPayments(payments)
    }
  }, [selectedCredit])

  const loadData = () => {
    setCredits(creditService.getAll())
    setUpcomingPayments(creditPaymentService.getUpcoming(60))
  }

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
        totalAmount: credit.totalAmount.toString(),
        remainingAmount: credit.remainingAmount.toString(),
        interestRate: credit.interestRate.toString(),
        monthlyPayment: credit.monthlyPayment.toString(),
        startDate: credit.startDate.slice(0, 10),
        endDate: credit.endDate.slice(0, 10),
        nextPaymentDate: credit.nextPaymentDate.slice(0, 10),
        frequency: credit.frequency,
        status: credit.status,
        notes: credit.notes,
      })
    } else {
      resetForm()
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const creditData = {
      name: formData.name,
      totalAmount: parseFloat(formData.totalAmount),
      remainingAmount: parseFloat(formData.remainingAmount || formData.totalAmount),
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      nextPaymentDate: new Date(formData.nextPaymentDate).toISOString(),
      frequency: formData.frequency,
      status: formData.status,
      notes: formData.notes,
    }

    if (editingCredit) {
      creditService.update(editingCredit.id, creditData)
      toast({
        title: 'Crédito actualizado',
        description: `"${formData.name}" ha sido actualizado.`,
      })
    } else {
      creditService.create(creditData)
      toast({
        title: 'Crédito agregado',
        description: `"${formData.name}" ha sido creado.`,
      })
    }

    setIsFormOpen(false)
    resetForm()
    loadData()
  }

  const handleDelete = () => {
    if (editingCredit) {
      creditService.delete(editingCredit.id)
      toast({
        title: 'Crédito eliminado',
        description: `"${editingCredit.name}" ha sido eliminado.`,
      })
      setIsDeleteOpen(false)
      setEditingCredit(null)
      if (selectedCredit?.id === editingCredit.id) {
        setSelectedCredit(null)
      }
      loadData()
    }
  }

  const handleMarkPaymentAsPaid = (paymentId: string) => {
    creditPaymentService.markAsPaid(paymentId)
    toast({
      title: 'Pago registrado',
      description: 'El pago ha sido marcado como realizado.',
    })
    loadData()
    if (selectedCredit) {
      setSelectedCredit(creditService.getById(selectedCredit.id) || null)
      setCreditPayments(creditPaymentService.getByCreditId(selectedCredit.id))
    }
  }

  const totalDebt = creditService.getTotalDebt()
  const totalMonthlyPayment = creditService.getTotalMonthlyPayment()
  const activeCredits = credits.filter(c => c.status === 'active').length

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créditos y Deudas</h1>
          <p className="text-muted-foreground">
            Administra tus préstamos, créditos y programa de pagos
          </p>
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
            <p className="text-xs text-muted-foreground">
              {activeCredits} créditos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pago Mensual</CardTitle>
            <Banknote className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</div>
            <p className="text-xs text-muted-foreground">
              Compromiso mensual
            </p>
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
                <p className="text-xs text-muted-foreground truncate">
                  {formatDate(upcomingPayments[0].date)}
                </p>
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
            <p className="text-xs text-muted-foreground">
              En 60 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="credits" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="credits" className="text-xs sm:text-sm">Mis Créditos</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">Programación</TabsTrigger>
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
                  const progress = ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100
                  return (
                    <Card
                      key={credit.id}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/50',
                        selectedCredit?.id === credit.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedCredit(credit)}
                    >
                      <CardHeader className="flex flex-row items-start justify-between p-3 sm:p-4 pb-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-base truncate">{credit.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{frequencyLabels[credit.frequency]}</CardDescription>
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
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleOpenForm(credit)
                              }}>
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
                          <span className="text-lg sm:text-2xl font-bold">{formatCurrency(credit.remainingAmount)}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            de {formatCurrency(credit.totalAmount)}
                          </span>
                        </div>
                        <Progress value={progress} className="mt-2 sm:mt-3 h-2" />
                        <div className="mt-2 sm:mt-3 flex flex-wrap justify-between gap-1 text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Pago: {formatCurrency(credit.monthlyPayment)}
                          </span>
                          <span className="text-muted-foreground">
                            {credit.interestRate}% interés
                          </span>
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
                    <CardDescription>
                      Historial y próximos pagos
                    </CardDescription>
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkPaymentAsPaid(payment.id)}
                                  >
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
                  <p className="mt-4 text-center text-muted-foreground">
                    Selecciona un crédito para ver sus detalles
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Programación de Pagos</CardTitle>
              <CardDescription>
                Próximos pagos en los siguientes 60 días
              </CardDescription>
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
                      const credit = creditService.getById(payment.creditId)
                      const daysUntil = Math.ceil(
                        (new Date(payment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      )
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatDate(payment.date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysUntil === 0
                                  ? 'Hoy'
                                  : daysUntil === 1
                                  ? 'Mañana'
                                  : `En ${daysUntil} días`}
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
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaymentAsPaid(payment.id)}
                            >
                              Pagar
                            </Button>
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
            <DialogTitle>
              {editingCredit ? 'Editar Crédito' : 'Agregar Crédito'}
            </DialogTitle>
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
              Esta acción eliminará permanentemente &quot;{editingCredit?.name}&quot; y todo su historial de pagos. Esta acción no se puede deshacer.
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
