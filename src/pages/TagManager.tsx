import { useState } from 'react'
import { X, Plus, Edit3, Trash2, Circle } from 'lucide-react'
import './TagManager.css'

interface Tag {
  id: string
  name: string
  color: string
}

interface Props {
  onClose: () => void
}

const TAGS_KEY = 'us_ledger_tags'
const COLORS = ['#FF6B6B','#E74C3C','#F4A261','#45B7D1','#4ECDC4','#A8D5BA','#DDA0DD','#F7DC6F','#C8B6E2','#74B9FF','#27AE60','#636E72']

function loadTags(): Tag[] {
  try { const r=localStorage.getItem(TAGS_KEY); if(r) return JSON.parse(r) } catch {}
  return []
}

export default function TagManager({ onClose }: Props) {
  const [tags, setTags] = useState<Tag[]>(loadTags)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tag|null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#FF6B6B')
  const [viewTagBills, setViewTagBills] = useState<Tag|null>(null)

  const save = (updated: Tag[]) => { setTags(updated); localStorage.setItem(TAGS_KEY, JSON.stringify(updated)) }

  const handleSave = () => {
    if(!formName.trim()) return
    if(editingTag) {
      save(tags.map(t=>t.id===editingTag.id?{...t,name:formName.trim(),color:formColor}:t))
    } else {
      save([...tags,{id:`tag_${Date.now()}`,name:formName.trim(),color:formColor}])
    }
    setShowForm(false); setEditingTag(null); setFormName('')
  }

  const handleDelete = () => {
    if(!deleteTarget) return
    // 移除账单中该标签
    const raw = localStorage.getItem('us_ledger_bills')
    if(raw) {
      const bills = JSON.parse(raw)
      bills.forEach((b:any)=>{ if(b.tag===deleteTarget.name) b.tag='' })
      localStorage.setItem('us_ledger_bills',JSON.stringify(bills))
    }
    save(tags.filter(t=>t.id!==deleteTarget.id))
    setDeleteTarget(null)
  }

  const startEdit = (tag: Tag) => { setEditingTag(tag); setFormName(tag.name); setFormColor(tag.color); setShowForm(true) }

  // 查询该标签下的账单
  const tagBills = viewTagBills ? (()=>{
    try { const r=localStorage.getItem('us_ledger_bills'); if(r) return JSON.parse(r).filter((b:any)=>b.tag===viewTagBills.name) } catch {}
    return []
  })() : []

  return (
    <div className="tm-overlay">
      <div className="tm-page">
        <header className="tm-header">
          <button className="tm-back" onClick={onClose}><X size={24}/></button>
          <h2>标签</h2>
          <button className="tm-add" onClick={()=>{setEditingTag(null);setFormName('');setFormColor('#FF6B6B');setShowForm(true)}}><Plus size={22}/></button>
        </header>
        <div className="tm-body">
          {tags.length===0 && <div className="tm-empty">
            <p>还没有标签</p>
            <p className="tm-empty-hint">标签可以帮助你对账单分类标记</p>
          </div>}
          {tags.map(tag=>(
            <div key={tag.id} className="tm-item" onClick={()=>setViewTagBills(tag)}>
              <span className="tm-dot" style={{background:tag.color}}><Circle size={12} fill={tag.color} color={tag.color}/></span>
              <span className="tm-name">{tag.name}</span>
              <div className="tm-actions">
                <button className="tm-edit" onClick={e=>{e.stopPropagation();startEdit(tag)}}><Edit3 size={14}/></button>
                <button className="tm-del" onClick={e=>{e.stopPropagation();setDeleteTarget(tag)}}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* 标签下账单 */}
        {viewTagBills && (
          <div className="tm-bills-overlay" onClick={()=>setViewTagBills(null)}>
            <div className="tm-bills-sheet" onClick={e=>e.stopPropagation()}>
              <div className="sheet-handle"/>
              <h3>「{viewTagBills.name}」标签账单</h3>
              {tagBills.length===0?(
                <p className="tm-bills-empty">暂无账单使用此标签</p>
              ):(
                <div className="tm-bills-list">
                  {tagBills.map((b:any)=>(
                    <div key={b.id} className="tm-bill-item">
                      <span>{b.categoryIcon||'📦'}</span>
                      <span className="tm-bill-name">{b.categoryName}</span>
                      <span className={`tm-bill-amount ${b.type}`}>{b.type==='expense'?'-':'+'}¥{b.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 新建/编辑表单 */}
        {showForm && (
          <div className="tm-modal-overlay" onClick={()=>{setShowForm(false);setEditingTag(null)}}>
            <div className="tm-modal" onClick={e=>e.stopPropagation()}>
              <h3>{editingTag?'编辑标签':'新建标签'}</h3>
              <input className="tm-input" placeholder="标签名称" value={formName} onChange={e=>setFormName(e.target.value)} autoFocus maxLength={8}/>
              <div className="tm-color-label">选择颜色</div>
              <div className="tm-colors">
                {COLORS.map(c=>(
                  <button key={c} className={`tm-color ${formColor===c?'active':''}`} style={{background:c}} onClick={()=>setFormColor(c)}/>
                ))}
              </div>
              <div className="tm-btns">
                <button className="tm-cancel" onClick={()=>{setShowForm(false);setEditingTag(null)}}>取消</button>
                <button className="tm-confirm" onClick={handleSave}>{editingTag?'保存':'创建'}</button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认 */}
        {deleteTarget && (
          <div className="tm-modal-overlay" onClick={()=>setDeleteTarget(null)}>
            <div className="tm-modal" onClick={e=>e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <p className="tm-warn">使用此标签的账单将自动移除该标签</p>
              <div className="tm-btns">
                <button className="tm-cancel" onClick={()=>setDeleteTarget(null)}>取消</button>
                <button className="tm-confirm danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
