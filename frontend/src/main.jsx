import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { AppContextProvider } from './context/context.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <ThemeProvider>
  <AppContextProvider>
     <App />
  </AppContextProvider>
  </ThemeProvider>
  </BrowserRouter>,
)
