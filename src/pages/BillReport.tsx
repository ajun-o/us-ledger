import { useState, useEffect } from 'react'
import { X, ChevronDown, Download, Share2 } from 'lucide-react'
import { type BillItem, fetchBills, fetchMonthStats } from '../lib/bills'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import './BillReport.css'

interface Props { onClose: () => void }

type Period = 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'custom'

const periodLabels: Record<Period, string> = {
  'this-month': '本月', 'last-month': '上月', 'this-quarter': '本季', 'this-year': '本年', 'custom': '自定义'
}

const COLORS = ['#A8D5BA','#F4A261','#C8B6E2','#E74C3C','#27AE60','#74B9FF','#FFEAA7','#636E72']

export default function BillReport({ onClose }: Props) {
  const now = new Date()
  const [period, setPeriod] = useState<Period>('this-month')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [bills, setBills] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)

  const getDateRange = (p: Period) => {
    const y = now.getFullYear(); const m = now.getMonth()+1
    switch(p) {
      case 'this-month': return { start:`${y}-${String(m).padStart(2,'0')}-01`, end:`${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}` }
      case 'last-month': {
        const lm = m===1?12:m-1; const ly = m===1?y-1:y
        return { start:`${ly}-${String(lm).padStart(2,'0')}-01`, end:`${ly}-${String(lm).padStart(2,'0')}-${new Date(ly,lm,0).getDate()}` }
      }
      case 'this-quarter': {
        const qs = Math.floor((m-1)/3)*3+1
        const qe = new Date(y,qs+2,0).getDate()
        return { start:`${y}-${String(qs).padStart(2,'0')}-01`, end:`${y}-${String(qs+2).padStart(2,'0')}-${qe}` }
      }
      case 'this-year': return { start:`${y}-01-01`, end:`${y}-12-31` }
      default: return { start:`${y}-${String(m).padStart(2,'0')}-01`, end:`${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}` }
    }
  }

  useEffect(() => {
    setLoading(true)
    const {start, end} = getDateRange(period)
    fetchBills({startDate:start, endDate:end}).then(data=>{setBills(data);setLoading(false)}).catch(()=>setLoading(false))
  }, [period])

  const totalExpense = bills.filter(b=>b.type==='expense').reduce((s,b)=>s+b.amount,0)
  const totalIncome = bills.filter(b=>b.type==='income').reduce((s,b)=>s+b.amount,0)

  // 支出TOP5
  const catMap = new Map<string,number>()
  bills.filter(b=>b.type==='expense').forEach(b=>catMap.set(b.categoryName,(catMap.get(b.categoryName)||0)+b.amount))
  const top5 = Array.from(catMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value:Math.round(value*100)/100}))

  // 成员对比
  const memberMap = new Map<string,{expense:number;income:number}>()
  bills.forEach(b=>{const e=memberMap.get(b.member)||{expense:0,income:0};if(b.type==='expense')e.expense+=b.amount;else e.income+=b.amount;memberMap.set(b.member,e)})
  const memberPie = Array.from(memberMap.entries()).map(([name,data])=>({name:name==='mine'?'我':name==='partner'?'TA':'共同',value:Math.round((data.expense+data.income)*100)/100}))

  // 每日趋势
  const dailyMap = new Map<string,{date:string;expense:number;income:number}>()
  bills.forEach(b=>{const e=dailyMap.get(b.date)||{date:b.date,expense:0,income:0};if(b.type==='expense')e.expense+=b.amount;else e.income+=b.amount;dailyMap.set(b.date,e)})
  const dailyTrend = Array.from(dailyMap.values()).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({...d,date:d.date.slice(5),expense:Math.round(d.expense*100)/100,income:Math.round(d.income*100)/100}))

  // 趣味数据
  const maxDay = dailyTrend.reduce((max,d)=>d.expense>max.amount?{date:d.date,amount:d.expense}:max,{date:'',amount:0})
  const maxCat = top5[0]||{name:'无',value:0}
  const avgPerDay = dailyTrend.length>0?totalExpense/dailyTrend.length:0

  const handleShare = async () => {
    if(navigator.share){ try{await navigator.share({title:'账单报告',text:`${periodLabels[period]}账单：支出¥${totalExpense.toFixed(2)} 收入¥${totalIncome.toFixed(2)}`})}catch{} }
  }

  if(loading) return <div className="br-overlay"><div className="br-loading">加载中...</div></div>

  return (
    <div className="br-overlay">
      <div className="br-page">
        <header className="br-header">
          <button onClick={onClose}><X size={24}/></button>
          <button className="br-period" onClick={()=>setShowPeriodMenu(!showPeriodMenu)}>
            {periodLabels[period]} <ChevronDown size={14}/>
          </button>
          <div className="br-header-actions">
            <button onClick={handleShare}><Share2 size={18}/></button>
            <button><Download size={18}/></button>
          </div>
        </header>
        {showPeriodMenu && <>
          <div className="br-menu-overlay" onClick={()=>setShowPeriodMenu(false)}/>
          <div className="br-period-menu">
            {(Object.keys(periodLabels) as Period[]).map(p=>(
              <button key={p} className={period===p?'active':''} onClick={()=>{setPeriod(p);setShowPeriodMenu(false)}}>{periodLabels[p]}</button>
            ))}
          </div>
        </>}

        <div className="br-body">
          {/* 封面 */}
          <div className="br-card cover">
            <h1>账单报告</h1>
            <p className="br-period-text">{periodLabels[period]}报告</p>
            <div className="br-summary-ring">
              <div className="br-ring">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#F0F0F0" strokeWidth="16"/>
                  {totalExpense+totalIncome>0 && (
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#E74C3C" strokeWidth="16"
                      strokeDasharray={`${(totalExpense/(totalExpense+totalIncome))*377} 377`} strokeLinecap="round"
                      transform="rotate(-90 70 70)"/>
                  )}
                </svg>
                <div className="br-ring-center">
                  <span className="br-ring-label">总支出</span>
                  <span className="br-ring-val">¥{totalExpense.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 收支总览 */}
          <div className="br-card">
            <h3>收支总览</h3>
            <div className="br-overview">
              <div className="br-ov-item expense"><span>支出</span><span>¥{totalExpense.toFixed(2)}</span></div>
              <div className="br-ov-item income"><span>收入</span><span>¥{totalIncome.toFixed(2)}</span></div>
              <div className="br-ov-item net"><span>结余</span><span>¥{(totalIncome-totalExpense).toFixed(2)}</span></div>
            </div>
          </div>

          {/* 支出TOP5 */}
          <div className="br-card">
            <h3>支出 TOP5</h3>
            {top5.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={top5} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                  <XAxis type="number" fontSize={11}/>
                  <YAxis type="category" dataKey="name" fontSize={12} width={50}/>
                  <Tooltip formatter={v=>`¥${Number(v).toFixed(2)}`}/>
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {top5.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ):<p className="br-none">无数据</p>}
          </div>

          {/* 成员对比 */}
          <div className="br-card">
            <h3>成员对比</h3>
            {memberPie.length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={memberPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name} ¥${value}`}>
                    {memberPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`¥${Number(v).toFixed(2)}`}/>
                </PieChart>
              </ResponsiveContainer>
            ):<p className="br-none">无数据</p>}
          </div>

          {/* 消费趋势 */}
          <div className="br-card">
            <h3>消费趋势</h3>
            {dailyTrend.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                  <XAxis dataKey="date" fontSize={10}/>
                  <YAxis fontSize={11}/>
                  <Tooltip formatter={v=>`¥${Number(v).toFixed(2)}`}/>
                  <Area type="monotone" dataKey="expense" stroke="#E74C3C" fill="#E74C3C20" name="支出"/>
                  <Area type="monotone" dataKey="income" stroke="#27AE60" fill="#27AE6020" name="收入"/>
                  <Legend/>
                </AreaChart>
              </ResponsiveContainer>
            ):<p className="br-none">无数据</p>}
          </div>

          {/* 趣味数据 */}
          <div className="br-card">
            <h3>趣味数据</h3>
            <div className="br-fun">
              <div className="br-fun-item">
                <span className="br-fun-emoji">🔥</span>
                <span className="br-fun-label">消费最高日</span>
                <span className="br-fun-val">{maxDay.date||'无'} ¥{maxDay.amount.toFixed(0)}</span>
              </div>
              <div className="br-fun-item">
                <span className="br-fun-emoji">📊</span>
                <span className="br-fun-label">最大支出类</span>
                <span className="br-fun-val">{maxCat.name} ¥{maxCat.value.toFixed(0)}</span>
              </div>
              <div className="br-fun-item">
                <span className="br-fun-emoji">📅</span>
                <span className="br-fun-label">日均支出</span>
                <span className="br-fun-val">¥{avgPerDay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
