import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, Eye, Lock, ArrowRight, FileSearch, Brain, Database } from 'lucide-react'
import { useAuthStore } from '../utils/store'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const features = [
    { icon:<Brain size={20}/>, title:'LayoutLMv3 + SGAT', desc:'Your published research model — trained on FUNSD, CORD, OCR datasets. 95.03% accuracy.', color:'#818cf8' },
    { icon:<Eye size={20}/>, title:'Universal Input', desc:'Scanned documents, printed forms, digital images, and PDFs — any format, any quality.', color:'#34d399' },
    { icon:<Zap size={20}/>, title:'Instant Exposure Score', desc:'AI sensitivity classification with a 0–100 risk score and plain-language warnings.', color:'#f59e0b' },
    { icon:<Database size={20}/>, title:'AI Chat Assistant', desc:'Ask anything — the assistant knows your exact document and explains every risk.', color:'#60a5fa' },
    { icon:<Lock size={20}/>, title:'Scan History', desc:'Every analysis saved. Review, compare, and track document security over time.', color:'#f472b6' },
    { icon:<FileSearch size={20}/>, title:'30+ PII Patterns', desc:'Aadhaar, PAN, passport, medical, bank data, passwords — all detected automatically.', color:'#fb923c' },
  ]

  const stats = [
    { value:'95.03%', label:'Model Accuracy' },
    { value:'30+', label:'PII Patterns' },
    { value:'3+', label:'Input Formats' },
    { value:'100%', label:'Free to Use' },
  ]

  return (
    <div style={{ paddingTop:64, minHeight:'100vh' }}>

      {/* Hero */}
      <section style={{ maxWidth:960, margin:'0 auto', padding:'100px 24px 80px', textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1, type:'spring' }}
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:99, padding:'6px 16px', marginBottom:32, fontSize:13, color:'#818cf8' }}>
          <Shield size={13}/> Built on LayoutLMv3 + Spatial Graph Attention Network
        </motion.div>

        <motion.h1
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(40px,6vw,72px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-2px', marginBottom:24 }}>
          Know what your<br/>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            documents expose
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ fontSize:18, color:'var(--text-secondary)', maxWidth:560, margin:'0 auto 48px', lineHeight:1.7 }}>
          Upload any scanned, printed, or digital document. Our AI extracts every piece of sensitive information, scores your exposure, and explains exactly what's at risk.
        </motion.p>

        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            onClick={() => navigate(user ? '/analyze' : '/register')}
            style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:14, padding:'16px 32px', fontSize:16, fontWeight:600, cursor:'pointer', boxShadow:'0 0 40px rgba(99,102,241,0.4)', fontFamily:'Syne,sans-serif', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            Analyze a Document <ArrowRight size={18}/>
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-secondary)', borderRadius:14, padding:'16px 28px', fontSize:15, cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--text-secondary)' }}>
            Sign In
          </button>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', padding:'32px 24px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, textAlign:'center' }}>
          {stats.map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1*i+0.5 }}>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800, color:'#818cf8', lineHeight:1 }}>{value}</p>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'80px 24px' }}>
        <h2 style={{ textAlign:'center', fontFamily:'Syne,sans-serif', fontSize:36, fontWeight:700, marginBottom:16, letterSpacing:'-1px' }}>
          Everything you need
        </h2>
        <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom:56 }}>
          Powered by your own published research
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {features.map(({ icon, title, desc, color }, i) => (
            <motion.div key={title}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08+0.3 }}
              style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}40`; e.currentTarget.style.boxShadow=`0 0 30px ${color}15` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none' }}>
              <div style={{ width:44, height:44, borderRadius:12, marginBottom:16, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color }}>
                {icon}
              </div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:16, marginBottom:8 }}>{title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth:700, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:24, padding:'48px 32px' }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:700, marginBottom:16 }}>
            Start protecting your documents
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:32 }}>
            Free, instant, powered by published AI research. No credit card required.
          </p>
          <button
            onClick={() => navigate(user ? '/analyze' : '/register')}
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:12, padding:'14px 36px', fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:'Syne,sans-serif', boxShadow:'0 0 40px rgba(99,102,241,0.4)' }}>
            Get Started Free →
          </button>
        </div>
      </section>
    </div>
  )
}