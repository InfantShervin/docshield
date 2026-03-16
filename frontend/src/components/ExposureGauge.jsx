import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getRiskConfig } from '../utils/riskColors'

export default function ExposureGauge({ score, riskLevel, size = 200 }) {
  const [displayed, setDisplayed] = useState(0)
  const { color, label } = getRiskConfig(riskLevel)

  useEffect(() => {
    let start = null
    const duration = 1200
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const r = (size / 2) - 20
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - (displayed / 100) * 0.75)
  const cx = size / 2, cy = size / 2
  const startAngle = 135
  const gradientId = `gg-${riskLevel}`

  return (
    <div style={{ position:'relative', width:size, height:size, margin:'0 auto' }}>
      <svg width={size} height={size} style={{ transform:'rotate(-270deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={score<25?'#10b981':score<50?'#f59e0b':score<75?'#f97316':'#ef4444'}/>
            <stop offset="100%" stopColor={color}/>
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}
          strokeDasharray={`${circumference*0.75} ${circumference*0.25}`} strokeLinecap="round"
          style={{transform:`rotate(${startAngle}deg)`,transformOrigin:`${cx}px ${cy}px`}}/>
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth={10}
          strokeDasharray={`${circumference*0.75} ${circumference*0.25}`}
          strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          style={{transform:`rotate(${startAngle}deg)`,transformOrigin:`${cx}px ${cy}px`}}
          initial={{strokeDashoffset:circumference*0.75}} animate={{strokeDashoffset}}
          transition={{duration:1.2,ease:'easeOut'}}
          filter={`drop-shadow(0 0 8px ${color}60)`}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:20 }}>
        <motion.span initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:0.3,type:'spring'}}
          style={{ fontFamily:'Syne,sans-serif', fontSize:size*0.22, fontWeight:800, color, lineHeight:1, textShadow:`0 0 30px ${color}60` }}>
          {displayed}
        </motion.span>
        <span style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>/ 100</span>
        <motion.span initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
          style={{ marginTop:8, fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color,
            background:`${color}22`, padding:'3px 10px', borderRadius:99, border:`1px solid ${color}40` }}>
          {label}
        </motion.span>
      </div>
    </div>
  )
}