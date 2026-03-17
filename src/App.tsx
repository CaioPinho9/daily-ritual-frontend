import { Navigate, Route, Routes } from 'react-router-dom'

import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { GuestRoute } from './routes/GuestRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { SignupPage } from './pages/SignupPage'
import { ThemeProvider } from './theme.tsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
