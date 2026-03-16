import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Loader } from 'lucide-react'
import { authAPI } from '../api/client'
import { useAuthStore } from '../utils/store'
import toast from 'react-hot-toast'

function AuthForm({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email:'', password:'', name:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')
    if (!isLogin && !form.name) return toast.error('Name required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const { data } = isLogin
        ? await authAPI.login({ email:form.email, password:form.password })
        : await authAPI.register({ email:form.email, password:form.password, name:form.name })
      setAuth({ id:data.user_id, name:data.user_name, email:data.user_email, avatar_color:'#6366f1' }, data.access_token)
      toast.success(isLogin ? `Welcome back, ${data.user_name}!` : `Welcome to DocShield, ${data.user_name}!`)
      navigate('/analyze')
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Authentication failed'
      if (typeof detail === 'string') msg = detail
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || String(d)).join(', ')
      else if (detail) msg = String(detail)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inp = { borderRadius:10, fontSize:15, height:46, background:'var(--bg-elevated)', padding:'0 14px', border:'1px solid var(--border-strong)', color:'var(--text-primary)', width:'100%' }

  return (
    <div style={{ minHeight:'100vh', paddingTop:64, display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px' }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:420, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:24, padding:'40px 36px', boxShadow:'var(--shadow-elevated)' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 0 30px rgba(99,102,241,0.4)' }}>
            <Shield size={24} color="white"/>
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:700 }}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:14, marginTop:6 }}>
            {isLogin ? 'Sign in to your DocShield account' : 'Start analyzing your documents for free'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6, display:'block' }}>Full Name</label>
              <input style={inp} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}/>
            </div>
          )}
          <div>
            <label style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6, display:'block' }}>Email</label>
            <input style={inp} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6, display:'block' }}>Password</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...inp, paddingRight:44 }} type={showPw?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))}/>
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ height:46, borderRadius:10, marginTop:8, background:loading?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', fontSize:15, fontWeight:600, cursor:loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 0 24px rgba(99,102,241,0.4)', fontFamily:'Syne,sans-serif', transition:'all 0.2s' }}>
            {loading ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }}/> {isLogin?'Signing in…':'Creating…'}</> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:14, color:'var(--text-muted)', marginTop:24 }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin?'/register':'/login'} style={{ color:'#818cf8', textDecoration:'none', fontWeight:500 }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export function LoginPage() { return <AuthForm mode="login"/> }
export function RegisterPage() { return <AuthForm mode="register"/> }