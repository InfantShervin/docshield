import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileImage, FileText, X, Camera, Image as Img, Scan } from 'lucide-react'

const ACCEPTED = {
  'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/tiff':['.tiff','.tif'],
  'image/bmp':['.bmp'],'image/webp':['.webp'],'application/pdf':['.pdf'],
}

export default function UploadZone({ onFile, disabled }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted, rejected) => {
    setError('')
    if (rejected.length > 0) {
      const r = rejected[0]
      setError(r.errors[0]?.code === 'file-too-large' ? 'File too large. Max 20 MB.' : 'Unsupported file type. Use JPG, PNG, TIFF, BMP, WEBP, or PDF.')
      return
    }
    if (!accepted.length) return
    const f = accepted[0]
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(f)
    } else { setPreview('pdf') }
    onFile(f)
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:ACCEPTED, maxSize:20*1024*1024, maxFiles:1, disabled,
  })

  const clear = (e) => { e.stopPropagation(); setFile(null); setPreview(null); setError(''); onFile(null) }

  return (
    <div>
      <div {...getRootProps()} style={{
        border:`2px dashed ${isDragActive?'#6366f1':error?'#ef4444':file?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.12)'}`,
        borderRadius:20, background:isDragActive?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.02)',
        cursor:disabled?'not-allowed':'pointer', transition:'all 0.3s',
        position:'relative', overflow:'hidden', minHeight:file?300:280,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:isDragActive?'0 0 40px rgba(99,102,241,0.2)':'none',
        padding:file?0:'60px 24px',
      }}>
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{textAlign:'center',width:'100%'}}>
              <motion.div animate={isDragActive?{scale:1.15,y:-4}:{scale:1,y:0}} style={{
                width:72, height:72, borderRadius:20, margin:'0 auto 24px',
                background:isDragActive?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.05)',
                border:`1px solid ${isDragActive?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.08)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s',
              }}>
                <Upload size={28} color={isDragActive?'#818cf8':'var(--text-secondary)'} />
              </motion.div>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:600,marginBottom:8}}>
                {isDragActive ? 'Drop it here' : 'Drop your document here'}
              </h3>
              <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:24}}>
                or <span style={{color:'#818cf8',textDecoration:'underline'}}>browse files</span>
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:16}}>
                {[{icon:<Camera size={13}/>,label:'Scanned docs'},{icon:<Img size={13}/>,label:'Digital images'},{icon:<Scan size={13}/>,label:'Printed forms'},{icon:<FileText size={13}/>,label:'PDFs'}].map(({icon,label})=>(
                  <span key={label} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:99,padding:'4px 12px',fontSize:12,color:'var(--text-secondary)'}}>
                    {icon} {label}
                  </span>
                ))}
              </div>
              <p style={{fontSize:12,color:'var(--text-muted)'}}>JPG · PNG · TIFF · BMP · WEBP · PDF — Max 20 MB</p>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} style={{width:'100%',height:300,position:'relative'}}>
              {preview === 'pdf' ? (
                <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
                  <div style={{width:60,height:60,borderRadius:16,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <FileText size={28} color="#f87171"/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontWeight:500,marginBottom:4}}>{file.name}</p>
                    <p style={{fontSize:13,color:'var(--text-secondary)'}}>PDF · {(file.size/1024/1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Preview" style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:18,padding:16}}/>
              )}
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(8,11,18,0.9)',backdropFilter:'blur(10px)',borderTop:'1px solid rgba(255,255,255,0.06)',borderBottomLeftRadius:18,borderBottomRightRadius:18,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {preview==='pdf'?<FileText size={14} color="#f87171"/>:<FileImage size={14} color="#818cf8"/>}
                  <span style={{fontSize:13,color:'var(--text-secondary)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</span>
                  <span style={{fontSize:12,color:'var(--text-muted)'}}>{(file.size/1024/1024).toFixed(2)} MB</span>
                </div>
                <button onClick={clear} style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:6,color:'#f87171',padding:'3px 8px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                  <X size={12}/> Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} style={{color:'#f87171',fontSize:13,marginTop:8,textAlign:'center'}}>{error}</motion.p>}
    </div>
  )
}