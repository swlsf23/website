import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ResumePage } from './pages/ResumePage.tsx'
import { ProjectsPage } from './pages/ProjectsPage.tsx'
import { ContactPage } from './pages/ContactPage.tsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
    </Routes>
  )
}
