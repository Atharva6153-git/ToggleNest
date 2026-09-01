import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import KanbanBoardPage from './pages/KanbanBoardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="/kanban" element={<KanbanBoardPage />} />
    </Routes>
  )
}

export default App
