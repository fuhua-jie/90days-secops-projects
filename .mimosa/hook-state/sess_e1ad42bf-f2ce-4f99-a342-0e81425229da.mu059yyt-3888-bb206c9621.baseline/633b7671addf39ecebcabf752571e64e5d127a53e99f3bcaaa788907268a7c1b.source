/* ============================================================
   data-plan-mid.js — 模块 9 · 中级安全运营 · 进阶实战
   Windows深入 / 威胁情报 / Sigma / 误报治理 / 应急实战 /
   漏洞管理 / 设备运营 / HVV / 报告交接 / 考证路径
   ============================================================ */
(function () {
  MODULES.push({
    id: 9, ico: '🎯', name: '中级安全运营 · 进阶实战', color: 'am',
    desc: '从"盯告警"到"能独立处置"：Windows 深入、威胁情报、Sigma 检测、误报治理、双平台应急、漏洞与设备运营、攻防演练',
    minutes: 1400,
  });

  const L = [];
  const add = (o) => L.push(o);

  /* ---------- Windows 深入 ---------- */
  add({
    id: 'mid-01', module: 9, ico: '🪟', title: 'Windows 安全深入：事件日志体系与 Sysmon',
    subtitle: '从"认识事件 ID"到"能写检测规则"——中级 Windows 的日常', minutes: 55, tags: ['Windows', 'Sysmon', '中级'],
    content: [
      { type: 'p', html: '初级你背了事件 ID；中级要能<b>组合事件还原攻击链</b>，并知道企业怎么把 Windows 日志"变强"。' },
      { type: 'h', text: '攻击链 = 事件 ID 的组合拳' },
      { type: 'table', head: ['攻击动作', '事件组合', '检测思路'], rows: [
        ['RDP 爆破得手', '4625×N → 4624 (Type10)', '同源失败后紧跟成功，且 Type=10'],
        ['哈希传递', '4624 (Type9) + 4672', 'Type9 特权登录，来源非本机'],
        ['新建后门服务', '4688 (psexec) + 7045', '服务名 psexesvc / 随机名'],
        ['提权到管理组', '4728/4732/4756', '非计划内账号加入管理组'],
        ['灭迹', '1102 + 4688 (wevtutil)', '清日志命令与 1102 同现'],
      ]},
      { type: 'code', text: '# KQL/Elastic 例子：RDP 爆破成功检测\nevent.code:4624 and winlog.event_data.LogonType:10\nand winlog.event_data.IpAddress:* and not source.ip:10.0.0.0/8' },
      { type: 'h', text: 'Sysmon：遥测增强的标准答案' },
      { type: 'ul', items: [
        '<b>Event 1</b> 进程创建（含命令行+哈希）——检测命令行的主力',
        '<b>Event 3</b> 网络连接（进程级外联）——C2 回连检测',
        '<b>Event 7</b> 镜像加载——检测 DLL 注入/白加黑',
        '<b>Event 8/10</b> 线程注入 / ProcessAccess——检测凭据转储（摸 LSASS）',
        '配置起步：SwiftOnSecurity sysmon-config，按环境裁剪',
      ]},
      { type: 'callout', ico: '⚡', kind: 'tip', title: 'PowerShell 日志', html: '无文件攻击最爱 PowerShell。开启 <b>Module Logging(4103) + Script Block Logging(4104)</b>，能拿到"解混淆后"的脚本原文——检测 -enc 混淆命令的关键。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '练习', html: '站内「日志侦探」Windows 三案 + 「CTF 攻防」的 4625 爆破/计划任务剧本，就是本课的实操场。' },
    ],
    takeaways: ['攻击链=事件ID组合，检测思路是"组合+时序"', 'Sysmon 1/3/7/10 覆盖进程/网络/注入/凭据四类检测', '开启 4104 才能抓到解混淆后的 PowerShell'],
    checks: [
      { q: 'Sysmon Event 3 记录的是？', opts: ['进程创建', '网络连接', '注册表修改', '剪贴板'], a: 1, ex: 'Event 3 = 网络连接，带进程信息，是 C2 外联检测主力。' },
      { q: '检测哈希传递最直接的事件特征？', opts: ['4624 LogonType=9', '4625', '7045', '1102'], a: 0, ex: 'Type 9 (NewCredentials) + 特权登录 4672 是 PTH 标志组合。' },
    ],
  });

  /* ---------- 威胁情报 ---------- */
  add({
    id: 'mid-02', module: 9, ico: '🕵️', title: '威胁情报实战：从 IOC 到情报驱动运营',
    subtitle: 'IOC/IOA · 情报源 · 富化与落地 · STIX/TAXII 概念', minutes: 50, tags: ['威胁情报', 'IOC', '中级'],
    content: [
      { type: 'p', html: '威胁情报 = "别人踩过的坑"变成你的"预警清单"。中级的你每天都在用它：告警研判、封禁决策、狩猎线索全靠情报。' },
      { type: 'h', text: '概念一分钟' },
      { type: 'table', head: ['术语', '是什么', '例子'], rows: [
        ['IOC 失陷指标', '可机器比对的确凿证据', '恶意 IP/域名/文件哈希'],
        ['IOA 攻击指标', '行为意图（比 IOC 更早）', 'Word 拉起 PowerShell'],
        ['TTP 战术技术过程', '攻击者的打法', 'ATT&CK T1110 爆破'],
        ['STIX/TAXII', '情报格式/传输标准', '机器可读情报订阅'],
      ]},
      { type: 'h', text: '免费情报源（日常必备）' },
      { type: 'ul', items: [
        '<b>Abuse.ch</b>：Feodo Tracker（C2）/ URLhaus（恶意URL）/ ThreatFox（IOC 检索）',
        '<b>VirusTotal</b>：哈希/IP/域名信誉与关联样本',
        '<b>微步在线 X / 奇安信 TI</b>：国内 IP 与样本情报，告警研判日常查询',
        '<b>ATT&CK / 各厂商年度报告</b>：TTP 层面情报，指导狩猎方向',
      ]},
      { type: 'h', text: '情报落地的三种方式' },
      { type: 'ul', items: [
        '<b>封禁</b>：高置信 IOC 直接进防火墙/WAF 黑名单（注意白名单误伤）',
        '<b>回溯</b>：新情报到手，先查"过去 30 天我有没有中过"（日志回溯狩猎）',
        '<b>富化</b>：告警自动附加情报标签（GeoIP/信誉/家族），让 Tier 1 秒判',
      ]},
      { type: 'callout', ico: '⚖️', kind: 'warn', title: '置信度纪律', html: 'IOC 有时效性（C2 三天一换）。封禁前看<b>置信度+影响面</b>：低置信 IP 只加监控，高置信才封；CDN/大厂 IP 段永远先过白名单。' },
    ],
    takeaways: ['IOC=证据，IOA=行为，TTP=打法，三层情报逐级提前', '情报落地三招：封禁、回溯、富化', '封禁看置信度与影响面，白名单先过'],
    checks: [
      { q: '拿到新 C2 情报后最有价值的动作？', opts: ['只加黑名单', '回溯过去 30 天自己日志有没有连过', '转发朋友圈', '不管它'], a: 1, ex: '回溯能发现"已经中招但没被发现"的失陷主机——情报的最大价值。' },
      { q: 'IOC 的正确用法不包括？', opts: ['告警富化', '防火墙封禁', '日志回溯', '当永久真理不再更新'], a: 3, ex: 'IOC 有强时效性，需要持续更新与过期下线。' },
    ],
  });

  /* ---------- Sigma ---------- */
  add({
    id: 'mid-03', module: 9, ico: '📐', title: 'Sigma 规则与检测工程入门',
    subtitle: '写一份"通用型"检测规则 · YAML 语法 · 转换成 SIEM 查询', minutes: 50, tags: ['Sigma', '检测工程', '中级'],
    content: [
      { type: 'p', html: 'Sigma 是检测规则的"普通话"：一份 YAML，可转成 Elastic/Splunk/Splunk/QRadar 查询。学会它，你的检测经验能跨平台复用。' },
      { type: 'h', text: '一份 Sigma 长这样' },
      { type: 'code', text: 'title: 可疑 PowerShell 下载行为\nid: 3b3ed5f0-xx  status: experimental\nlogsource:\n    product: windows\n    service: sysmon\ndetection:\n    selection:\n        EventID: 1\n        Image|endswith: \'\\powershell.exe\'\n        CommandLine|contains:\n            - \'DownloadString\'\n            - \'Invoke-WebRequest\'\n            - \'-enc\'\n    condition: selection\ntags: [attack.t1059.001]\nfalsepositives: 运维脚本（需白名单）\nlevel: high' },
      { type: 'ul', items: [
        '<b>logsource</b>：日志来自哪（product/service/category）',
        '<b>detection</b>：selection 定义匹配条件，condition 组合（selection / selection1 and selection2 / filter 排除）',
        '<b>字段修饰符</b>：contains / endswith / re(正则) / base64offset',
        '<b>level 与 tags</b>：level 定级，tags 挂 ATT&CK 技术编号',
      ]},
      { type: 'h', text: '转换与落地' },
      { type: 'code', text: '# sigma-cli 转换为 Elastic 查询\nsigma convert -t lucene -p elastic_ecs rule.yml\n# 官方规则库（学习范例）：\n# github.com/SigmaHQ/sigma  → rules/windows/...' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '检测工程思维', html: '每条规则三问：<b>抓什么攻击（对齐 T 编号）？什么会误报（写进 falsepositives）？漏了什么变体（持续迭代）？</b>——这就是中级到高级"检测工程"的起点。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '练习', html: '把 92 天计划 Day 30 的"攻击特征手册"挑三条改写成 Sigma——写完你会对"规则 vs 日志字段"的理解上一个台阶。' },
    ],
    takeaways: ['Sigma=YAML 写规则，一份转换多平台', 'detection=selection+condition，字段修饰符控制匹配方式', '规则三问：抓什么/误报是什么/漏了什么'],
    checks: [
      { q: 'Sigma 的 falsepositives 字段的作用？', opts: ['装饰', '记录已知误报场景供调优排除', '必填作者', '加密'], a: 1, ex: '误报场景写清楚，落地时才能精确加白名单而不放走攻击。' },
      { q: '字段后缀 |contains 表示？', opts: ['精确等于', '包含该子串', '正则', '取反'], a: 1, ex: 'contains=包含匹配；endswith/re 等修饰符扩展匹配方式。' },
    ],
  });

  /* ---------- 误报治理 ---------- */
  add({
    id: 'mid-04', module: 9, ico: '📉', title: '告警运营与误报治理',
    subtitle: '用例开发流程 · 调优方法论 · 白名单的艺术 · SLA', minutes: 45, tags: ['误报', '调优', '中级'],
    content: [
      { type: 'p', html: '中级与初级的分水岭：初级"处理告警"，中级"治理告警"。让告警又准又少，是团队效率的最大杠杆。' },
      { type: 'h', text: '用例开发五步（每条规则的出生证明）' },
      { type: 'ul', items: [
        '<b>需求</b>：对齐 ATT&CK 技术，明确"抓什么"',
        '<b>编写</b>：Sigma/查询规则 + 数据源确认（日志真的在采集吗？）',
        '<b>测试</b>：红队/历史数据回放，验证能触发',
        '<b>调优</b>：统计一周误报，加白名单/阈值/排除条件',
        '<b>运维</b>：写用例文档（规则/误报/处置手册），定期回顾',
      ]},
      { type: 'h', text: '误报治理三板斧' },
      { type: 'table', head: ['手段', '做法', '例子'], rows: [
        ['精确白名单', '按"字段+值"排除，不是按"整条规则关闭"', '排除 scanner_ip 的 404，只对其他 IP 告警'],
        ['阈值与基线', '绝对阈值改"相对基线偏离"', '404 基线 50/h，超 10 倍才告警'],
        ['规则分级', '低置信只入库狩猎，高置信才弹告警', '情报低置信 IP 只记录'],
      ]},
      { type: 'callout', ico: '⚖️', kind: 'warn', title: '白名单的艺术', html: '白名单三原则：<b>最小化（按字段值不加整条）、有注释（谁加的为什么）、定期复审</b>（每季度清一次）。失控的白名单是最大的隐形后门。' },
      { type: 'callout', ico: '⏱️', kind: 'tip', title: 'SLA 参考', html: 'P1 告警 15 分钟响应、P2 30 分钟、P3 当日——响应超时也是"事故"，中级要能把 SLA 落到值班表。' },
    ],
    takeaways: ['用例五步：需求→编写→测试→调优→运维（文档）', '误报治理三板斧：精确白名单/阈值基线/规则分级', '白名单最小化+有注释+季度复审'],
    checks: [
      { q: '一条规则误报太多，最差的处置是？', opts: ['分析原因精确加白', '直接把规则关掉', '降低告警级别观察', '改阈值'], a: 1, ex: '关规则=放走真攻击；正确姿势是精确排除误报源。' },
      { q: '白名单应该按什么粒度加？', opts: ['整条规则关闭', '按字段+值最小化', '按网段全放', '按时间段全放'], a: 1, ex: '最小化白名单才能在消误报的同时保住检测能力。' },
    ],
  });

  /* ---------- Linux 应急实战 ---------- */
  add({
    id: 'mid-05', module: 9, ico: '🐧', title: '应急响应实战（Linux）：入侵排查全流程',
    subtitle: '从"好像被黑了"到"完整处置报告"的真实顺序', minutes: 55, tags: ['应急', 'Linux', '实战'],
    content: [
      { type: 'p', html: '接到"服务器疑似被黑"，中级要在 30 分钟内完成初步排查并给出结论。以下是经过实战检验的顺序。' },
      { type: 'h', text: '第 0 步：固定证据（动手前）' },
      { type: 'code', text: '# 快照/克隆磁盘；至少：\nps auxf > /tmp/ps.txt; ss -antp > /tmp/ss.txt\nlsof -i > /tmp/lsof.txt; crontab -l > /tmp/cron.txt\ncp /var/log/* /tmp/evidence_logs/ -r' },
      { type: 'h', text: '第 1 步：入口排查（怎么进来的）' },
      { type: 'code', text: 'grep -E "Accepted|Failed" /var/log/secure | tail -50   # SSH 登录\nlast -20; lastb -20                                    # 登录历史与失败\n# 新增账号/公钥\nawk -F: \'$3==0\' /etc/passwd; cat /root/.ssh/authorized_keys' },
      { type: 'h', text: '第 2 步：驻留排查（怎么留下来的）' },
      { type: 'code', text: 'crontab -l; ls -la /etc/cron.d/\nsystemctl list-unit-files --state=enabled; systemctl list-timers\nfind / -perm -4000 -type f 2>/dev/null        # SUID\nfind / -mtime -3 -type f 2>/dev/null | grep -vE "proc|sys"   # 近3天新文件\nls -la /root/.ssh/ /home/*/.ssh/ 2>/dev/null' },
      { type: 'h', text: '第 3 步：外联与挖矿特征' },
      { type: 'code', text: 'ss -antp | grep ESTAB | grep -vE "10\\.|127\\."\ntop -b -n1 | head -15          # kdevtmpfsi/xmrig 类进程\ncat /tmp/ps.txt | grep -iE "xmrig|miner|kdev"' },
      { type: 'callout', ico: '📋', kind: 'tip', title: '产出模板', html: '排查报告六要素：<b>时间线（何时/如何进入）→ 影响面（哪些主机/数据）→ IOC 清单（IP/哈希/域名）→ 已处置动作 → 待办（补丁/改密）→ 教训与加固项</b>。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '演练', html: '站内「实战靶场」30 关 = 本课的模拟考；「护网模拟器」练的是全流程指挥。' },
    ],
    takeaways: ['第0步固定证据，之后才动手排查', '入口(登录)与驻留(持久化五处)是两条主线', '报告六要素：时间线/影响面/IOC/已处置/待办/加固'],
    checks: [
      { q: '应急第一步为什么是"固定证据"而不是杀进程？', opts: ['杀进程会丢内存与连接证据', '杀进程太难', '留给攻击者时间', '没必要'], a: 0, ex: '进程、外联、内存是**一次性证据**，杀掉就没了——先快照再处置。' },
      { q: 'find / -mtime -3 的排查意图？', opts: ['找三天前的文件', '找近三天新增/修改文件（落地的工具与马）', '找大文件', '找压缩包'], a: 1, ex: '入侵者投递的工具/马必然是"新文件"，时间窗过滤是快速定位法。' },
    ],
  });

  /* ---------- Windows 应急/勒索 ---------- */
  add({
    id: 'mid-06', module: 9, ico: '🪟', title: '应急响应实战（Windows）：排查清单与勒索处置',
    subtitle: '进程/服务/自启/注册表 · Autoruns · 勒索与蠕虫的处置顺序', minutes: 55, tags: ['应急', 'Windows', '勒索'],
    content: [
      { type: 'p', html: 'Windows 应急的难点是"藏的地方多"。这份清单覆盖 90% 的场景，最后讲清楚<b>勒索攻击的正确处置顺序</b>（很多团队第一步就做错）。' },
      { type: 'h', text: '排查清单（按驻留点）' },
      { type: 'table', head: ['驻留点', '排查方式'], rows: [
        ['进程/服务', 'Process Explorer（验证签名+查看进程链）+ services.msc'],
        ['自启动全家', 'Autoruns（勾选 Hide Microsoft Entries，剩下的逐个看）'],
        ['计划任务', 'schtasks /query + 事件 4698'],
        ['注册表 Run', 'HKCU\\...\\Run / HKLM\\...\\Run / RunOnce'],
        ['WMI 订阅', 'Autoruns WMI 标签（无文件持久化重灾区）'],
        ['账号与组', 'lusrmgr + 事件 4720/4728/4732'],
        ['近期行为', '事件 4688 进程链 + 1102（清日志=实锤）'],
      ]},
      { type: 'h', text: '勒索攻击处置顺序（背下来）' },
      { type: 'code', text: '① 隔离：拔网线（不断电！内存里的密钥/进程可能还有救）\n② 判定：加密范围 + 留言信 + ID 上传（识别家族，no more ransom 项目可查解密器）\n③ 取证：卷影副本是否还在（vssadmin list shadows）\n④ 止血：全网阻断传播（SMB/共享/口令），排查 patient zero\n⑤ 恢复：优先离线备份；卷影/解密器为辅；绝不建议交赎金\n⑥ 复盘：入口大概率是弱口令RDP/钓鱼/未修补漏洞' },
      { type: 'callout', ico: '🚫', kind: 'warn', title: '两个常见错误', html: '① 直接关机/重启 → 丢内存证据。② 急着重装 → 不知道入口，下周再中一次。<b>先隔离取证，再谈恢复。</b>' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '演练', html: '站内「SOC 值班室」的勒索剧情 + 「CTF 攻防」勒索剧本（svhost 加密 + vssadmin 删卷影）就是本课的双人演练场。' },
    ],
    takeaways: ['Autoruns 一站式看清所有 Windows 驻留点', '勒索处置：隔离→判定→取证→止血→恢复，不交赎金', 'vssadmin list shadows 是勒索恢复的第一希望'],
    checks: [
      { q: '确认勒索加密后第一动作？', opts: ['重启杀毒', '拔网线隔离（不断电）', '全盘格式化', '交赎金'], a: 1, ex: '隔离防扩散+保内存证据；重启会丢失加密进程等关键信息。' },
      { q: '勒索恢复的优先顺序？', opts: ['交赎金→解密', '离线备份→卷影→解密器', '重装系统', '等攻击者解密'], a: 1, ex: '离线备份永远第一；nomoreransom.org 可查已知家族解密器。' },
    ],
  });

  /* ---------- 漏洞管理 ---------- */
  add({
    id: 'mid-07', module: 9, ico: '🩹', title: '漏洞管理运营：从扫描器到补丁闭环',
    subtitle: '漏洞生命周期 · CVSS · Nessus 实操 · 补丁策略与例外管理', minutes: 50, tags: ['漏洞管理', 'Nessus', '中级'],
    content: [
      { type: 'p', html: '漏洞管理是安全运营的"例行体检"：发现（扫描）→ 评估（定级）→ 处置（补丁/缓解）→ 复测 → 报告。做的好坏直接决定护网成绩。' },
      { type: 'h', text: '生命周期与优先级' },
      { type: 'ul', items: [
        '<b>优先级 ≠ CVSS 分数</b>：CVSS 基础分 + 资产重要性 + 是否有 EXP 在野利用（KEV）+ 暴露面（是否互联网可达）',
        '互联网高危且在野利用 → <b>7 天内修</b>；内网中危 → 30 天；低危纳入例行窗口',
      ]},
      { type: 'h', text: 'Nessus 实操（OpenVAS 同理）' },
      { type: 'code', text: '新建扫描 → 选模板：Basic Network Scan / Web App Tests\n目标：网段或资产清单 → 调度每周跑\n报告重点看：Critical/High + 可远程利用项\n误报处理：对照版本号手动验证（nmap -sV / 访问特征路径）' },
      { type: 'h', text: '补丁策略与例外管理' },
      { type: 'table', head: ['情形', '策略'], rows: [
        ['有补丁且可停机', '测试环境验证 → 灰度 → 全量'],
        ['不能停机/无法补', '虚拟补丁（WAF 规则）+ 缓解措施 + 例外登记'],
        ['不再维护的老系统', '隔离网络访问 + 尽快下线改造'],
      ]},
      { type: 'callout', ico: '📊', kind: 'tip', title: '指标与汇报', html: '漏管三指标：<b>漏洞平均修复时长 MTTR、高危积压数、扫描覆盖率</b>。向领导汇报就报这三个数加趋势图。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '联动', html: '站内「护网模拟器」的战前决策卡（漏洞会战 0.85 免疫）演示的正是"修得全=弹得少"的漏管价值。' },
    ],
    takeaways: ['优先级=CVSS+资产重要性+在野利用+暴露面', '不能补丁的用虚拟补丁+缓解+例外登记', '漏管三指标：MTTR/高危积压/覆盖率'],
    checks: [
      { q: '内网低危漏洞的正确处置节奏？', opts: ['立即停机修复', '纳入例行补丁窗口', '永远不管', '只报不修'], a: 1, ex: '按风险排序：互联网+在野利用优先，内网低危进例行窗口。' },
      { q: '生产系统无法停机又出高危 CVE，怎么办？', opts: ['不管它', 'WAF 虚拟补丁+缓解+登记例外', '直接打补丁', '断电'], a: 1, ex: '虚拟补丁先挡住利用路径，登记例外并限期整改。' },
    ],
  });

  /* ---------- 设备运营 ---------- */
  add({
    id: 'mid-08', module: 9, ico: '🛡️', title: '安全设备运营：WAF · IDS/IPS · EDR · 堡垒机',
    subtitle: '每台设备的"运营要点"与告警研判重点', minutes: 55, tags: ['设备', 'WAF', 'EDR', '中级'],
    content: [
      { type: 'p', html: '企业里设备买了一堆，运营水平决定它们是"防线"还是"摆设"。这一课按设备讲"日常运营要点 + 告警怎么看"。' },
      { type: 'h', text: 'WAF：规则运营是核心' },
      { type: 'ul', items: [
        '模式：<b>阻断/仅告警/学习</b>——上线先学习模式两周，再切拦截',
        '误报处理：看命中的规则 ID + 请求特征，精确加白（URL+参数级），不整条关',
        '必开：CC 防护、IP 信誉、GeekBlock；关注：拦截日志与攻击源统计周报',
      ]},
      { type: 'h', text: 'IDS/IPS 与全流量（NDR）' },
      { type: 'ul', items: [
        '规则源：Suricata/Snort 社区规则 + ET-open；关注 emerging-* 套件',
        '告警研判三要素：会话上下文（Follow Stream）、资产角色、情报',
        '重点告警族：C2 外联特征、Webshell 上传、暴力破解、隧道（TXT 长域名）',
      ]},
      { type: 'h', text: 'EDR：告警研判与处置' },
      { type: 'ul', items: [
        '高价值告警：可疑父进程链（Office→cmd）、LSASS 访问、绕过 AMBI 的脚本、异常外联',
        '处置动作分级：监控 → 隔离主机 → 阻断进程/哈希；<b>隔离是远程可逆动作，优先使用</b>',
        '每天看：新出现的未签名进程、计划任务变更、外联 GeoIP 异常',
      ]},
      { type: 'h', text: '堡垒机与日志审计' },
      { type: 'ul', items: [
        '堡垒机是"运维行为的监控摄像头"：告警=非工作时段登录、批量拉会话、高危命令',
        '审计抽查：每周抽 10 条高危命令复核；账号与真人一一对应（共享账号=事故追责无门）',
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: '中级心法', html: '设备运营三问每天问自己：<b>日志都在采吗？告警都有人看吗？误报都在治理吗？</b>——三问都答"是"，设备才是防线。' },
    ],
    takeaways: ['WAF 先学习模式再拦截，白名单按 URL+参数级', 'EDR 处置分级：监控→隔离→阻断，隔离可逆优先', '堡垒机告警=非工作时段/批量会话/高危命令'],
    checks: [
      { q: '新 WAF 上线的正确姿势？', opts: ['直接全量拦截', '学习模式观察再切拦截', '只开 CC', '关了省事'], a: 1, ex: '先学习模式收集误报与业务特征，调好再切拦截，避免误伤业务。' },
      { q: 'EDR 疑似失陷主机，最优先的远程处置？', opts: ['重启主机', '网络隔离（可逆）', '删除文件', '格式化'], a: 1, ex: '隔离可逆且止血，重装/删除会破坏证据。' },
    ],
  });

  /* ---------- HVV 蓝队实战 ---------- */
  add({
    id: 'mid-09', module: 9, ico: '🪖', title: '攻防演练蓝队实战：战前·战时·溯源反制',
    subtitle: '92 天计划的"毕业考试"——与站内护网模拟器配套', minutes: 60, tags: ['HVV', '攻防演练', '中级'],
    content: [
      { type: 'p', html: '护网/攻防演练是安全运营的"期中大考"。这一课把真实演练打法浓缩成可执行的清单——配合站内「护网模拟器」边学边练。' },
      { type: 'h', text: '战前（提前 90 天倒排）' },
      { type: 'ul', items: [
        '<b>资产测绘</b>：影子资产/僵尸系统/孙公司旁站——红队专打你不知道的',
        '<b>暴露面收敛</b>：高危端口（后台/数据库/管理口）只留必要出口；VPN 双因子',
        '<b>弱口令清零</b>：历届 90% 战果始于弱口令；OA/邮箱/域账号与 VPN 同口令全部改掉',
        '<b>钓鱼演练</b>：全员测试+针对性培训（点击率打到 5% 以下）',
        '<b>蜜罐部署</b>：高交互蜜罐=溯源反制的抓手',
        '<b>日志与全流量</b>：集中存储≥180 天，溯源证据才齐全',
        '<b>补丁会战</b>：TOP 高危全修+虚拟补丁（87% 的防守失败源于基础漏洞未修）',
      ]},
      { type: 'h', text: '战时（7×24 值守）' },
      { type: 'ul', items: [
        '分工：监控 L1（盯屏初筛）→ 研判 L2（定性上报）→ 处置（封禁/隔离）→ 溯源（反制）',
        '<b>研判三问</b>：是真实攻击吗（排除爬虫/合作方漏扫/自家扫描）？影响哪个资产？要不要上报？',
        '<b>封禁纪律</b>：先研判再封；白名单（裁判公告的合作方）误封要扣分；严禁"关机式防守"',
        '红队每天换 IP、凌晨总攻、钓鱼+0day 组合拳——按批次统计攻击源而不是死盯单个 IP',
      ]},
      { type: 'h', text: '溯源与反制' },
      { type: 'ul', items: [
        '日志溯源：多源交叉（FW/WAF/EDR/DNS）还原攻击链',
        '蜜罐反制：诱捕样本 → 分析工具与跳板 → <b>授权范围内</b>反制（越权反制取消资格）',
        '溯源到人 = 高额加分（蜜罐诱导读取攻击者本地文件→社交账号定位）',
      ]},
      { type: 'callout', ico: '🎮', kind: 'tip', title: '边学边练', html: '站内「护网模拟器」完整实现了本课机制：战前 8 项决策、告警研判、封禁/隔离、蜜罐样本 trace 溯源到人、counter 反制——学完这课去拿 S 评级。' },
    ],
    takeaways: ['战前七件事：资产/收敛/弱口令/钓鱼/蜜罐/日志/补丁', '战时研判三问+封禁纪律（先研判再封，白名单不误伤）', '溯源反制须授权，蜜罐是取证与反制的抓手'],
    checks: [
      { q: '历届护网最大失分来源？', opts: ['0day 太多', '弱口令与基础漏洞未修', '装备不够', '红队太强'], a: 1, ex: '90% 战果始于弱口令，87% 防守失败源于基础漏洞未修——战前会战最重要。' },
      { q: '值守看到高频 404 告警，第一步？', opts: ['直接封 IP', '研判：排除白名单扫描源再定性', '上报裁判', '关掉告警'], a: 1, ex: '先定性（爬虫/合作方漏扫/自家扫描 vs 真扫描），再处置。' },
    ],
  });

  /* ---------- 报告交接/考证 ---------- */
  add({
    id: 'mid-10', module: 9, ico: '📑', title: '分析报告、值班交接与考证路径',
    subtitle: '把你的技术变成"组织能力"——中级的软实力收口', minutes: 40, tags: ['报告', '值班', '考证'],
    content: [
      { type: 'p', html: '中级向高级走，技术之外要补两块：<b>把事情写清楚</b>（报告/交接）和<b>把成长制度化</b>（考证/学习体系）。' },
      { type: 'h', text: '事件分析报告模板（即拿即用）' },
      { type: 'code', text: '1 事件概述：时间/资产/定性（一句话）\n2 处置时间线：发现→研判→遏制→恢复（含时间戳）\n3 攻击分析：入口/手法（对齐 ATT&CK）/IOC 清单\n4 影响评估：数据/业务/合规影响\n5 处置与建议：已完成动作 + 短期加固 + 长期改进\n6 附录：关键日志截图' },
      { type: 'h', text: '值班交接清单' },
      { type: 'ul', items: [
        '未闭环告警清单（编号/等级/当前状态/下一步负责人）',
        '当日封禁 IP 汇总（含到期时间，避免白名单式遗忘）',
        '设备/平台异常（采集断流、规则失效要标注）',
        '待跟进工单 + 重点情报（新爆发漏洞/新攻击活动）',
      ]},
      { type: 'h', text: '考证路线（按需不盲从）' },
      { type: 'table', head: ['证书', '定位', '建议时机'], rows: [
        ['NISP / CISP', '国内求职敲门砖（国企/乙方认可度高）', '工作 0.5-1 年后，公司报销优先'],
        ['CompTIA Security+', '国际入门，知识体系全面', '外企/出海方向可选'],
        ['CISSP', '管理向高级证书（要 5 年经验）', '高级阶段再考虑'],
      ]},
      { type: 'callout', ico: '📈', kind: 'tip', title: '中级→高级的门槛', html: '高级不是"会更多工具"，而是：<b>能独立扛事件、能写检测规则、能治理误报、能汇报到管理层</b>。本模块十课全走完，你就站在门槛上了。' },
    ],
    takeaways: ['报告六段式：概述/时间线/攻击分析/影响/处置建议/附录', '交接四件套：未闭环告警/封禁汇总/平台异常/待办情报', '考证按需：国内 CISP 优先，公司报销再考'],
    checks: [
      { q: '事件报告里最有价值的部分？', opts: ['华丽排版', '时间线与 IOC 清单', '截图越多越好', '道歉信'], a: 1, ex: '时间线证明过程，IOC 支撑后续检测与封禁——是报告的硬通货。' },
      { q: '交接班最不能漏的是？', opts: ['食堂菜单', '未闭环告警与待办', '天气', '上次团建照片'], a: 1, ex: '未闭环告警是责任边界，交接不清=事故没人管。' },
    ],
  });

  LESSONS.push(...L);
})();
