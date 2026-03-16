export const RISK_CONFIG = {
  Safe:     { color:'#10b981', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.3)',  label:'Safe' },
  Low:      { color:'#6ee7b7', bg:'rgba(110,231,183,0.1)', border:'rgba(110,231,183,0.3)', label:'Low Risk' },
  Medium:   { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.3)',  label:'Medium Risk' },
  High:     { color:'#f97316', bg:'rgba(249,115,22,0.1)',  border:'rgba(249,115,22,0.3)',  label:'High Risk' },
  Critical: { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.3)',   label:'Critical' },
}
export const SENSITIVITY_CONFIG = {
  'Very Low': { color:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  Low:        { color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  Medium:     { color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  High:       { color:'#f97316', bg:'rgba(249,115,22,0.1)' },
  Critical:   { color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
}
export const LABEL_CONFIG = {
  KEY:      { color:'#818cf8', label:'Key' },
  VALUE:    { color:'#34d399', label:'Value' },
  HEADER:   { color:'#f59e0b', label:'Header' },
  QUESTION: { color:'#60a5fa', label:'Question' },
  OTHER:    { color:'#6b7280', label:'Other' },
}
export const getRiskConfig = (level) => RISK_CONFIG[level] || RISK_CONFIG.Safe
export const getSensitivityConfig = (level) => SENSITIVITY_CONFIG[level] || SENSITIVITY_CONFIG['Very Low']
export const getLabelConfig = (label) => LABEL_CONFIG[label] || LABEL_CONFIG.OTHER
export const timeAgo = (dateStr) => {
  const diff = (new Date() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
export const fileIcon = (t) => t === 'pdf' ? '📄' : '🖼️'