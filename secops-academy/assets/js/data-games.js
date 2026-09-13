/* ============================================================
   data-games.js — 五个游戏的数据（零基础友好，带解析）
   ============================================================ */

/* ========== 1. 日志侦探：点击可疑行 ========== */
const LOG_ROUNDS = [
{
  title: '第 1 关 · 混进来的扫描器',
  hint: '业务服务器今天只有这些正常请求。点击你认为可疑的行（可多选），然后提交。',
  logs: [
    { raw: 'GET /index.html                        200  "Mozilla/5.0 Chrome"            10.2.1.55', bad: false },
    { raw: 'GET /products/list?page=2              200  "Mozilla/5.0 Chrome"            10.2.1.55', bad: false },
    { raw: 'GET /.env                              404  "python-requests/2.31"          45.83.66.10', bad: true, why: '探测 .env 配置文件（常含数据库密码），且 UA 是 python 脚本——典型扫描器。' },
    { raw: 'GET /about/team.html                   200  "Mozilla/5.0 Chrome"            10.2.1.55', bad: false },
    { raw: 'GET /phpmyadmin/                       404  "python-requests/2.31"          45.83.66.10', bad: true, why: '探测数据库管理后台路径，扫描器在"画地图"找入口。' },
    { raw: 'GET /static/logo.png                   200  "Mozilla/5.0 Chrome"            10.2.1.55', bad: false },
    { raw: 'GET /admin/login.php                   404  "python-requests/2.31"          45.83.66.10', bad: true, why: '批量探测管理后台。同一陌生 IP 连续探测敏感路径=踩点。' },
  ],
},
{
  title: '第 2 关 · 谁在搞注入？',
  hint: '下面请求里有正常浏览，也有 SQL 注入试探。点击所有可疑行。',
  logs: [
    { raw: "GET /news.php?id=5                     200  \"Mozilla/5.0 Chrome\"            10.2.1.77", bad: false },
    { raw: "GET /news.php?id=5%20OR%201=1          200  \"Mozilla/5.0 Chrome\"            45.83.66.10", bad: true, why: "解码后是 id=5 OR 1=1——恒真条件，SQL 注入试探的标志性写法。" },
    { raw: "GET /news.php?id=6                     200  \"Mozilla/5.0 Chrome\"            10.2.1.77", bad: false },
    { raw: "GET /news.php?id=6%20UNION%20SELECT%20password%20FROM%20users   200  \"Mozilla/5.0 Chrome\"   45.83.66.10", bad: true, why: "UNION SELECT 直接查密码表——注入升级为拖库，且返回 200，必须立即应急！" },
    { raw: "GET /news.php?id=7                     200  \"Mozilla/5.0 Chrome\"            10.2.1.77", bad: false },
    { raw: "GET /search?q=%27%20AND%20sleep(5)--   200  \"Mozilla/5.0 Chrome\"            45.83.66.10", bad: true, why: "sleep(5) 盲注探测：响应若明显变慢即注入成功。" },
  ],
},
{
  title: '第 3 关 · 爆破现场',
  hint: '登录接口的日志。找出"爆破"行为相关的所有可疑行。',
  logs: [
    { raw: 'POST /login  user=zhang  401  "10.2.1.90"', bad: false },
    { raw: 'POST /login  user=admin  401  "45.83.66.10"', bad: true, why: '陌生境外 IP 开始试 admin 账号。' },
    { raw: 'POST /login  user=zhang  401  "10.2.1.90"', bad: false },
    { raw: 'POST /login  user=admin  401  "45.83.66.10"', bad: true, why: '同一个陌生 IP 反复尝试 admin——爆破进行中。' },
    { raw: 'POST /login  user=zhang  401  "10.2.1.90"', bad: false },
    { raw: 'POST /login  user=admin  401  "45.83.66.10"', bad: true, why: '继续爆破（已第 143 次）。' },
    { raw: 'POST /login  user=admin  200  "45.83.66.10"', bad: true, why: '⭐ 最危险的一行：爆破成功（401 海洋中的一条 200）！立即封禁并核查该账号。' },
  ],
},
{
  title: '第 4 关 · 路径穿越与命令注入',
  hint: '找出包含攻击载荷的行。',
  logs: [
    { raw: 'GET /download?file=report.pdf                200  "10.2.1.60"', bad: false },
    { raw: 'GET /download?file=../../../../etc/passwd    200  "45.83.66.10"', bad: true, why: '../../ 层层上跳读密码文件——路径穿越，且返回 200 说明可能读到了！' },
    { raw: 'GET /download?file=manual_v2.pdf             200  "10.2.1.60"', bad: false },
    { raw: 'POST /tools/ping  host=127.0.0.1;whoami      200  "45.83.66.10"', bad: true, why: '分号拼接系统命令——命令注入，whoami 在试探当前权限。' },
    { raw: 'GET /download?file=faq.pdf                   200  "10.2.1.60"', bad: false },
  ],
},
{
  title: '第 5 关 · Webshell 就位了吗？',
  hint: '上传功能刚被用过。点击可疑行。',
  logs: [
    { raw: 'POST /upload/avatar      file=selfie.jpg   200  "10.2.1.71"', bad: false },
    { raw: 'POST /upload/avatar      file=readme.txt   200  "10.2.1.71"', bad: false },
    { raw: 'POST /upload/avatar      file=config1.php  200  "45.83.66.10"', bad: true, why: '上传 .php 脚本文件（业务只要图片）——Webshell 落地，且成功(200)！' },
    { raw: 'POST /upload/config1.php cmd=cat+/etc/passwd 200  "45.83.66.10"', bad: true, why: '直接 POST 到刚上传的 php 文件并带 cmd 参数——后门已在使用，最高级别告警！' },
    { raw: 'GET  /upload/selfie.jpg                    200  "10.2.1.71"', bad: false },
  ],
},
{
  title: '第 6 关 · 综合大考',
  hint: '一段混合日志。把所有可疑行都揪出来！',
  logs: [
    { raw: 'GET /index.html                          200  "Mozilla/5.0 Chrome"   10.2.1.55', bad: false },
    { raw: 'GET /robots.txt                          200  "python-requests/2.31" 45.83.66.10', bad: true, why: '扫描器第一步：看 robots.txt 摸清站点结构。' },
    { raw: 'GET /api/user?id=2                       200  "Mozilla/5.0 Chrome"   10.2.1.55', bad: false },
    { raw: 'GET /.git/config                         200  "python-requests/2.31" 45.83.66.10', bad: true, why: '探测 .git 目录——若成功可直接下载源码，且返回 200 很不妙。' },
    { raw: 'GET /api/user?id=2%20AND%201=1           200  "python-requests/2.31" 45.83.66.10', bad: true, why: '布尔盲注探测。' },
    { raw: 'POST /login  user=root  401  "45.83.66.10"', bad: true, why: '同源 IP 顺手开始爆破 root。' },
    { raw: 'GET /api/user?id=3                       200  "Mozilla/5.0 Chrome"   10.2.1.55', bad: false },
  ],
},
];

/* ========== 2. 钓鱼邮件判官 ========== */
const PHISHING_MAILS = [
{ phish: true, from: 'IT服务中心 <it-support@corp-secure-mail.cn>', subject: '【紧急】您的邮箱将在24小时后停用',
  body: '尊敬的用户：\n\n检测到您的邮箱存在异常登录，系统将在 24 小时后冻结您的账户。\n请立即点击下方链接，登录统一认证平台修改密码：\n\nhttp://corp-verify-mail.cn/owa/login\n\n（此邮件由系统自动发送，请勿回复）',
  attach: null, flags: ['制造紧迫（24小时停用）', '仿冒域名 corp-secure-mail.cn', '链接指向另一陌生域名', '"请勿回复"阻断核实'],
  explain: '四红旗齐中：紧迫话术 + 域名仿冒 + 链接域名不一致 + 阻止核实。正规 IT 永远不会用链接骗你改密码。' },
{ phish: false, from: '人事部-王莉 <wangli@mycompany.com>', subject: '关于五一放假安排的通知',
  body: '各位同事：\n\n今年五一放假时间为 5 月 1 日至 5 月 5 日，5 月 6 日（周三）正常上班。\n具体排班请见 OA 公告栏，如有问题可在工位直接找我。\n\n人事部 王莉',
  attach: null, flags: ['公司内部真实域名', '无紧迫话术', '不索要任何信息', '无链接无附件'],
  explain: '内容常规、域名正确、不诱导点击——正常邮件。' },
{ phish: true, from: '支付宝安全中心 <notice@alipay-security-center.tk>', subject: '您的账户存在风险交易，请立即验证',
  body: '尊敬的客户：\n\n我们监测到您的账户有一笔 4,999 元的可疑交易，已临时冻结。\n请点击链接验证身份，验证失败账户将被永久限制：\n\nhttp://alipay-safe.xyz/verify?uid=888888\n\n【支付宝安全中心】',
  attach: null, flags: ['仿冒域名（官方是 alipay.com，这是 .tk/.xyz 廉价域名）', '恐吓（永久限制）', '索要身份验证'],
  explain: '.tk/.xyz 廉价域名 + 冻结恐吓 + 假验证页。官方支付平台从不通过链接让你"验证身份"。' },
{ phish: false, from: 'GitHub <noreply@github.com>', subject: '[mycompany/api-server] Pull request #128 approved',
  body: 'Hi zhangwei,\n\nYour pull request #128 was approved by reviewer @dev-team-lead.\n\nView it on GitHub or check the CI status in your dashboard.\n\nYou are receiving this because you are subscribed to this thread.',
  attach: null, flags: ['真实官方域名 github.com', '与你正在进行的工作相关', '无索要信息无紧迫话术'],
  explain: '真实域名、内容与工作上下文匹配、无诱导操作——正常的开发通知邮件。' },
{ phish: true, from: '财务总监 陈总 <cfo@corpf-cfo.com>', subject: '紧急：供应商账户变更，今天下午前必须付款',
  body: '小林：\n\n我和客户在开一个敏感会议，不方便接电话，也不要告诉其他人。\n供应商（华信物流）更换了收款账户，附件是新的账户函。\n请务必在下午 3 点前完成 88 万的付款，否则项目违约！\n\n陈总',
  attach: '华信物流_新账户函.pdf (526KB)', flags: ['仿冒域名（多了一个 -cfo）', '紧迫（下午3点）', '阻止电话核实', '变更收款账户'],
  explain: '教科书级 BEC：仿冒域名 + 权威 + 紧迫 + 隔离核实渠道 + 变更收款账户。唯一动作：按合同电话回拨核实！' },
{ phish: true, from: '快递 <express@kuaidi-notify.com>', subject: '您的包裹因地址不详被滞留，点击处理退款',
  body: '您有一个包裹因地址不详滞留 3 天，即将退回。\n如需重新派送或申请运费赔付，请点击链接填写收件信息：\n\nhttps://kuaidi-refund2026.top/claim\n\n逾期未处理包裹将销毁。',
  attach: null, flags: ['陌生域名', '逾期恐吓', '诱导填写个人信息'],
  explain: '物流类钓鱼经典款：恐吓 + 收集个人信息/骗运费。真实快递问题去官方 APP 查单号即可。' },
{ phish: false, from: '公司IT自助平台 <no-reply@itsm.mycompany.com>', subject: '您的密码将在 7 天后过期',
  body: '您好：\n\n根据公司密码策略（90 天轮换），您的域账号密码将于 7 天后过期。\n请通过公司内网门户 itsm.mycompany.com 自助修改，或联系服务台（内线 8888）。\n\n提示：IT 人员任何时候都不会索要您的密码原文。',
  attach: null, flags: ['内部域名', '明确告知政策依据', '只引导内部门户，不塞外链', '主动声明不索要密码'],
  explain: '正规 IT 通知的样子：内网门户、政策依据、服务台电话，且明确"不会索要密码"。' },
{ phish: true, from: '招聘顾问 Lily <hr-recruit@job-elite-hr.cn>', subject: '恭喜进入终面！请下载面试系统并提前调试',
  body: '恭喜！您已进入我司终面环节。\n请下载附件"面试系统客户端.exe"并安装，明晚 8 点在线面试。\n\n为不影响录用评定，请在面试前完成安装并保持在线。',
  attach: '面试系统客户端.exe (12MB)', flags: ['诱导安装 exe', '未投过简历的"天上馅饼"', '紧迫话术'],
  explain: '"面试软件/会议软件.exe"是投递木马的高频伪装。正规公司用 Zoom/腾讯会议等公开软件，绝不会让你装不明 exe。' },
];

/* ========== 3. SOC 值班模拟器 ========== */
const SOC_SIM = {
  title: '周一早上的勒索警报',
  intro: '你是新上任的 SOC 值班分析师。周一 08:55，EDR 弹出一条 P1 告警……做对加分，做错扣分，最后看你拿到什么评价。',
  start: 's1',
  hp: 100,
  nodes: {
    s1: { scene: '⏰ 08:55 · EDR 告警\n\n财务部主机 FIN-03 检测到：powershell.exe 执行了带 -enc（Base64混淆）的命令，随后大量文件读取与写入行为，进程疑似正在批量修改文件后缀。\n\n你的第一步？', opts: [
      { t: '立即通过 EDR 隔离 FIN-03（断网，保留运行），并升级为 P1 事件', score: 25, fb: '✅ 教科书动作：EDR 隔离=断网禁机，既阻止加密共享盘/横向扩散，又保留内存证据。', next: 's2' },
      { t: '远程重启 FIN-03，重启能解决 90% 的问题', score: -20, fb: '❌ 重启销毁内存证据，且机器重新联网后攻击继续。隔离≠重启！', next: 's1b' },
      { t: '先观察 30 分钟，可能是杀毒误报', score: -15, fb: '❌ 批量改后缀+混淆PowerShell=勒索前兆，每等一分钟都在烧文件。', next: 's1b' },
    ]},
    s1b: { scene: '⚠️ 你错失了最佳遏制窗口。10 分钟后监控显示：共享盘出现大量 .locked 文件，攻击仍在继续。现在怎么办？', opts: [
      { t: '现在立刻隔离 FIN-03 并紧急断开文件服务器网络', score: 15, fb: '✅ 亡羊补牢：隔离感染源 + 保护共享存储。虽然损失已发生，但止损了。', next: 's2' },
      { t: '继续观察，等它"自己停"', score: -25, fb: '❌ 勒索软件不会自己停。此时每拖延都是真金白银的损失。', next: 's2' },
    ]},
    s2: { scene: '🛡️ FIN-03 已隔离。EDR 遥测显示：\n\n· 恶意进程仍尝试连接外部 IP 185.x.x.x:443（疑似C2）\n· 该主机今晨用域账号 CORP\\finadmin 登录过\n· 防火墙日志：另有 3 台主机与同一 C2 IP 有短暂连接\n\n下一步？', opts: [
      { t: '在防火墙封禁 C2 IP，对另外 3 台主机做排查，重置 finadmin 密码', score: 25, fb: '✅ 三连正确：掐 C2（掐指挥）、排查关联主机（摸排影响面）、重置可能泄露的凭据（断横向钥匙）。', next: 's3' },
      { t: '只处理 FIN-03，其他主机没告警就是没事', score: -20, fb: '❌ 同一 C2 出现在 3 台主机日志里=它们也在通信。勒索攻击的横向窗口通常按小时计。', next: 's2b' },
      { t: '全网关机，一了百了', score: -15, fb: '⚠️ 全网断电是最后手段（毁灭所有证据且业务全停），此时应有更精准的遏制手段。', next: 's3' },
    ]},
    s2b: { scene: '⚠️ 半小时后，其中一台主机 FS-02 的共享目录开始出现 .locked 文件……', opts: [
      { t: '立即隔离 FS-02，按既定流程继续排查其余主机', score: 15, fb: '✅ 止血优先，同时补上了该做的排查。教训已吸收。', next: 's3' },
    ]},
    s3: { scene: '📦 遏制基本完成：C2 已封，5 台可疑主机已隔离。现在要评估恢复方案：\n\n· 备份系统显示：昨晚 23:00 的离线备份完好\n· 业务方：生产系统每天损失约 80 万，催促"先恢复再说"\n· 攻击者勒索信：300 万，交钱立刻给解密器\n\n你的建议？', opts: [
      { t: '用离线备份恢复 + 验证无残留后逐步恢复业务，拒绝交赎金', score: 25, fb: '✅ 正确路径：备份是勒索的终极解药。恢复前要验证镜像干净（防"恢复即复发"）。交赎金不可控且涉法律风险，由管理层/法务依法决策，技术侧明确不建议。', next: 's4' },
      { t: '建议交赎金，300 万比停机损失小', score: -25, fb: '❌ 技术侧不该主动建议交赎金：解密器可能不可用/带毒，且资金直接资助犯罪。备份在手时更无理由。', next: 's3b' },
      { t: '直接把备份恢复到生产，业务要紧', score: -10, fb: '⚠️ 方向对但太急：若镜像中有残留持久化，恢复即复发。先在隔离环境验证。', next: 's4' },
    ]},
    s3b: { scene: '⚠️ 管理层追问"有没有不交钱的办法"，你重新评估了备份……', opts: [
      { t: '汇报：离线备份完好，恢复路径可行，无需考虑赎金', score: 15, fb: '✅ 用数据说话，把决策拉回正确轨道。', next: 's4' },
    ]},
    s4: { scene: '📋 恢复进行中。CISO 要求你提交事件初步报告。以下哪个要素"不该"出现在报告里？', opts: [
      { t: '完整时间线：从 08:55 告警到恢复的每个动作与时间', score: 25, fb: '✅ 时间线必须有——它是报告的骨架。那"不该出现的"是：对个人的指责。报告是给改进用的，不是批斗材料。', next: 'end' },
      { t: '影响面：5 台主机、共享盘 1.2TB 数据受影响', score: 25, fb: '✅ 影响面必须量化。不过题目问的是"不该出现的"——再选选看。', next: 's4' },
      { t: '"HR 员工张三安全意识差，建议处罚"', score: -15, fb: '✅ 抓到了！Blameless（无责）复盘是行业共识：追系统与流程为何没拦住，而不是处罚个人——否则下次没人敢说真话。', next: 'end' },
    ]},
  },
  ranks: [
    { min: 90, r: 'S', txt: 'SOC 之星！流程肌肉记忆满分，任何事故到你手里都先"隔离再说话"。' },
    { min: 70, r: 'A', txt: '优秀分析师：大方向全对，个别动作可以更快更准。' },
    { min: 50, r: 'B', txt: '合格值班生：能止血，但关键动作慢半拍——把 PICERL 再背一遍。' },
    { min: 0,  r: 'C', txt: '建议回炉：记住三句话——隔离不关机、先摸影响面、备份是解药。' },
  ],
};

/* ========== 4. 极速分诊 ========== */
const TRIAGE_ITEMS = [
  { t: '凌晨 02:00，管理后台同一 IP 出现 600 次登录失败', real: true, why: '深夜+高频失败=爆破，典型真实威胁。' },
  { t: '市场部每月 1 号定时批量外发客户报告（带附件）', real: false, why: '固定节奏的固定业务，误报。加入白名单。' },
  { t: '服务器新增计划任务，内容为下载并执行远程脚本', real: true, why: '计划任务+远程下载执行=经典持久化，高危。' },
  { t: 'VPN 用户早上 9 点从公司常用 IP 登录', real: false, why: '时间、地点、设备均符合基线，正常。' },
  { t: '某账号 5 分钟前在北京登录，现在在境外登录', real: true, why: '时空矛盾=账号被盗的高置信度证据。' },
  { t: '安全团队自己用扫描器做月度漏扫', real: false, why: '自家扫描是正常安全活动（前提：已报备）。' },
  { t: 'Web 目录突然多出 shell.php 且被频繁 POST', real: true, why: 'Webshell 落地并使用中，P1！' },
  { t: '某用户访问公司官网首页', real: false, why: '……这就是正常上网。' },
  { t: '数据库服务器对外连接 3333 端口，流量巨大', real: true, why: '矿池端口+异常流量=挖矿木马特征。' },
  { t: '办公电脑 CPU 100%，因为正在进行季度渲染渲染任务', real: false, why: '有明确业务解释的资源占用——先核实再定性。' },
  { t: 'EDR 检测到 PowerShell 带 -enc 参数执行 Base64 命令', real: true, why: '混淆执行=无文件攻击惯用手法，高度可疑。' },
  { t: '新上线服务器的健康检查探针每 5 分钟访问一次', real: false, why: '固定频率+已知来源=基线内行为。' },
  { t: '~/.ssh/authorized_keys 出现陌生公钥', real: true, why: 'SSH 后门！等于小偷装了自己的锁。' },
  { t: '用户 A 在午休时间访问了工作所需的内网 Wiki', real: false, why: '完全正常。' },
  { t: '财务主机向外发送 2GB 数据至陌生境外网盘', real: true, why: '敏感主机+大流量+陌生目的地=疑似数据外泄。' },
  { t: '周日服务器自动执行数据库备份任务', real: false, why: '例行的备份窗口，误报。' },
  { t: 'HR 电脑在查看"简历.pdf.exe"后出现陌生外联', real: true, why: '双后缀附件+随后外联=钓鱼→木马上线。' },
  { t: '打印机队列日志出现打印任务', real: false, why: '打印机在打印，属于它的本职工作。' },
];

/* ========== 5. 密码工坊 ========== */
const PWD_COMMON = ['123456','123456789','12345678','12345','1234567','1234567890','password','qwerty','abc123','111111','123123','admin','admin123','letmein','welcome','monkey','dragon','football','iloveyou','password1','qwerty123','000000','654321','123321','666666','888888','88888888','a123456','123qwe','qwe123','1qaz2wsx','1q2w3e4r','woaini','5201314','zhangwei','wang123','root','toor','test','guest','passw0rd','p@ssw0rd','abcd1234','asd123','aa123456','abc123456','1234qwer','qazwsx','147258369','987654321','asdfgh','zxcvbnm','123465','112233','121314','123abc','12341234','1234554321','8613793','1q2w3e','qwertyuiop','asdfghjkl','iloveyou1','sunshine','princess','charlie','shadow','michael','jennifer','11111111','121212','1230123','456789','789456','159357','753951','159753','1990','1991','1992','1998','2000','2001'];

const PWD_SEQUENCES = ['qwerty','asdf','zxcv','1234','4321','abcd','qaz','wsx','edc','pass','qwer','haha','love','god','fuck','hack','root','admin','test'];
