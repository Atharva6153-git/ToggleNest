import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthSuccess from './pages/OAuthSuccess'
import LandingPage from './pages/LandingPage'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import './App.css'
import KanbanBoardPage from './pages/KanbanBoardPage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import RequireAuth from './components/RequireAuth'
import HomeRoute from './components/HomeRoute'

function App() {
  const location = useLocation()

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      <Route
        path="/"
        element={
          <HomeRoute>
            <LandingPage />
          </HomeRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <Projects />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/create"
        element={
          <RequireAuth>
            <CreateProject />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/edit/:id"
        element={
          <RequireAuth>
            <EditProject />
          </RequireAuth>
        }
      />
      <Route
        path="/kanban"
        element={
          <RequireAuth>
            <KanbanBoardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:id/board"
        element={
          <RequireAuth>
            <KanbanBoardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AnimatePresence>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--bg)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--bg)',
            },
          },
        }}
      />
    </>
  )
}

export default App
