import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import KanbanBoardPage from './pages/KanbanBoardPage'
import Dashboard from './pages/Dashboard'
import RequireAuth from './components/RequireAuth'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
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
        path="/projects/:id/board"
        element={
          <RequireAuth>
            <KanbanBoardPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App