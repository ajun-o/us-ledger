import { useState } from 'react'
import { X, Plus, Edit3, Trash2, PiggyBank, TrendingUp, Gift } from 'lucide-react'
import './SavingPlan.css'

interface Plan {id:string;name:string;target:number;saved:number;deadline:string;history:{amount:number;account:string;date:string}[];ended:boolean}
interface Props {onClose:()=>void}

const KEY='us_ledger_saving_plans'

function load():Plan[]{try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch{}return[]}

export default function SavingPlan({onClose}:Props) {
  const [plans,setPlans]=useState<Plan[]>(load)
  const [showForm,setShowForm]=useState(false)
  const [editingPlan,setEditingPlan]=useState<Plan|null>(null)
  const [deleteTarget,setDeleteTarget]=useState<Plan|null>(null)
  const [depositTarget,setDepositTarget]=useState<Plan|null>(null)
  const [detailPlan,setDetailPlan]=useState<Plan|null>(null)
  const [form,setForm]=useState({name:'',target:'',deadline:''})
  const [depositAmount,setDepositAmount]=useState('')
  const [depositAccount,setDepositAccount]=useState('微信')
  const [celebrate,setCelebrate]=useState(false)

  const save=(updated:Plan[])=>{setPlans(updated);localStorage.setItem(KEY,JSON.stringify(updated))}

  const handleSave=()=>{
    if(!form.name.trim()||!form.target)return
    if(editingPlan){save(plans.map(p=>p.id===editingPlan.id?{...p,name:form.name.trim(),target:parseFloat(form.target),deadline:form.deadline}:p))}
    else{save([...plans,{id:`sp_${Date.now()}`,name:form.name.trim(),target:parseFloat(form.target),saved:0,deadline:form.deadline,history:[],ended:false}])}
    setShowForm(false);setEditingPlan(null)
  }

  const handleDeposit=()=>{
    if(!depositTarget||!depositAmount)return
    const amount=parseFloat(depositAmount)
    const updated=plans.map(p=>{
      if(p.id!==depositTarget.id)return p
      const newSaved=p.saved+amount
      let newHistory=[...p.history,{amount,account:depositAccount,date:new Date().toISOString().slice(0,10)}]
      let ended=p.ended
      // 达成目标
      if(newSaved>=p.target)ended=true
      return {...p,saved:newSaved,history:newHistory,ended}
    })
    save(updated)
    // 检查是否需要庆祝
    const plan=updated.find(p=>p.id===depositTarget.id)
    if(plan&&plan.saved>=plan.target){setCelebrate(true);setTimeout(()=>setCelebrate(false),3000)}
    setDepositTarget(null);setDepositAmount('')
  }

  const handleEnd=(id:string)=>{save(plans.map(p=>p.id===id?{...p,ended:!p.ended}:p))}

  return (
    <div className="sp-overlay">
      <div className="sp-page">
        <header className="sp-header">
          <button className="sp-back" onClick={onClose}><X size={24}/></button>
          <h2>存钱计划</h2>
          <button className="sp-add" onClick={()=>{setEditingPlan(null);setForm({name:'',target:'',deadline:''});setShowForm(true)}}><Plus size={22}/></button>
        </header>
        <div className="sp-body">
          {plans.length===0&&<div className="sp-empty"><PiggyBank size={40}/><p>还没有存钱计划</p></div>}
          {plans.map(p=>{
            const pct=Math.min(100,Math.round((p.saved/p.target)*100))
            return (
              <div key={p.id} className={`sp-card ${p.ended?'ended':''}`} onClick={()=>setDetailPlan(p)}>
                <div className="sp-card-top">
                  <div className="sp-card-info">
                    <span className="sp-name">{p.name}{p.ended?' ✅':''}</span>
                    <span className="sp-target">目标 ¥{p.target.toFixed(2)}{p.deadline?` · ${p.deadline}截止`:''}</span>
                  </div>
                  <span className="sp-pct">{pct}%</span>
                </div>
                <div className="sp-progress-bar"><div className="sp-progress-fill" style={{width:`${pct}%`}}/></div>
                <div className="sp-card-actions">
                  <button onClick={e=>{e.stopPropagation();setDepositTarget(p)}}><TrendingUp size={14}/> 存入</button>
                  <button onClick={e=>{e.stopPropagation();handleEnd(p.id)}}>{p.ended?'恢复':'终止'}</button>
                  <button onClick={e=>{e.stopPropagation();setEditingPlan(p);setForm({name:p.name,target:String(p.target),deadline:p.deadline});setShowForm(true)}}><Edit3 size={14}/></button>
                  <button onClick={e=>{e.stopPropagation();setDeleteTarget(p)}} className="danger"><Trash2 size={14}/></button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 存入弹窗 */}
        {depositTarget&&(
          <div className="sp-modal-overlay" onClick={()=>setDepositTarget(null)}>
            <div className="sp-modal" onClick={e=>e.stopPropagation()}>
              <h3>存入 - {depositTarget.name}</h3>
              <p className="sp-progress-text">已存 ¥{depositTarget.saved.toFixed(2)} / ¥{depositTarget.target.toFixed(2)}</p>
              <input className="sp-input" type="number" placeholder="存入金额" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} autoFocus/>
              <select className="sp-select" value={depositAccount} onChange={e=>setDepositAccount(e.target.value)}>
                {['微信','支付宝','银行卡','现金'].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
              <div className="sp-btns">
                <button className="sp-cancel" onClick={()=>setDepositTarget(null)}>取消</button>
                <button className="sp-confirm" onClick={handleDeposit}>确认存入</button>
              </div>
            </div>
          </div>
        )}

        {/* 详情 */}
        {detailPlan&&(
          <div className="sp-modal-overlay" onClick={()=>setDetailPlan(null)}>
            <div className="sp-modal" onClick={e=>e.stopPropagation()}>
              <h3>{detailPlan.name}</h3>
              <div className="sp-detail-progress">
                <div className="sp-dp-ring">
                  <svg width="100" height="100"><circle cx="50" cy="50" r="45" fill="none" stroke="#F0F0F0" strokeWidth="10"/><circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary, #A8D5BA)" strokeWidth="10" strokeDasharray={`${Math.min(100,detailPlan.saved/detailPlan.target)*283/100} 283`} strokeLinecap="round" transform="rotate(-90 50 50)"/></svg>
                  <div className="sp-dp-center"><span>¥{detailPlan.saved.toFixed(0)}</span></div>
                </div>
              </div>
              <div className="sp-history"><h4>存入记录</h4>
                {detailPlan.history.length===0?<p>暂无记录</p>:detailPlan.history.map((h,i)=><div key={i} className="sp-h-item"><span>{h.date}</span><span>{h.account}</span><span className="sp-h-amount">+¥{h.amount.toFixed(2)}</span></div>)}
              </div>
              <div className="sp-btns"><button className="sp-cancel" onClick={()=>setDetailPlan(null)}>关闭</button></div>
            </div>
          </div>
        )}

        {/* 表单/删除弹窗 - 复用已有模式 */}
        {showForm&&(
          <div className="sp-modal-overlay" onClick={()=>{setShowForm(false);setEditingPlan(null)}}>
            <div className="sp-modal" onClick={e=>e.stopPropagation()}>
              <h3>{editingPlan?'编辑计划':'新建计划'}</h3>
              <input className="sp-input" placeholder="计划名称" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
              <input className="sp-input" type="number" placeholder="目标金额" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/>
              <input className="sp-input" type="date" placeholder="截止日期" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
              <div className="sp-btns"><button className="sp-cancel" onClick={()=>{setShowForm(false);setEditingPlan(null)}}>取消</button><button className="sp-confirm" onClick={handleSave}>{editingPlan?'保存':'创建'}</button></div>
            </div>
          </div>
        )}

        {deleteTarget&&(
          <div className="sp-modal-overlay" onClick={()=>setDeleteTarget(null)}>
            <div className="sp-modal" onClick={e=>e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <div className="sp-btns"><button className="sp-cancel" onClick={()=>setDeleteTarget(null)}>取消</button><button className="sp-confirm danger" onClick={()=>{save(plans.filter(p=>p.id!==deleteTarget.id));setDeleteTarget(null)}}>确认删除</button></div>
            </div>
          </div>
        )}

        {/* 庆祝动画 */}
        {celebrate&&<div className="sp-celebrate"><Gift size={64}/><h2>🎉 目标达成！</h2></div>}
      </div>
    </div>
  )
}
