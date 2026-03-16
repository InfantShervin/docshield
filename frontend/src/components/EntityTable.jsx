import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { getSensitivityConfig, getLabelConfig } from '../utils/riskColors'

const PAGE_SIZE = 20

export default function EntityTable({ entities }) {
  const [search, setSearch] = useState('')
  const [filterSens, setFilterSens] = useState('All')
  const [filterLabel, setFilterLabel] = useState('All')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let r = entities || []
    if (search) r = r.filter(e => e.text.toLowerCase().includes(search.toLowerCase()))
    if (filterSens !== 'All') r = r.filter(e => e.sensitivity === filterSens)
    if (filterLabel !== 'All') r = r.filter(e => e.label === filterLabel)
    return [...r].sort((a,b) => sortDir==='asc'?(a[sortBy]>b[sortBy]?1:-1):(a[sortBy]<b[sortBy]?1:-1))
  }, [entities, search, filterSens, filterLabel, sortBy, sortDir])

  const paged = filtered.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length/PAGE_SIZE)
  const toggleSort = (col) => { if(sortBy===col)setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir('desc')} setPage(0) }

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px'}}>
          <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Search tokens…" style={{paddingLeft:32,borderRadius:8,fontSize:13,height:36}}/>
        </div>
        <select value={filterSens} onChange={e=>{setFilterSens(e.target.value);setPage(0)}} style={{borderRadius:8,fontSize:13,height:36,width:'auto'}}>
          {['All','Critical','High','Medium','Low','Very Low'].map(o=><option key={o}>{o}</option>)}
        </select>
        <select value={filterLabel} onChange={e=>{setFilterLabel(e.target.value);setPage(0)}} style={{borderRadius:8,fontSize:13,height:36,width:'auto'}}>
          {['All','KEY','VALUE','HEADER','QUESTION','OTHER'].map(o=><option key={o}>{o}</option>)}
        </select>
        <span style={{fontSize:13,color:'var(--text-muted)',display:'flex',alignItems:'center'}}>{filtered.length} results</span>
      </div>
      <div style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--border)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'var(--bg-elevated)',borderBottom:'1px solid var(--border)'}}>
              {[{key:'text',label:'Token'},{key:'label',label:'Label'},{key:'sensitivity',label:'Sensitivity'},{key:'risk_score',label:'Risk Score'},{key:'matched_types',label:'Pattern'}].map(({key,label})=>(
                <th key={key} onClick={()=>toggleSort(key)} style={{padding:'10px 14px',textAlign:'left',fontWeight:500,color:'var(--text-secondary)',cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}>{label} {sortBy===key?(sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>):<ChevronDown size={12} style={{opacity:0.3}}/>}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((entity,i)=>{
              const sc=getSensitivityConfig(entity.sensitivity)
              const lc=getLabelConfig(entity.label)
              return (
                <motion.tr key={`${entity.text}-${i}`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                  style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:entity.sensitivity==='Critical'?'rgba(239,68,68,0.04)':entity.sensitivity==='High'?'rgba(249,115,22,0.03)':'transparent'}}>
                  <td style={{padding:'9px 14px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={entity.text}>{entity.text}</td>
                  <td style={{padding:'9px 14px'}}>
                    <span style={{fontSize:11,fontWeight:500,color:lc.color,background:`${lc.color}18`,border:`1px solid ${lc.color}30`,borderRadius:99,padding:'2px 8px'}}>{entity.label}</span>
                  </td>
                  <td style={{padding:'9px 14px'}}>
                    <span style={{fontSize:11,fontWeight:500,color:sc.color,background:sc.bg,border:`1px solid ${sc.color}30`,borderRadius:99,padding:'2px 8px'}}>{entity.sensitivity}</span>
                  </td>
                  <td style={{padding:'9px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:4,borderRadius:2,background:'rgba(255,255,255,0.08)',maxWidth:60}}>
                        <div style={{width:`${entity.risk_score*100}%`,height:'100%',borderRadius:2,background:sc.color}}/>
                      </div>
                      <span style={{color:sc.color,fontSize:12}}>{(entity.risk_score*100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{padding:'9px 14px',color:'var(--text-muted)',fontSize:12}}>
                    {entity.matched_types?.length>0?entity.matched_types.slice(0,2).join(', '):<span style={{opacity:0.4}}>—</span>}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages>1&&(
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
          {Array.from({length:Math.min(totalPages,8)},(_,i)=>(
            <button key={i} onClick={()=>setPage(i)} style={{width:32,height:32,borderRadius:8,background:page===i?'var(--accent)':'var(--bg-elevated)',border:`1px solid ${page===i?'var(--accent)':'var(--border)'}`,color:page===i?'white':'var(--text-secondary)',fontSize:13,cursor:'pointer'}}>{i+1}</button>
          ))}
        </div>
      )}
    </div>
  )
}