import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AccountPage } from './pages/AccountPage'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { BillingPage } from './pages/BillingPage'
import { CalendarPage } from './pages/CalendarPage'
import { CreditHistoryPage } from './pages/CreditHistoryPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LeadSearchPage } from './pages/LeadSearchPage'
import { LegalPage } from './pages/LegalPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PipelinePage } from './pages/PipelinePage'
import { PricingPage } from './pages/PricingPage'
import { SavedLeadsPage } from './pages/SavedLeadsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />
      <Route path="/terms" element={<LegalPage type="terms" />} />
      <Route path="/privacy" element={<LegalPage type="privacy" />} />
      <Route path="/refunds" element={<LegalPage type="refunds" />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="search" element={<LeadSearchPage />} />
        <Route path="saved" element={<SavedLeadsPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="credits" element={<CreditHistoryPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="settings" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
