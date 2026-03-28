import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EditorPage from './pages/EditorPage.tsx'

const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/editor', element: <EditorPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
