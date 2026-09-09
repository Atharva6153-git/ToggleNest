<<<<<<<<< Temporary merge branch 1
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import './App.css'
import KanbanBoardPage from './pages/KanbanBoardPage'
import Dashboard from './pages/Dashboard'
import RequireAuth from './components/RequireAuth'
=========
>>>>>>>>> Temporary merge branch 2
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
=========
      <Route path="/" element={<Projects />} />
      <Route path="/projects/create" element={<CreateProject />} />
      <Route path="/projects/edit/:id" element={<EditProject />} />
      <Route path="/kanban" element={<KanbanBoardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
>>>>>>>>> Temporary merge branch 2
    </Routes>
  )
}

export default App
