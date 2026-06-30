import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { RoleSelect } from '@/features/entry/RoleSelect'
import { AppShell } from '@/features/shell/AppShell'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { BoardPage } from '@/features/board/BoardPage'
import { ApplicationFormPage } from '@/features/application-form/ApplicationFormPage'
import { CommissionPage } from '@/features/commission/CommissionPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  const role = useStore((s) => s.ui.role)

  if (!role) return <RoleSelect />

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/application/new" element={<ApplicationFormPage />} />
        <Route path="/application/:id/edit" element={<ApplicationFormPage />} />
        <Route path="/commission" element={<CommissionPage />} />
        {role === 'admin' && <Route path="/settings" element={<SettingsPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
