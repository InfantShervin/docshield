import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Results from './pages/Results'
import HistoryPage from './pages/History'
import { LoginPage, RegisterPage } from './pages/Login'
import { useAuthStore } from './utils/store'

function Protected({ children }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace/>
  return children
}

export default function App() {
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/analyze" element={<Protected><Analyze/></Protected>}/>
        <Route path="/results/:id" element={<Protected><Results/></Protected>}/>
        <Route path="/history" element={<Protected><HistoryPage/></Protected>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </>
  )
}