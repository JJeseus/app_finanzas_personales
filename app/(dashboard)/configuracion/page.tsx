'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import { resetAllData } from '@/lib/data-service'
import { Settings, Moon, Sun, Trash2, RefreshCw, Database, Shield } from 'lucide-react'

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [showResetDialog, setShowResetDialog] = useState(false)

  const isDarkMode = theme === 'dark'

  const handleResetData = () => {
    resetAllData()
    setShowResetDialog(false)
    toast({
      title: 'Datos reiniciados',
      description: 'Se han restaurado los datos de ejemplo.',
    })
    // Refresh the page to reload data
    window.location.reload()
  }

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
    toast({
      title: newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado',
      description: 'El tema ha sido cambiado.',
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Personaliza tu experiencia en FinanzApp
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            {isDarkMode ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
            Apariencia
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Personaliza el aspecto visual de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="dark-mode" className="font-medium text-sm sm:text-base">Modo Oscuro</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Usa un tema oscuro para reducir la fatiga visual
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            Gestión de Datos
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Administra tus datos almacenados localmente</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3 sm:p-4">
            <div>
              <p className="font-medium text-sm sm:text-base">Reiniciar Datos de Ejemplo</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Restaura los datos de demostración originales
              </p>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto" onClick={() => setShowResetDialog(true)}>
              <RefreshCw className="h-4 w-4" />
              Reiniciar
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3 sm:p-4">
            <div>
              <p className="font-medium text-destructive text-sm sm:text-base">Eliminar Todos los Datos</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Borra permanentemente todos tus datos locales
              </p>
            </div>
            <Button variant="destructive" className="gap-2 w-full sm:w-auto" onClick={() => setShowResetDialog(true)}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Privacidad
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Información sobre cómo se manejan tus datos</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="rounded-lg bg-muted p-3 sm:p-4">
            <h4 className="font-medium text-sm sm:text-base">Almacenamiento Local</h4>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Todos tus datos se almacenan localmente en tu navegador usando localStorage. 
              Ninguna información se envía a servidores externos. Tus datos permanecen 
              privados y bajo tu control total.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Acerca de
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col gap-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versión</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tecnología</span>
              <span>Next.js + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UI</span>
              <span>shadcn/ui + Tailwind CSS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos tus datos actuales y los reemplazará con los datos de ejemplo originales. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
