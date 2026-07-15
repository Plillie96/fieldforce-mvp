import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import ProjectView from './pages/ProjectView'
import CaptureItem from './pages/CaptureItem'
import ItemDetail from './pages/ItemDetail'
import Report from './pages/Report'
import Dashboard from './pages/Dashboard'
import PlanView from './pages/PlanView'
import SettingsPage from './pages/Settings'
import './index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'project/:projectId', element: <ProjectView /> },
      { path: 'project/:projectId/capture', element: <CaptureItem /> },
      { path: 'project/:projectId/item/:itemId', element: <ItemDetail /> },
      { path: 'project/:projectId/dashboard', element: <Dashboard /> },
      { path: 'project/:projectId/plan', element: <PlanView /> },
      { path: 'project/:projectId/report', element: <Report /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
