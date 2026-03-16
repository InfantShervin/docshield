import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { History, Star, Search, Upload } from 'lucide-react'
import { HistoryCard } from '../components/RiskBadge'
import { historyAPI } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { getRiskConfig } from '../utils/riskColors'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

export default function HistoryPage() {
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [starredOnly, setStarredOnly] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [scanRes, statsRes] = await Promise.all([historyAPI.list(), historyAPI.stats()])
        setScans(scanRes.data)
        setStats(statsRes.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = scans.filter(s => {
    if (search && !s.filename.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== 'All' && s.risk_level !== filter) return false
    if (starredOnly && !s.is_starred) return false
    return true
  })

  const riskData = ['Safe','Low','Medium','High','Critical'].map(level => ({
    name:level, count:scans.filter(s=>s.risk_level===level).length, color:getRiskConfig(level).color,
  })).filter(d=>d.count>0)

  if (loading) return (
    <div style={{ paddingTop:64, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
    </div>
  )

  return (
    <div style={{ paddingTop:64, minHeight:'100vh' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <History size={20} color="#818cf8"/>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700 }}>Scan History</h1>
          <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-muted)' }}>{scans.length} total scans</span>
          <button onClick={() => navigate('/analyze')} style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:8, color:'white', padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            <Upload size={14}/> New Scan
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
            {[
              { label:'Total Scans', value:stats.total_scans, color:'#818cf8' },
              { label:'High Risk', value:stats.critical_scans, color:'#ef4444' },
              { label:'Avg Exposure', value:`${stats.avg_exposure.toFixed(1)}%`, color:'#f59e0b' },
              { label:'Most Common', value:stats.most_common_risk, color:getRiskConfig(stats.most_common_risk).color },
            ].map(({ label, value, color }) => (
              <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px' }}>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{label}</p>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:700, color }}>{value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters + chart row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, marginBottom:24 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'1 1 180px' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files…" style={{ paddingLeft:30, height:36, borderRadius:8, fontSize:13 }}/>
            </div>
            <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ height:36, borderRadius:8, fontSize:13, width:'auto' }}>
              {['All','Safe','Low','Medium','High','Critical'].map(o=><option key={o}>{o}</option>)}
            </select>
            <button onClick={()=>setStarredOnly(v=>!v)} style={{ height:36, padding:'0 14px', borderRadius:8, fontSize:13, background:starredOnly?'rgba(245,158,11,0.12)':'var(--bg-card)', border:`1px solid ${starredOnly?'rgba(245,158,11,0.3)':'var(--border)'}`, color:starredOnly?'#f59e0b':'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
              <Star size={13} fill={starredOnly?'currentColor':'none'}/> Starred
            </button>
          </div>
          {riskData.length > 0 && (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 16px' }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>Risk distribution</p>
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={riskData}>
                  <XAxis dataKey="name" tick={{ fill:'#8892a4', fontSize:9 }}/>
                  <Tooltip contentStyle={{ background:'#131926', border:'1px solid #1a2235', borderRadius:6, fontSize:12 }}/>
                  <Bar dataKey="count" radius={[2,2,0,0]}>
                    {riskData.map(entry=><Cell key={entry.name} fill={entry.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Scan list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px' }}>
            <History size={40} color="var(--text-muted)" style={{ marginBottom:16 }}/>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:20, marginBottom:8 }}>No scans found</h3>
            <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>{scans.length===0?'Upload your first document to get started.':'Try adjusting your search or filter.'}</p>
            <button onClick={()=>navigate('/analyze')} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:10, padding:'10px 24px', fontSize:14, cursor:'pointer' }}>Analyze a Document</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
            {filtered.map((scan,i) => (
              <motion.div key={scan.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
                <HistoryCard scan={scan} onDelete={id=>setScans(prev=>prev.filter(s=>s.id!==id))} onStar={id=>setScans(prev=>prev.map(s=>s.id===id?{...s,is_starred:!s.is_starred}:s))}/>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}