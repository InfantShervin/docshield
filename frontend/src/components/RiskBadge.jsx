import { motion } from 'framer-motion'
import { getRiskConfig, timeAgo, fileIcon } from '../utils/riskColors'
import { Star, Trash2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { historyAPI } from '../api/client'
import toast from 'react-hot-toast'

export function RiskBadge({ level, size='md' }) {
  const cfg = getRiskConfig(level)
  const sizes = { sm:{fontSize:10,padding:'2px 8px'}, md:{fontSize:12,padding:'4px 12px'}, lg:{fontSize:14,padding:'6px 16px'} }
  const sz = sizes[size]||sizes.md
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:sz.fontSize,fontWeight:600,color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:99,padding:sz.padding}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:cfg.color}}/>{cfg.label}
    </span>
  )
}

export function HistoryCard({ scan, onDelete, onStar }) {
  const navigate = useNavigate()
  const cfg = getRiskConfig(scan.risk_level)

  const handleStar = async (e) => {
    e.stopPropagation()
    try { await historyAPI.star(scan.id); onStar?.(scan.id) } catch { toast.error('Failed') }
  }
  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Delete this scan?')) return
    try { await historyAPI.delete(scan.id); onDelete?.(scan.id); toast.success('Deleted') } catch { toast.error('Failed') }
  }

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} whileHover={{y:-2}}
      onClick={()=>navigate(`/results/${scan.id}`)}
      style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px',cursor:'pointer',transition:'all 0.2s',position:'relative',overflow:'hidden'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.boxShadow='var(--shadow-card)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:cfg.color,borderRadius:'14px 0 0 14px'}}/>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:cfg.bg,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
          {fileIcon(scan.file_type)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{scan.filename}</p>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <RiskBadge level={scan.risk_level} size="sm"/>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>{scan.sensitive_count}/{scan.total_count} sensitive</span>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>· {timeAgo(scan.created_at)}</span>
          </div>
        </div>
        <div style={{flexShrink:0,textAlign:'center',background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:10,padding:'6px 12px'}}>
          <p style={{fontSize:18,fontWeight:800,color:cfg.color,lineHeight:1,fontFamily:'Syne,sans-serif'}}>{scan.exposure_score.toFixed(0)}</p>
          <p style={{fontSize:10,color:cfg.color,opacity:0.7}}>score</p>
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginTop:12,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
        <button onClick={handleStar} style={{background:scan.is_starred?'rgba(245,158,11,0.12)':'transparent',border:`1px solid ${scan.is_starred?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)'}`,color:scan.is_starred?'#f59e0b':'var(--text-muted)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}>
          <Star size={12} fill={scan.is_starred?'currentColor':'none'}/>
        </button>
        <button onClick={()=>navigate(`/results/${scan.id}`)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.08)',color:'var(--text-muted)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}>
          <ExternalLink size={12}/> View
        </button>
        <button onClick={handleDelete}
          style={{background:'transparent',border:'1px solid rgba(255,255,255,0.08)',color:'var(--text-muted)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4,transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';e.currentTarget.style.color='#f87171'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)'}}>
          <Trash2 size={12}/>
        </button>
      </div>
    </motion.div>
  )
}