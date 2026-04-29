import { useState } from 'react'
import { X, Plus, Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import './ScheduledTasks.css'

interface ScheduledTask {
  id: string
  name: string
  amount: number
  categoryName: string
  categoryIcon: string
  member: string
  account: string
  cycle: 'daily'|'weekly'|'monthly'|'yearly'
  startDate: string
  endDate: string
  enabled: boolean
}

interface Props { onClose: () => void }

const TASKS_KEY = 'us_ledger_scheduled_tasks'
const CATS = ['餐饮','交通','购物','娱乐','居住','医疗','教育','其他']
const EMOJIS = ['🍜','🚗','🛒','🎮','🏠','🏥','📚','🔧']
const MEMBERS = [{id:'mine',label:'我'},{id:'partner',label:'TA'},{id:'joint',label:'共同'}]
const CYCLES: {id:ScheduledTask['cycle'];label:string}[] = [{id:'daily',label:'每天'},{id:'weekly',label:'每周'},{id:'monthly',label:'每月'},{id:'yearly',label:'每年'}]

function load(): ScheduledTask[] {
  try{const r=localStorage.getItem(TASKS_KEY);if(r)return JSON.parse(r)}catch{}
  return []
}

export default function ScheduledTasks({onClose}:Props) {
  const [tasks,setTasks]=useState<ScheduledTask[]>(load)
  const [showForm,setShowForm]=useState(false)
  const [editingTask,setEditingTask]=useState<ScheduledTask|null>(null)
  const [deleteTarget,setDeleteTarget]=useState<ScheduledTask|null>(null)
  const [form,setForm]=useState({name:'',amount:'',categoryName:'餐饮',categoryIcon:'🍜',member:'mine',account:'微信',cycle:'monthly' as ScheduledTask['cycle'],startDate:'',endDate:''})

  const save = (updated:ScheduledTask[]) => {setTasks(updated);localStorage.setItem(TASKS_KEY,JSON.stringify(updated))}

  const handleSave = () => {
    if(!form.name.trim()||!form.amount)return
    if(editingTask) {
      save(tasks.map(t=>t.id===editingTask.id?{...t,...form,amount:parseFloat(form.amount),enabled:t.enabled}:t))
    } else {
      const task:ScheduledTask={id:`st_${Date.now()}`,...form,amount:parseFloat(form.amount),enabled:true}
      save([...tasks,task])
    }
    setShowForm(false);setEditingTask(null)
  }

  const toggle = (id:string) => {save(tasks.map(t=>t.id===id?{...t,enabled:!t.enabled}:t))}

  return (
    <div className="st-overlay">
      <div className="st-page">
        <header className="st-header">
          <button className="st-back" onClick={onClose}><X size={24}/></button>
          <h2>定时记账</h2>
          <button className="st-add" onClick={()=>{setEditingTask(null);setForm({name:'',amount:'',categoryName:'餐饮',categoryIcon:'🍜',member:'mine',account:'微信',cycle:'monthly',startDate:'',endDate:''});setShowForm(true)}}><Plus size={22}/></button>
        </header>
        <div className="st-body">
          {tasks.length===0 && <div className="st-empty"><p>还没有定时任务</p><p className="st-hint">设置定时任务，记账不再忘记</p></div>}
          {tasks.map(t=>(
            <div key={t.id} className="st-card">
              <div className="st-card-main" onClick={()=>{setEditingTask(t);setForm({name:t.name,amount:String(t.amount),categoryName:t.categoryName,categoryIcon:t.categoryIcon,member:t.member,account:t.account,cycle:t.cycle,startDate:t.startDate,endDate:t.endDate});setShowForm(true)}}>
                <span className="st-icon">{t.categoryIcon}</span>
                <div className="st-info">
                  <span className="st-name">{t.name}</span>
                  <span className="st-meta">{t.categoryName} · {CYCLES.find(c=>c.id===t.cycle)?.label} · ¥{t.amount}</span>
                </div>
                <button className={`st-toggle ${t.enabled?'on':'off'}`} onClick={e=>{e.stopPropagation();toggle(t.id)}}>
                  {t.enabled?<ToggleRight size={24} color="#A8D5BA"/>:<ToggleLeft size={24} color="#D1D5DB"/>}
                </button>
              </div>
              <div className="st-card-actions">
                <button onClick={()=>{setEditingTask(t);setForm({name:t.name,amount:String(t.amount),categoryName:t.categoryName,categoryIcon:t.categoryIcon,member:t.member,account:t.account,cycle:t.cycle,startDate:t.startDate,endDate:t.endDate});setShowForm(true)}}><Edit3 size={14}/></button>
                <button onClick={()=>setDeleteTarget(t)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="st-modal-overlay" onClick={()=>{setShowForm(false);setEditingTask(null)}}>
            <div className="st-modal" onClick={e=>e.stopPropagation()}>
              <h3>{editingTask?'编辑任务':'新建任务'}</h3>
              <input className="st-input" placeholder="任务名称" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus maxLength={10}/>
              <div className="st-row">
                <input className="st-input flex" type="number" placeholder="金额" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
              </div>
              <div className="st-label">分类</div>
              <div className="st-chips">
                {CATS.map((c,i)=><button key={c} className={`st-chip ${form.categoryName===c?'active':''}`} onClick={()=>setForm({...form,categoryName:c,categoryIcon:EMOJIS[i]})}>{EMOJIS[i]} {c}</button>)}
              </div>
              <div className="st-label">成员</div>
              <div className="st-row gap">
                {MEMBERS.map(m=><button key={m.id} className={`st-chip ${form.member===m.id?'active':''}`} onClick={()=>setForm({...form,member:m.id})}>{m.label}</button>)}
              </div>
              <div className="st-label">周期</div>
              <div className="st-row gap">
                {CYCLES.map(c=><button key={c.id} className={`st-chip ${form.cycle===c.id?'active':''}`} onClick={()=>setForm({...form,cycle:c.id})}>{c.label}</button>)}
              </div>
              <div className="st-btns">
                <button className="st-cancel" onClick={()=>{setShowForm(false);setEditingTask(null)}}>取消</button>
                <button className="st-confirm" onClick={handleSave}>{editingTask?'保存':'创建'}</button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="st-modal-overlay" onClick={()=>setDeleteTarget(null)}>
            <div className="st-modal" onClick={e=>e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <div className="st-btns">
                <button className="st-cancel" onClick={()=>setDeleteTarget(null)}>取消</button>
                <button className="st-confirm danger" onClick={()=>{save(tasks.filter(t=>t.id!==deleteTarget.id));setDeleteTarget(null)}}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
