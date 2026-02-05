'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import type { CategoryChartData, MonthlyFlowData } from '@/lib/types'
import { formatCurrency } from '@/lib/data-service'

interface ChartsSectionProps {
  categoryData: CategoryChartData[]
  monthlyData: MonthlyFlowData[]
}

export function ChartsSection({ categoryData, monthlyData }: ChartsSectionProps) {
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Category Pie/Bar Chart */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-medium">Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {categoryData.length > 0 ? (
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload as CategoryChartData
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                          <p className="font-medium">{data.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(data.amount)}
                          </p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
          {/* Legend */}
          {categoryData.length > 0 && (
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-4">
              {categoryData.slice(0, 5).map((item) => (
                <div key={item.category} className="flex items-center gap-1 sm:gap-2">
                  <div
                    className="h-2 w-2 sm:h-3 sm:w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">{item.category}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Flow Line Chart */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-medium">Flujo Mensual</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {monthlyData.length > 0 ? (
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                          <p className="mb-1 font-medium">{label}</p>
                          {payload.map((entry) => (
                            <p
                              key={entry.dataKey}
                              className="text-sm"
                              style={{ color: entry.color }}
                            >
                              {entry.name}: {formatCurrency(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke="var(--income)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--income)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Gastos"
                    stroke="var(--expense)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--expense)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Additional component for bar charts used in reports
interface ExpenseBarChartProps {
  data: CategoryChartData[]
  title?: string
}

export function ExpenseBarChart({ data, title }: ExpenseBarChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as CategoryChartData
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                        <p className="font-medium">{data.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(data.amount)}
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  )
}
