# Us Ledger — 双人记账 PWA

情侣/伴侣共同管理财务的记账应用。双账号真实认证，账单 Supabase 云端同步 + localStorage 离线降级，支持三视角切换（我/TA/共同）。

## 技术栈

React 19 + TypeScript + Vite 8 + Supabase Auth/DB + recharts + Lucide Icons

## 认证体系

- **Supabase Auth** — 手机号+密码注册/登录（phone → `p{phone}@us.internal` 邮箱映射，免 OTP）
- **Session 管理** — 启动时自动校验，过期自动续期，5分钟缓冲
- **情侣绑定** — 6位邀请码 + 7天有效期，服务端生成/核验，双向绑定/解绑
- **RLS 策略** — bills 表按 user_id + couples 关系控制可见性

## 数据架构

- **Supabase 主存储** — 账单通过 RLS 策略实现跨设备同步
- **localStorage 降级** — Supabase 不可用时自动切换，网络恢复后合并同步
- **离线队列** — 断网时记账入队，恢复联网自动同步（`syncQueue`）
- **双写合并** — `fetchBills` 同时读取 Supabase + localStorage，以 ID 去重合并

## 功能

### 启动与认证
- Splash 启动页（品牌展示 + Session 校验 + 自动登录/续期）
- 手机号登录/注册页（密码模式，Supabase Auth）
- 微信登录（开发模式，模拟 token）
- 邀请码绑定伴侣（注册时填写，服务端核验）

### 主页
- 三视角卡片（我的/TA的/共同）+ 左右滑动 + 箭头切换
- "共同"视角为聚合视图，显示全部可见账单
- 视角切换联动卡片金额（支出/收入/结余按视图过滤）
- 月份选择器（年/月滚轮，不能选未来月份）
- 金额显隐 + 滚动动画
- 账单行左滑编辑/删除 + 点击查看详情
- 下拉刷新（>60px 触发 + 3秒冷却）+ 离线提示
- 空状态点击快捷记账
- 未绑定伴侣时顶部横幅提示

### 记账（AddRecord）
- 金额校验 + 分类必选 + 红色抖动提示
- 成员选择（我/TA/共同），伴侣未绑定时"TA"锁定
- 数字键盘 + 收支切换 + 分类网格
- 账户选择器（底部弹出含余额）
- 日期时间选择器（不可选未来）
- 备注输入 + @提及伴侣快捷插入
- 离线时自动入队，联网后同步

### 账单页（Bills）
- 筛选抽屉（成员/分类/金额/账户，80%宽）
- 搜索防抖 300ms + 匹配高亮
- 收支切换标签
- 排序切换（时间/金额/分类）
- 左滑编辑删除
- 统计栏（月结余 + 日均支出）

### 报表页（Reports）
- 日历视图（日期点击展开/收起 + 左右滑动切月 + 今日高亮 + 选中绿色圆形标记）
- 三种图表：饼图（分类占比）/ 面积图（每日趋势）/ 柱状图（成员对比）
- 筛选抽屉（按成员/类型过滤，日历图表联动）
- 图表下钻 + 二级分类明细
- 图表分享（保存图片/系统分享）

### 资产页（Assets）
- 账户列表 + 添加/编辑/删除
- 余额调整 + 调整记录

### 个人中心（Profile）
- 情侣资料页（头像/昵称编辑 + 记账天数 + 统计）
- 邀请码生成/复制/分享 + 加入空间（输入邀请码）
- 解绑二次确认
- 功能入口：收支分类 / 多账本 / 预算 / 存钱 / 购物清单 / 标签 / 汇率 / 小工具
- 账单/资产入口：账单管理 / 定时记账 / 账单报告 / 资产 / 外卖订单 / 物品管理 / 订阅管理
- 记账偏好：设置默认记账人和默认收支类型（localStorage 持久化）
- 个性化：5主题色 + 3档字体 + 深色模式三选一（浅色/深色/跟随系统）+ 实时预览

### 设置页（Settings）
- 伴侣管理：绑定管理 / 对方权限设置 / 共同数据可见性
- 通知设置：记账提醒 / 预算预警 / 伴侣通知 / 日报周报（开关持久化）
- 同步方式：实时同步 / 仅WiFi / 手动同步 + 手动同步按钮
- 数据管理：备份（JSON下载）/ 恢复（文件上传）/ 导出CSV / 清空数据
- 账户安全：修改密码（Supabase Auth）/ 绑定手机 / 微信绑定 / Apple ID 绑定
- 快捷指令 / 帮助中心 / 联系客服（模拟对话） / 官方媒体 / 分享 / 关于
- 注销账号（二次确认 + 清除数据 + 退出登录）
- 退出登录

### 辅助工具
- 汇率换算（12币种 + 双向兑换）
- 小工具箱（折扣计算 + AA分摊 + 分期计算）
- 购物清单（添加/编辑/删除 + 购买勾选 + 预估/实际价格）
- 存钱计划（目标设定 + 进度条 + 达成动画）

## 设计规范

| 用途 | 色值 |
|------|------|
| 主色（薄荷绿） | #A8D5BA |
| 辅色（暖橙） | #F4A261 |
| 强调色（淡紫） | #C8B6E2 |
| 背景 | #F8F9FA |
| 文字 | #2D3436 |
| 支出 | #E74C3C |
| 收入 | #27AE60 |

## 怎么跑

```bash
npm install
npm run dev      # 开发服务器 (Vite)
npm run build    # 构建生产包
npm run preview  # 预览生产包
```

## 项目结构

```
src/
├── lib/
│   ├── auth.ts              # Supabase Auth Session 管理
│   ├── api.ts               # API 请求封装（Token 拦截器）
│   ├── supabase.ts          # Supabase 客户端
│   ├── bills.ts             # 账单 CRUD（Supabase + localStorage 双写/合并）
│   ├── accounts.ts          # 账户管理
│   ├── couple.ts            # 情侣系统（localStorage 缓存 + Supabase 桥接）
│   └── couple-supabase.ts   # 情侣系统 Supabase 服务端操作
├── pages/
│   ├── Splash.tsx            # 启动页
│   ├── LoginPage.tsx         # 登录页（微信/手机号入口）
│   ├── PhoneLogin.tsx        # 手机号登录页
│   ├── PhoneRegister.tsx     # 手机号注册页（含邀请码步骤）
│   ├── ThemeSelect.tsx       # 主题引导页
│   ├── Home.tsx              # 主页（三视角卡片+账单列表）
│   ├── Bills.tsx             # 账单页（筛选/搜索/排序）
│   ├── Reports.tsx           # 报表页（日历/图表/下钻）
│   ├── Profile.tsx           # 个人中心（情侣资料/功能入口）
│   ├── AddRecord.tsx         # 记账弹窗
│   ├── Settings.tsx          # 设置页
│   ├── SettingsSubPages.tsx  # 设置子页面（快捷指令/帮助/客服/媒体/分享/关于）
│   ├── Assets.tsx            # 资产管理
│   ├── BillDetail.tsx        # 账单详情
│   ├── BillReport.tsx        # 账单报告
│   ├── MonthPicker.tsx       # 月份选择器
│   ├── BillingPreferences.tsx # 记账偏好
│   ├── CategoryManager.tsx   # 收支分类管理
│   ├── BudgetManager.tsx     # 预算管理
│   ├── LedgerManager.tsx     # 多账本管理
│   ├── TagManager.tsx        # 标签管理
│   ├── ScheduledTasks.tsx    # 定时记账
│   ├── SavingPlan.tsx        # 存钱计划
│   ├── ShoppingList.tsx      # 购物清单
│   ├── ExchangeRate.tsx      # 汇率换算
│   ├── Toolbox.tsx           # 小工具箱
│   ├── Personalization.tsx   # 个性化设置
│   ├── FoodOrders.tsx          # 外卖订单管理
│   ├── ItemManager.tsx         # 物品管理
│   └── SubscriptionManager.tsx # 订阅管理
├── components/
│   └── DynamicIsland.tsx     # 底部导航栏
└── main.tsx                  # 入口

supabase/
└── migrations/
    ├── 001_create_bills.sql          # bills 表 + RLS 策略
    ├── 002_create_couples.sql        # couples/invite_codes 表 + 伴侣 RLS
    ├── 003_fix_book_id_nullable.sql   # 修复 book_id NOT NULL 约束
    ├── 004_drop_bills_user_id_fkey.sql # 删除冗余外键约束
    └── 005_consolidated_partner_visibility.sql # 合并迁移（幂等）
```

## 状态

🟢 进行中
