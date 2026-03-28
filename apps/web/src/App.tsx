import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ResumePage } from './pages/ResumePage.tsx'
import { AboutThisSitePage } from './pages/AboutThisSitePage.tsx'
import { ProjectsPage } from './pages/ProjectsPage.tsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="about-this-site" element={<AboutThisSitePage />} />
      </Route>
    </Routes>
  )
}
