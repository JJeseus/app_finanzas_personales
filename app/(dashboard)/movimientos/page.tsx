'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { FiltersBar } from '@/components/filters-bar'
import { TransactionFormModal } from '@/components/transaction-form-modal'
import { FloatingActionButton } from '@/components/floating-action-button'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import {
  transactionService,
  categoryService,
  accountService,
  formatCurrency,
  formatDate,
} from '@/lib/data-service'
import type { Transaction, Category, Account, TransactionFilters } from '@/lib/types'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const methodLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

export default function MovimientosPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

const loadData = async () => {
  const [cats, accs] = await Promise.all([
    categoryService.getAll(),
    accountService.getAll(),
  ])
  setCategories(cats)
  setAccounts(accs)
}

const loadTransactions = async () => {
  const all = await transactionService.getAll()
  const filtered = transactionService.filterLocal(all, filters)
  setTransactions(filtered)
}

useEffect(() => {
  void loadData()
}, [])

useEffect(() => {
  void loadTransactions()
}, [filters])

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoría'
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#64748b'
  }

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || 'Sin cuenta'
  }

const handleCreate = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
  try {
    await transactionService.create(data)
    await loadTransactions()
    toast({
      title: 'Movimiento creado',
      description: 'El movimiento se ha registrado correctamente.',
    })
  } catch (e: any) {
    toast({
      title: 'Error al crear movimiento',
      description: e?.message ?? 'No se pudo guardar el movimiento.',
      variant: 'destructive',
    })
  }
}


const handleUpdate = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
  if (!editingTransaction) return
  try {
    await transactionService.update(editingTransaction.id, data)
    await loadTransactions()
    setEditingTransaction(null)
    toast({
      title: 'Movimiento actualizado',
      description: 'El movimiento se ha actualizado correctamente.',
    })
  } catch (e: any) {
    toast({
      title: 'Error al actualizar movimiento',
      description: e?.message ?? 'No se pudo actualizar el movimiento.',
      variant: 'destructive',
    })
  }
}


const handleDuplicate = async (transaction: Transaction) => {
  try {
    const { id, createdAt, ...rest } = transaction
    await transactionService.create({
      ...rest,
      date: new Date().toISOString().slice(0, 10), // importante: tu BD usa DATE
    })
    await loadTransactions()
    toast({
      title: 'Movimiento duplicado',
      description: 'Se ha creado una copia del movimiento.',
    })
  } catch (e: any) {
    toast({
      title: 'Error al duplicar movimiento',
      description: e?.message ?? 'No se pudo duplicar el movimiento.',
      variant: 'destructive',
    })
  }
}


const handleDelete = async () => {
  if (!deletingId) return
  try {
    await transactionService.delete(deletingId)
    await loadTransactions()
    setDeletingId(null)
    toast({
      title: 'Movimiento eliminado',
      description: 'El movimiento se ha eliminado correctamente.',
    })
  } catch (e: any) {
    toast({
      title: 'Error al eliminar movimiento',
      description: e?.message ?? 'No se pudo eliminar el movimiento.',
      variant: 'destructive',
    })
  }
}


  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus ingresos y gastos
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Movimiento
        </Button>
      </div>

      {/* Filters */}
      <FiltersBar filters={filters} onChange={setFilters} />

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            Lista de Movimientos
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {transactions.length} movimientos
          </Badge>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {transactions.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="flex flex-col gap-3 sm:hidden">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                          transaction.type === 'income'
                            ? 'bg-income/10 text-income'
                            : 'bg-expense/10 text-expense'
                        )}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {transaction.description || getCategoryName(transaction.categoryId)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(transaction.date)}</span>
                          <span>·</span>
                          <span className="truncate">{getCategoryName(transaction.categoryId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'font-semibold text-sm',
                          transaction.type === 'income' ? 'text-income' : 'text-expense'
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(transaction)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(transaction.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              transaction.type === 'income'
                                ? 'bg-income/10 text-income'
                                : 'bg-expense/10 text-expense'
                            )}
                          >
                            {transaction.type === 'income' ? (
                              <ArrowUpCircle className="h-4 w-4" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.description || getCategoryName(transaction.categoryId)}
                            </p>
                            {transaction.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {transaction.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {transaction.tags.length > 2 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    +{transaction.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                            />
                            <span className="whitespace-nowrap">
                              {getCategoryName(transaction.categoryId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getAccountName(transaction.accountId)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {methodLabels[transaction.method]}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                            className={cn(
                              'font-normal',
                              transaction.status === 'confirmed'
                                ? 'bg-income/10 text-income hover:bg-income/20'
                                : 'bg-warning/10 text-warning hover:bg-warning/20'
                            )}
                          >
                            {transaction.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-semibold',
                              transaction.type === 'income' ? 'text-income' : 'text-expense'
                            )}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingTransaction(transaction)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(transaction)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingId(transaction.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState
              icon={ArrowLeftRight}
              title="Sin movimientos"
              description="No se encontraron movimientos con los filtros seleccionados. Intenta con otros filtros o agrega un nuevo movimiento."
              action={
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Movimiento
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />

      {/* Create Modal */}
      <TransactionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      <TransactionFormModal
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSubmit={handleUpdate}
        initialData={editingTransaction || undefined}
        mode="edit"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento será eliminado permanentemente.
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
