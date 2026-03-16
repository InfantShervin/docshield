import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Share2, Star, ArrowLeft, BarChart2, List, MessageSquare } from 'lucide-react'
import ExposureGauge from '../components/ExposureGauge'
import EntityTable from '../components/EntityTable'
import ChatBot from '../components/ChatBot'
import { RiskBadge } from '../components/RiskBadge'
import { useAnalysisStore } from '../utils/store'
import { historyAPI } from '../api/client'
import { getRiskConfig } from '../utils/riskColors'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import toast from 'react-hot-toast'

const TABS = [
  { id:'overview', label:'Overview', icon:<BarChart2 size={15}/> },
  { id:'entities', label:'Entity Table', icon:<List size={15}/> },
  { id:'chat', label:'AI Chat', icon:<MessageSquare size={15}/> },
]
const SENS_COLORS = { Critical:'#ef4444', High:'#f97316', Medium:'#f59e0b', Low:'#10b981', 'Very Low':'#6b7280' }

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentResult } = useAnalysisStore()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showRaw, setShowRaw] = useState(false)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (currentResult && currentResult.scan_id === id) {
        setScan(currentResult)
        setLoading(false)
        return
      }
      try {
        const { data } = await historyAPI.get(id)
        setScan(data)
        setStarred(data.is_starred)
      } catch {
        toast.error('Scan not found')
        navigate('/history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ paddingTop:64, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--text-secondary)' }}>Loading analysis…</p>
      </div>
    </div>
  )
  if (!scan) return null

  const cfg = getRiskConfig(scan.risk_level)

  const sensitivityDist = (() => {
    const counts = {}
    ;(scan.entities||[]).forEach(e => { counts[e.sensitivity]=(counts[e.sensitivity]||0)+1 })
    return Object.entries(counts).map(([name,count]) => ({ name, count }))
  })()

  const labelDist = (() => {
    const counts = {}
    ;(scan.entities||[]).forEach(e => { counts[e.label]=(counts[e.label]||0)+1 })
    return Object.entries(counts).map(([name,value]) => ({ name, value }))
  })()

  return (
    <div style={{ paddingTop:64, minHeight:'100vh' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', padding:'7px 14px', fontSize:13, cursor:'pointer' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{scan.filename}</h1>
          <RiskBadge level={scan.risk_level}/>
          <button onClick={async()=>{ await historyAPI.star(id); setStarred(v=>!v); toast.success(starred?'Unstarred':'Starred') }} style={{ background:starred?'rgba(245,158,11,0.12)':'var(--bg-card)', border:`1px solid ${starred?'rgba(245,158,11,0.3)':'var(--border)'}`, color:starred?'#f59e0b':'var(--text-secondary)', borderRadius:8, padding:'7px 10px', cursor:'pointer' }}>
            <Star size={15} fill={starred?'currentColor':'none'}/>
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:8, padding:'7px 10px', cursor:'pointer' }}>
            <Share2 size={15}/>
          </button>
        </div>

        {/* Hero: Gauge + Summary */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20, marginBottom:24, background:'var(--bg-card)', border:`1px solid var(--border)`, borderRadius:20, padding:28, borderTopColor:cfg.color }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ExposureGauge score={scan.exposure_score} riskLevel={scan.risk_level} size={180}/>
          </div>
          <div>
            <div style={{ padding:'14px 18px', borderRadius:12, marginBottom:16, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
              <div style={{ display:'flex', gap:8 }}>
                <AlertTriangle size={15} color={cfg.color} style={{ flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:14, lineHeight:1.6 }}>{scan.summary}</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Total tokens', value:scan.total_count },
                { label:'Sensitive fields', value:scan.sensitive_count, color:scan.sensitive_count>0?cfg.color:'var(--risk-safe)' },
                { label:'File type', value:(scan.file_type||'image').toUpperCase() },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                  <p style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:700, color:color||'var(--text-primary)' }}>{value}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Warnings */}
        {scan.warnings?.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
            style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14, padding:20, marginBottom:20 }}>
            <p style={{ fontSize:14, fontWeight:600, color:'#f87171', marginBottom:12 }}>⚠ Sensitive Information Detected</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:8 }}>
              {scan.warnings.map((w,i) => (
                <div key={i} style={{ fontSize:13, color:'var(--text-secondary)', padding:'6px 0', display:'flex', gap:6 }}>
                  <span style={{ flexShrink:0 }}>•</span> {w}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Safe fields */}
        {scan.safe_fields?.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}
            style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:14, padding:16, marginBottom:24 }}>
            <p style={{ fontSize:13, fontWeight:500, color:'#34d399', marginBottom:8 }}>
              <CheckCircle size={13} style={{ marginRight:6 }}/>Non-sensitive fields (safe to share):
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {scan.safe_fields.map((f,i) => (
                <span key={i} style={{ fontSize:12, padding:'3px 10px', borderRadius:99, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', color:'#6ee7b7' }}>{f}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-elevated)', padding:4, borderRadius:12, width:'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, fontSize:14, fontWeight:500, border:'none', cursor:'pointer', background:activeTab===tab.id?'var(--bg-card)':'transparent', color:activeTab===tab.id?'var(--text-primary)':'var(--text-muted)', boxShadow:activeTab===tab.id?'var(--shadow-card)':'none', transition:'all 0.2s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>

            {activeTab === 'overview' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
                  <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:600, marginBottom:20 }}>Sensitivity Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sensitivityDist}>
                      <XAxis dataKey="name" tick={{ fill:'#8892a4', fontSize:11 }}/>
                      <YAxis tick={{ fill:'#8892a4', fontSize:11 }}/>
                      <Tooltip contentStyle={{ background:'#131926', border:'1px solid #1a2235', borderRadius:8 }}/>
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {sensitivityDist.map(entry => <Cell key={entry.name} fill={SENS_COLORS[entry.name]||'#6b7280'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
                  <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:600, marginBottom:20 }}>Entity Labels (SGAT Output)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={labelDist}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                      <PolarAngleAxis dataKey="name" tick={{ fill:'#8892a4', fontSize:11 }}/>
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ gridColumn:'1/-1', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
                  <button onClick={() => setShowRaw(v=>!v)} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>
                    Extracted Raw Text ({scan.raw_text?.split(' ').length||0} words)
                    {showRaw ? <ChevronUp size={16} style={{ marginLeft:'auto' }}/> : <ChevronDown size={16} style={{ marginLeft:'auto' }}/>}
                  </button>
                  <AnimatePresence>
                    {showRaw && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                        style={{ marginTop:16, padding:16, background:'var(--bg-elevated)', borderRadius:10, fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, maxHeight:300, overflowY:'auto', fontFamily:'monospace' }}>
                        {scan.raw_text || 'No text extracted.'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === 'entities' && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:600, marginBottom:20 }}>
                  All Detected Entities — {scan.total_count} tokens
                </h3>
                <EntityTable entities={scan.entities||[]}/>
              </div>
            )}

            {activeTab === 'chat' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
                <ChatBot scanId={id} scanData={scan}/>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:18 }}>
                    <p style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Quick Reference</p>
                    {[['Exposure Score',`${scan.exposure_score?.toFixed(1)}%`,cfg.color],['Risk Level',scan.risk_level,cfg.color],['Sensitive Fields',`${scan.sensitive_count}/${scan.total_count}`,'var(--text-primary)']].map(([k,v,c])=>(
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ color:'var(--text-muted)' }}>{k}</span>
                        <span style={{ fontWeight:600, color:c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:14, padding:16 }}>
                    <p style={{ fontSize:13, fontWeight:500, color:'#818cf8', marginBottom:8 }}><Info size={13} style={{ marginRight:5 }}/>About DocShield AI</p>
                    <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>This assistant has full access to your document analysis and can answer any question about detected sensitive data, applicable laws, and recommended actions.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}