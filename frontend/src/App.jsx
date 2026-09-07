import { Routes, Route, Navigate } from 'react-router-dom'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import KanbanBoardPage from './pages/KanbanBoardPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Projects />} />
      <Route path="/projects/create" element={<CreateProject />} />
      <Route path="/projects/edit/:id" element={<EditProject />} />
      <Route path="/kanban" element={<KanbanBoardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App