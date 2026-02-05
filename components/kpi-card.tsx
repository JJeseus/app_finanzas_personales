'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: 'balance' | 'income' | 'expense' | 'savings'
  className?: string
}

const iconMap = {
  balance: Wallet,
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
  savings: PiggyBank,
}

const iconColorMap = {
  balance: 'text-primary',
  income: 'text-income',
  expense: 'text-expense',
  savings: 'text-chart-2',
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon = 'balance',
  className,
}: KPICardProps) {
  const Icon = iconMap[icon]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
            {(subtitle || trendValue) && (
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                {trend && trend !== 'neutral' && (
                  <span
                    className={cn(
                      'flex items-center text-xs sm:text-sm font-medium',
                      trend === 'up' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {trend === 'up' ? (
                      <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    {trendValue}
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs sm:text-sm text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-secondary shrink-0',
              iconColorMap[icon]
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
