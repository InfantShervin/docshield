import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { chatAPI } from '../api/client'
import toast from 'react-hot-toast'

const QUICK = ['What sensitive data was found?','Is it safe to share this document?','How do I redact this document?','What laws apply to this data?','Explain the exposure score']

export default function ChatBot({ scanId, scanData }) {
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:`Hi! I'm DocShield AI 🛡️\n\nI've analyzed **"${scanData?.filename}"** — exposure score **${scanData?.exposure_score?.toFixed(1)}%**, risk level **${scanData?.risk_level}**.\n\nAsk me anything about the detected sensitive information or how to protect your data.`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, {role:'user',content:msg}])
    setLoading(true)
    try {
      const history = messages.slice(-10).map(m=>({role:m.role,content:m.content}))
      const {data} = await chatAPI.send(scanId, msg, history)
      setMessages(prev => [...prev, {role:'assistant',content:data.reply}])
    } catch {
      toast.error('Chat failed. Please try again.')
      setMessages(prev => [...prev, {role:'assistant',content:'Sorry, I encountered an error. Please try again.'}])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:560,borderRadius:16,border:'1px solid var(--border)',background:'var(--bg-card)',overflow:'hidden'}}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,background:'var(--bg-elevated)'}}>
        <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 16px rgba(99,102,241,0.4)'}}>
          <Sparkles size={15} color="white"/>
        </div>
        <div>
          <p style={{fontWeight:600,fontSize:14,lineHeight:1}}>DocShield AI</p>
          <p style={{fontSize:11,color:'var(--text-muted)'}}>Privacy analysis assistant</p>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#10b981'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'currentColor'}}/> Online
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
        <AnimatePresence>
          {messages.map((msg,i)=>(
            <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}}
              style={{display:'flex',gap:10,alignItems:'flex-start',flexDirection:msg.role==='user'?'row-reverse':'row'}}>
              <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:msg.role==='user'?'rgba(99,102,241,0.2)':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:msg.role==='user'?'1px solid rgba(99,102,241,0.3)':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {msg.role==='user'?<User size={13} color="#818cf8"/>:<Bot size={13} color="white"/>}
              </div>
              <div style={{maxWidth:'80%',background:msg.role==='user'?'rgba(99,102,241,0.12)':'var(--bg-elevated)',border:`1px solid ${msg.role==='user'?'rgba(99,102,241,0.25)':'var(--border)'}`,borderRadius:msg.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'10px 14px',fontSize:14,lineHeight:1.6}}>
                <div className="chat-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={13} color="white"/></div>
            <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'14px 14px 14px 4px',padding:'12px 16px',display:'flex',gap:4,alignItems:'center'}}>
              {[0,1,2].map(i=>(
                <motion.div key={i} animate={{y:[0,-4,0]}} transition={{duration:0.6,repeat:Infinity,delay:i*0.15}}
                  style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}/>
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef}/>
      </div>

      {messages.length<=2&&(
        <div style={{padding:'0 16px 12px',display:'flex',gap:6,flexWrap:'wrap'}}>
          {QUICK.map(p=>(
            <button key={p} onClick={()=>send(p)} style={{fontSize:12,padding:'5px 12px',borderRadius:99,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(99,102,241,0.4)';e.currentTarget.style.color='#818cf8'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}>{p}</button>
          ))}
        </div>
      )}

      <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:8,background:'var(--bg-elevated)'}}>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
          placeholder="Ask about this document's privacy risks…" rows={1}
          style={{flex:1,resize:'none',borderRadius:10,fontSize:14,padding:'9px 14px',background:'var(--bg-card)',border:'1px solid var(--border-strong)',maxHeight:100,lineHeight:1.5}}/>
        <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:40,height:40,borderRadius:10,flexShrink:0,background:input.trim()&&!loading?'linear-gradient(135deg,#6366f1,#8b5cf6)':'var(--bg-card)',border:`1px solid ${input.trim()&&!loading?'transparent':'var(--border)'}`,color:'white',cursor:input.trim()&&!loading?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:input.trim()&&!loading?'0 0 16px rgba(99,102,241,0.4)':'none',transition:'all 0.2s'}}>
          {loading?<Loader size={16} style={{animation:'spin 1s linear infinite'}}/>:<Send size={16}/>}
        </button>
      </div>
    </div>
  )
}