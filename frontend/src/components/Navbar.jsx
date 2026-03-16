import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../utils/store'
import { Shield, History, LogOut, Upload } from 'lucide-react'

export default function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (p) => location.pathname === p

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background:'rgba(8,11,18,0.85)', backdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      height:64, display:'flex', alignItems:'center', padding:'0 24px',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', gap:8 }}>
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 20px rgba(99,102,241,0.4)',
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#f0f2f8' }}>
            Doc<span style={{ color:'#818cf8' }}>Shield</span>
          </span>
        </Link>

        {user && (
          <div style={{ display:'flex', gap:4 }}>
            {[{to:'/analyze',label:'Analyze',icon:<Upload size={15}/>},{to:'/history',label:'History',icon:<History size={15}/>}].map(({to,label,icon})=>(
              <Link key={to} to={to} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:500,
                textDecoration:'none',
                color: isActive(to) ? '#818cf8' : 'var(--text-secondary)',
                background: isActive(to) ? 'rgba(99,102,241,0.12)' : 'transparent',
                border:`1px solid ${isActive(to)?'rgba(99,102,241,0.3)':'transparent'}`,
                transition:'all 0.2s',
              }}>{icon}{label}</Link>
            ))}
          </div>
        )}

        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%',
              background:user.avatar_color||'#6366f1',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:600, color:'white',
            }}>{user.name?.[0]?.toUpperCase()}</div>
            <button onClick={()=>{clearAuth();navigate('/login')}} style={{
              display:'flex', alignItems:'center', gap:6,
              background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
              color:'#f87171', borderRadius:8, padding:'6px 12px', fontSize:13, cursor:'pointer',
            }}><LogOut size={14}/> Sign out</button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/login" style={{ padding:'7px 18px', borderRadius:8, fontSize:14, fontWeight:500, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-secondary)', textDecoration:'none' }}>Sign in</Link>
            <Link to="/register" style={{ padding:'7px 18px', borderRadius:8, fontSize:14, fontWeight:500, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', textDecoration:'none', boxShadow:'0 0 20px rgba(99,102,241,0.3)' }}>Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}