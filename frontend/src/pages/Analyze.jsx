import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader, AlertCircle, CheckCircle, Zap, Brain, Eye } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import { analyzeAPI } from '../api/client'
import { useAnalysisStore } from '../utils/store'
import toast from 'react-hot-toast'

const STEPS = [
  { icon:<Eye size={16}/>, label:'OCR Extraction', desc:'Extracting text with docTR neural OCR' },
  { icon:<Brain size={16}/>, label:'LayoutLMv3', desc:'Generating multimodal document embeddings' },
  { icon:<Zap size={16}/>, label:'SGAT Analysis', desc:'Running spatial graph attention network' },
  { icon:<Shield size={16}/>, label:'Exposure Scoring', desc:'Classifying sensitivity and computing score' },
]

export default function Analyze() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(-1)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setResult } = useAnalysisStore()

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please upload a document first')
    setLoading(true)
    setError('')
    setProgress(0)
    setStep(0)

    const stepTimer = setInterval(() => {
      setStep(s => { if (s >= STEPS.length - 1) { clearInterval(stepTimer); return s } return s + 1 })
    }, 4000)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await analyzeAPI.upload(formData, p => setProgress(p))
      clearInterval(stepTimer)
      setStep(STEPS.length)
      setResult(data)
      toast.success('Analysis complete!')
      navigate(`/results/${data.scan_id}`)
    } catch (err) {
      clearInterval(stepTimer)
      setStep(-1)
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop:64, minHeight:'100vh' }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 24px' }}>

        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:40, textAlign:'center' }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:36, fontWeight:700, letterSpacing:'-1px', marginBottom:10 }}>Analyze Your Document</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:16 }}>Upload any document — scanned, printed, digital, or PDF</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>

          {/* Left: Upload */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
              <UploadZone onFile={setFile} disabled={loading}/>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', gap:8, alignItems:'flex-start', color:'#f87171', fontSize:14 }}>
                    <AlertCircle size={16} style={{ marginTop:1, flexShrink:0 }}/>{error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleAnalyze} disabled={!file || loading} style={{ marginTop:20, width:'100%', height:52, background:!file||loading?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:'white', fontSize:16, fontWeight:600, cursor:!file||loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Syne,sans-serif', boxShadow:file&&!loading?'0 0 32px rgba(99,102,241,0.4)':'none', transition:'all 0.3s' }}>
                {loading
                  ? <><Loader size={18} style={{ animation:'spin 1s linear infinite' }}/> Analyzing… ({progress}%)</>
                  : <><Shield size={18}/> Run Privacy Analysis</>}
              </button>
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, overflow:'hidden' }}>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Running analysis pipeline…</p>
                  <div style={{ height:4, background:'var(--bg-elevated)', borderRadius:2, marginBottom:20 }}>
                    <motion.div animate={{ width:`${Math.max(progress,(step+1)*25)}%` }}
                      style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:2 }}
                      transition={{ ease:'linear' }}/>
                  </div>
                  {STEPS.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity:0.4 }} animate={{ opacity:i<=step?1:0.4 }}
                      style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
                      <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, background:i<step?'rgba(16,185,129,0.15)':i===step?'rgba(99,102,241,0.15)':'var(--bg-elevated)', border:`1px solid ${i<step?'rgba(16,185,129,0.3)':i===step?'rgba(99,102,241,0.3)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', color:i<step?'#34d399':i===step?'#818cf8':'var(--text-muted)' }}>
                        {i<step?<CheckCircle size={14}/>:i===step?<Loader size={14} style={{ animation:'spin 1s linear infinite' }}/>:s.icon}
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:500, color:i<=step?'var(--text-primary)':'var(--text-muted)' }}>{s.label}</p>
                        <p style={{ fontSize:11, color:'var(--text-muted)' }}>{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Info */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><Brain size={14} color="#818cf8"/></div>
                <span style={{ fontSize:13, fontWeight:600 }}>Model Pipeline</span>
              </div>
              {[['OCR Engine','docTR (neural OCR)'],['Embeddings','LayoutLMv3-Large'],['Classifier','SGAT (your model)'],['Accuracy','95.03%'],['F1 Score','94.80%']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ color:'var(--text-primary)', fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Detects automatically</p>
              {[['🔴','Aadhaar, PAN, Passport, Voter ID'],['🟠','Credit cards, bank accounts, IFSC'],['🟡','Phone, email, date of birth'],['🟢','Medical records, diagnoses'],['🔵','Passwords, API keys, tokens']].map(([icon,text]) => (
                <div key={text} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13 }}>
                  <span>{icon}</span><span style={{ color:'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Accepted file types</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['JPG','PNG','TIFF','BMP','WEBP','PDF'].map(t => (
                  <span key={t} style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>{t}</span>
                ))}
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:10 }}>Max 20 MB per file</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}