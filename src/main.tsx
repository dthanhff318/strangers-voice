import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme.css'
import './i18n/config' // Initialize i18n
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AudioPlayerProvider } from './contexts/AudioPlayerContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Configure QueryClient with optimized caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache garbage collection after 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnReconnect: true, // Refetch when internet reconnects
      retry: 1, // Retry failed requests once
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              <App />
            </AudioPlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
)
