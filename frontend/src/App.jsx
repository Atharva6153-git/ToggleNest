import { Routes, Route } from 'react-router-dom'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Projects />} />
      <Route path="/projects/create" element={<CreateProject />} />
      <Route path="/projects/edit/:id" element={<EditProject />} />
    </Routes>
  )
}

export default App