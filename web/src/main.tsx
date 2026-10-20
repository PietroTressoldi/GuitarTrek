import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { Hoje } from './pages/Hoje'
import { Agenda } from './pages/Agenda'
import { Metronomo } from './pages/Metronomo'
import { Biblioteca } from './pages/Biblioteca'
import { Progresso } from './pages/Progresso.tsx'
import { Layout } from './components/Layout'
import { MotionConfig } from 'motion/react'
import { Afinador } from './pages/Afinador.tsx'
import { Braco } from './pages/Braco.tsx'
import { Backing } from './pages/Backing.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Hoje /> },
      { path: 'agenda', element: <Agenda /> },
      { path: 'metronomo', element: <Metronomo /> },
      { path: 'biblioteca', element: <Biblioteca /> },
      { path: 'progresso', element: <Progresso /> },
      { path: 'afinador', element: <Afinador /> },
      { path: 'braco', element: <Braco /> },
      { path: 'backing', element: <Backing /> }
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
)
