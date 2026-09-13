/* ============================================================
   hwv_data.js — 护网行动模拟器数据包（window.HWV）
   内容取材公开的 HVV 攻防演练机制与实战经验（教学模拟）
   · PREP: 战前 8 项决策（fx 决定战时攻防参数）
   · REDS: 红队 6 攻击队人设（真实 kill chain 分工）
   · ALERTS: 告警模板库（真实攻击 + 噪音 + 白名单）
   · UNITS: 参演防守单位（AI 排名对手）
   · FEED: 裁判沟通群播报池 / NDAY: 高频漏洞清单
   ============================================================ */
(function () {
  const r = n => Math.floor(Math.random() * n);
  const pick = a => a[r(a.length)];

  /* ---------- 战前决策卡 ----------
     fx 字段: shadow(影子资产数) expose(攻击面削减) weak(弱口令加固) phish(钓鱼点击率)
              honey(0无/1低交互/2高交互) log(0/1/2 溯源证据) drill(处置效率) patch(NDay免疫) */
  const PREP = [
    { id: 'asset', ico: '🗺️', title: '资产测绘', desc: '红队从企查查孙公司、备案反查、FOFA 测绘迂回——专打你不知道的影子资产与孙公司旁站。',
      options: [
        { label: '全量测绘 + 台账登记', desc: '发现并下线全部影子资产，台账入库', fx: { shadow: 0 }, good: true },
        { label: '抽查互联网出口', desc: '发现 1 个影子资产，仍有遗漏', fx: { shadow: 1 } },
        { label: '时间紧张，先不摸底', desc: '3 个影子资产暴露在互联网上', fx: { shadow: 3 }, bad: true },
      ] },
    { id: 'expose', ico: '🚪', title: '暴露面收敛', desc: '关停非必要端口与服务——攻面越小，打点越难。',
      options: [
        { label: '全面收敛（高危端口+僵尸系统下线）', desc: '攻击面削减 40%', fx: { expose: 0.4 }, good: true },
        { label: '只关高危端口', desc: '攻击面削减 20%', fx: { expose: 0.2 } },
        { label: '业务原因不动', desc: '攻击面维持原样，边缘资产好打', fx: { expose: 0 }, bad: true },
      ] },
    { id: 'weak', ico: '🔑', title: '弱口令排查', desc: '历届护网 90% 以上战果始于弱口令（拼音账号+123456/生日）；OA 账号常与邮箱、域、VPN 同口令，一处沦陷处处沦陷。',
      options: [
        { label: '全员改密 + VPN 双因子', desc: '爆破/喷洒几乎免疫', fx: { weak: 2 }, good: true },
        { label: '仅管理后台与运维账号', desc: '普通账号仍有弱口令风险', fx: { weak: 1 } },
        { label: '怕影响业务，暂缓', desc: '弱口令全线暴露', fx: { weak: 0 }, bad: true },
      ] },
    { id: 'phish', ico: '🎣', title: '全员钓鱼演练', desc: '红队社工组专盯员工。演练过的人，点得少。',
      options: [
        { label: '全员演练 + 邮件网关策略收紧', desc: '点击率仅 5%', fx: { phish: 0.05 }, good: true },
        { label: '抽样演练', desc: '点击率 15%', fx: { phish: 0.15 } },
        { label: '没来得及做', desc: '点击率 30%，内网入口大开', fx: { phish: 0.3 }, bad: true },
      ] },
    { id: 'honey', ico: '🍯', title: '蜜罐部署', desc: '蜜罐是溯源反制的抓手——捕获红队工具样本，甚至反打跳板。',
      options: [
        { label: '高交互蜜罐（仿真 OA/VPN/数据库）', desc: '捕获率最高，可拿反制线索', fx: { honey: 2 }, good: true },
        { label: '低交互蜜罐（仅端口仿真）', desc: '能发现，难拿样本', fx: { honey: 1 } },
        { label: '不部署', desc: '没有诱捕与反制抓手', fx: { honey: 0 }, bad: true },
      ] },
    { id: 'log', ico: '📊', title: '日志集中与全流量', desc: '溯源靠日志。集中 + 全流量回溯 = 攻击来去有痕。',
      options: [
        { label: '全流量回溯 + 日志集中 180 天', desc: '溯源证据最全（log=2）', fx: { log: 2 }, good: true },
        { label: '仅日志集中', desc: '可溯源到 IP，难追手法链（log=1）', fx: { log: 1 } },
        { label: '维持现状（日志散在各机）', desc: '取证困难，溯源打折（log=0）', fx: { log: 0 }, bad: true },
      ] },
    { id: 'drill', ico: '🚨', title: '应急预案与排班', desc: '7×24 值守 + 应急演练，处置快人一步。',
      options: [
        { label: '完整演练 + 双人双岗排班', desc: '处置效率最高，告警不积压', fx: { drill: 0.5 }, good: true },
        { label: '有预案，未演练', desc: '处置效率中等', fx: { drill: 0.75 } },
        { label: '边打边定', desc: '处置慢半拍，攻击窗口变大', fx: { drill: 1 }, bad: true },
      ] },
    { id: 'patch', ico: '🩹', title: '漏洞修复会战', desc: '约 87% 的防守失败源于基础漏洞未修复。Nday 是护网主力弹药，修得越全，弹越少。',
      options: [
        { label: 'TOP 高危全修 + 虚拟补丁', desc: '绝大多数 Nday 免疫', fx: { patch: 0.85 }, good: true },
        { label: '修互联网侧高危', desc: '一半 Nday 免疫', fx: { patch: 0.5 } },
        { label: '不敢动生产', desc: 'Nday 全通，攻击队最爱', fx: { patch: 0 }, bad: true },
      ] },
  ];

  /* ---------- 红队 6 攻击队 ----------
     style 决定战役模板偏好; skill 决定推进速度; alias 供溯源到队 */
  const REDS = [
    { id: 'tx', name: '红队·天璇', alias: '天璇', skill: 0.9,  styles: ['phish', 'exploit'], intro: '社工钓鱼专精，伪装 HR/发票/工资单' },
    { id: 'yg', name: '红队·摇光', alias: '摇光', skill: 1.0,  styles: ['scan', 'exploit'], intro: 'Nday 批量打点，专扫边界设备与 OA' },
    { id: 'tl', name: '红队·贪狼', alias: '贪狼', skill: 0.8,  styles: ['brute'], intro: '弱口令爆破与密码喷洒' },
    { id: 'pj', name: '红队·破军', alias: '破军', skill: 1.2,  styles: ['zeroday', 'exploit'], intro: '0day 精攻，直奔靶标' },
    { id: 'lz', name: '红队·廉贞', alias: '廉贞', skill: 0.85, styles: ['supply'], intro: '供应链渗透：运维工具、IT 供应商' },
    { id: 'jm', name: '红队·巨门', alias: '巨门', skill: 1.1,  styles: ['lateral', 'dc'], intro: '内网横向与集权系统专家' },
  ];
  const IP_POOLS = ['45.83.66.', '185.220.101.', '91.243.72.', '103.75.190.', '196.52.43.', '89.248.167.', '141.98.10.', '146.70.99.'];

  /* ---------- 告警模板 ----------
     real: 真实攻击（链上事件）; kind: 外链类可 ban / 主机类可 isolate
     c = {ip, host, user, dom, t}; fx = 战前效果 */
  const ALERTS = [
    /* —— 侦察/打点 —— */
    { cls: 'recon', kind: 'ban', sev: 1, sc: 1, gen: c => ({ title: '端口扫描（代理池/云函数多源）', log: 'fw: DENY ' + c.ip + ' -> 10.1.0.' + (2 + c.n) + ' [SYN 1-65535] ×3800/分钟（来源 IP 持续变化，疑似云函数代理池）', asset: c.host, srcIp: c.ip, teach: '2022 起红队流行云函数+SCFproxy 多源扫描，日志里 IP 一直在换——封单 IP 意义有限，收敛暴露面才是根治。' }) },
    { cls: 'recon', kind: 'ban', sev: 1, sc: 1, gen: c => ({ title: '子域名/目录爆破', log: 'waf: ' + c.ip + ' GET /admin /.git /.env 失败 ×1800（全 404）', asset: 'WAF', srcIp: c.ip, teach: '目录爆破在找后台与备份文件，暴露面收敛可让这类打点空手而归。' }) },
    /* —— 弱口令爆破 —— */
    { cls: 'brute', kind: 'ban', sev: 2, sc: 1, gen: c => ({ title: 'VPN 弱口令爆破', log: 'vpn: AUTH FAIL user=' + c.user + ' from ' + c.ip + ' ×86（随后 1 次 OK！）', asset: 'VPN 网关', srcIp: c.ip, teach: '失败洪水后的成功登录=爆破得手，弱口令加固是根治。' }) },
    { cls: 'brute', kind: 'ban', sev: 2, sc: 1, gen: c => ({ title: '邮箱密码喷洒', log: 'mailgw: 同密码 spraying 多账号 from ' + c.ip + '，ops01 命中', asset: '邮件网关', srcIp: c.ip, teach: '密码喷洒每号只试一次躲锁定，盯"成功"而不是"失败"。' }) },
    { cls: 'brute', kind: 'ban', sev: 2, sc: 1, gen: c => ({ title: 'OA 后台弱口令', log: 'waf: POST /admin/login 200 (admin/admin) from ' + c.ip, asset: 'OA 系统', srcIp: c.ip, teach: 'admin/admin 仍是历届护网最高频突破口。' }) },
    /* —— Nday/0day 利用 —— */
    { cls: 'exploit', kind: 'ban', sev: 3, sc: 3, gen: c => ({ title: 'OA 系统 Nday 利用', log: 'waf: ' + c.ip + ' POST /weaver/bsh.servlet.BSHServlet 200（BeanShell 命令执行）', asset: 'OA 系统', srcIp: c.ip, teach: '泛微/致远/用友等 OA 的 Nday 是护网主力弹药，补丁会战直接免疫。' }) },
    { cls: 'exploit', kind: 'ban', sev: 3, sc: 3, gen: c => ({ title: '边界设备 RCE 尝试', log: 'ids: ' + c.ip + ' -> SSL VPN 设备 CVE 利用特征命中（命令回显成功）', asset: 'SSL VPN', srcIp: c.ip, teach: 'SSL VPN/防火墙设备的远程命令执行漏洞是打点首选。' }) },
    { cls: 'exploit', kind: 'ban', sev: 3, sc: 3, gen: c => ({ title: 'Java 组件反序列化利用', log: 'waf: ' + c.ip + ' POST payload=rO0AB…(CC 链) 响应异常', asset: '业务系统', srcIp: c.ip, teach: 'Shiro/Fastjson/Weblogic 反序列化长盛不衰——组件升级+WAF 规则双保险。' }) },
    { cls: 'exploit', kind: 'ban', sev: 3, sc: 3, gen: c => ({ title: '⚠ 0day 攻击（裁判已通报）', log: 'waf: 未知利用链命中 ' + c.host + '，特征未收录，疑似 0day', asset: c.host, srcIp: c.ip, teach: '0day 突袭考验应急：虚拟补丁/下线/加严策略，并立即上报裁判。' }) },
    /* —— Webshell —— */
    { cls: 'webshell', kind: 'host', sev: 3, sc: 3, gen: c => ({ title: 'Webshell 上传执行', log: 'edr: ' + c.host + ' 上传目录出现 ' + c.dom.split('.')[0] + '.jsp，进程链 tomcat->cmd', asset: c.host, srcIp: c.ip, teach: '上传目录禁执行+文件校验；发现后立即隔离主机取证。' }) },
    { cls: 'webshell', kind: 'host', sev: 3, sc: 3, gen: c => ({ title: '冰蝎/哥斯拉加密流量', log: 'ids: ' + c.host + ' 与 ' + c.ip + ' 长连接加密交互（哥斯拉特征）', asset: c.host, srcIp: c.ip, teach: '加密 Webshell 流量难辨内容，按失陷处置并回溯落地时间。' }) },
    /* —— 钓鱼/社工 —— */
    { cls: 'phish', kind: 'host', sev: 3, sc: 3, gen: c => ({ title: '员工点击钓鱼附件（工资表/简历主题）', log: 'edr: ' + c.user + ' 打开"2026调薪确认.xlsm"（Excel 4.0 宏），' + c.host + ' 拉起 powershell 外联 ' + c.ip, asset: c.host, srcIp: c.ip, teach: '钓鱼附件套路：简历/工资单/发票/CHM/LNK，甚至伪装"护网漏洞清单"专钓蓝队。隔离主机+撤回邮件+全网同主题排查。' }) },
    { cls: 'phish', kind: 'none', sev: 2, sc: 3, gen: c => ({ title: '钓鱼邮件批量送达', log: 'mailgw: FROM hr-benefits@' + c.dom + ' 送达 42 人 主题"应急处置通知" 附件 xlsm（加密压缩防沙箱）', asset: '邮件网关', srcIp: c.ip, teach: '送达未点击：撤回邮件、加黑域名、群内预警，别等有人点。' }) },
    { cls: 'phish', kind: 'none', sev: 2, sc: 3, gen: c => ({ title: 'GitHub 出现我方"EXP"（假投毒）', log: 'intel: 监测到 GitHub 仓库"2026护网0day-通达OA" 投放木马化 EXP，含我方员工 fork 记录', asset: '威胁情报', srcIp: c.ip, teach: '红队惯用技：伪装蓝队圈疯传的假 EXP 专钓防守方——内部通报"不要下载运行来路不明的 EXP"。' }) },
    /* —— 供应链 —— */
    { cls: 'supply', kind: 'host', sev: 3, sc: 3, gen: c => ({ title: '运维软件更新包异常', log: 'edr: ' + c.host + ' 运维工具"升级包"签名异常，释放载荷外联 ' + c.ip, asset: c.host, srcIp: c.ip, teach: '供应链攻击绕过边界：更新包校验签名+灰度分发。' }) },
    /* —— 内网横向 —— */
    { cls: 'lateral', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '内网横向移动', log: 'ndr: ' + c.host + ' -> 10.1.0.0/24 445 端口批量会话（psexec 风格）', asset: c.host, srcIp: c.ip, teach: '横向意味着已立足：立即隔离源主机，切断跳板。' }) },
    { cls: 'lateral', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '哈希传递（PtH）', log: 'win: ' + c.host + ' 4624 logon_type=9 NTLM 直登多台主机', asset: c.host, srcIp: c.ip, teach: '哈希传递说明凭据已泄露：重置凭据+隔离+排查内存密码。' }) },
    /* —— 集权系统 —— */
    { cls: 'dc', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '域控 DCSync/ZeroLogon 攻击', log: 'win: DC01 4662 DSReplicationGetChangesAll from ' + c.host + '（或 ZeroLogon 置空域控密码）', asset: 'DC01 域控', srcIp: c.ip, teach: 'DCSync/ZeroLogon = 全域失陷：隔离发起主机、重置 krbtgt 两次、检查 Golden Ticket。' }) },
    { cls: 'dc', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '堡垒机异常登录', log: 'bastion: ' + c.user + ' 从非常用地 ' + c.host + ' 登录并批量拉起会话', asset: '堡垒机', srcIp: c.ip, teach: '堡垒机失陷=所有运维入口失陷，最高优先级处置。' }) },
    /* —— 外带/靶标 —— */
    { cls: 'exfil', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '靶标异常访问', log: 'fw: ' + c.host + ' -> 靶标段 10.250.1.0/24 大量会话（已越过纵深）', asset: '靶标区', srcIp: c.ip, teach: '攻击已到靶标门口：隔离源主机+靶标区加严 ACL，最后机会。' }) },
    { cls: 'exfil', kind: 'host', sev: 3, sc: 5, gen: c => ({ title: '数据批量外带', log: 'dlp: ' + c.host + ' 外发 1.2GB 到 ' + c.ip + ':8443（非业务通道）', asset: c.host, srcIp: c.ip, teach: '外带=渗透尾声：断通道、隔离主机、评估数据范围。' }) },
  ];

  /* —— 噪音/白名单（研判是防守第一技能）—— */
  const NOISE = [
    { cls: 'noise', kind: 'none', sev: 1, gen: c => ({ title: '搜索引擎爬虫', log: 'waf: ' + c.ip + ' UA="Baiduspider/2.0" 抓取 /news ×420', asset: '官网', srcIp: c.ip, teach: '爬虫流量正常——赛前白名单里有它，封了它官网搜索排名就没了。' }) },
    { cls: 'noise', kind: 'none', sev: 1, gen: c => ({ title: '业务高峰批量查询', log: 'app: /api/order QPS 峰值 5200（基线 800）大促进行中', asset: '业务系统', srcIp: c.ip, teach: '业务洪峰长得像 CC——先问业务再动手。' }) },
    { cls: 'noise', kind: 'none', sev: 1, gen: c => ({ title: '办公网批量下载', log: 'net: 10.1.8.0/24 批量下载补丁服务器文件（周二例行）', asset: '办公网', srcIp: c.ip, teach: '例行运维动作，台账齐全就不是攻击。' }) },
    { cls: 'noise', kind: 'none', sev: 1, gen: c => ({ title: '自家漏扫任务', log: 'scan: 10.1.9.9（Nessus）全站例行扫描', asset: '全网', srcIp: c.ip, teach: '自家扫描器——战前要向裁判报备，不然裁判分不清。' }) },
  ];
  /* 合作方漏扫（赛前裁判公告的白名单 IP 段——误封扣分） */
  const PARTNER = { seg: '58.211.14.', note: '裁判公告：合作方安全评估单位 58.211.14.0/24 白名单漏扫' };
  const PARTNER_ALERT = { cls: 'partner', kind: 'none', sev: 1, gen: c => ({ title: '合作方漏扫流量（白名单）', log: 'waf: ' + c.ip + '（' + PARTNER.seg + '0-255 段）扫描器 UA 全站扫描', asset: '全网', srcIp: c.ip, teach: '赛前裁判公告过：这是合作方漏扫白名单段，放行——封了要被扣"误封"分。' }) };

  /* ---------- 参演单位（AI 对手） ---------- */
  const UNITS = ['某省政务云', '某股份制银行', '某能源集团', '某三甲医院', '某城商行', '某央企集团', '某车联网企业', '某省医保局', '某证券公司', '某物流集团', '某互联网大厂', '某机场集团', '某电力公司', '某高校', '某保险公司', '某制造集团', '某运营商省公司', '某港务集团', '我方单位'];

  /* ---------- 裁判群播报池 ---------- */
  const FEED = {
    start: ['📣 裁判组：护网行动正式开始！请各单位 7×24 值守，及时上报研判结果。', '📣 裁判组：本次演练靶标为主靶标×1、分靶标×2，请重点防护。', '📣 裁判组：合作方安全评估单位 58.211.14.0/24 为白名单漏扫，请勿封禁。'],
    referee: [
      '📣 裁判组：今晚红队将发起夜间总攻（红队惯用凌晨防守薄弱期突袭），请各单位加强值守。',
      '📣 裁判组：近日某单位靶标失陷，属 VPN 弱口令被爆，各单位自查。',
      '📣 裁判组：请各单位注意排查 OA 系统历史漏洞（Shiro-550 / 致远 getSessionList / 通达组合利用，详见通报）。',
      '📣 裁判组：研判上报请附证据截图与日志（时间到秒/源目IP/资产/定性/临时措施），无证据的处置判无效。',
      '📣 裁判组：溯源到攻击队或人员将获得高额加分，蜜罐样本请及时提交；反打须授权，越权反制取消资格。',
      '📣 裁判组：严禁"关机式防守"——擅自下线业务、封 C 段属非正常防守，每 30 分钟倒扣分。',
      '📣 裁判组：主防单位请注意协防（子公司/供应商）旁路风险，连带考核。',
      '📣 裁判组：战果提交平台 9:00-21:00 开放，夜间攻击照常进行，请 7×24 值守。',
    ],
    zeroday: ['📣 裁判组：通告——某攻击队已使用 0day 拿下某单位分靶标，全行业排查同类利用链！'],
    bluewins: [
      '🟦 战报：某单位通过蜜罐捕获攻击队样本，获溯源加分。',
      '🟦 战报：某单位成功反制，攻击队跳板被依法处置。',
      '🟦 战报：某单位研判发现 0day 攻击，裁判通报表扬。',
      '🟦 战报：某单位及时封禁攻击源，阻断打点获加分。',
    ],
    redwins: [
      '🔴 战报：某单位分靶标失陷，裁判已记录。',
      '🔴 战报：某单位 VPN 被爆破成功，内网沦陷。',
      '🔴 战报：某单位因未及时处置被通报扣分。',
    ],
  };

  /* ---------- Nday/0day 清单（历届高频，含 CVE/CNVD 编号） ---------- */
  const NDAY = ['Shiro-550 反序列化 (CVE-2016-4437，rememberMe=deleteMe 指纹)', 'Log4j2 JNDI (CVE-2021-44228)', 'WebLogic 反序列化/控制台 (CVE-2023-21839)', 'PrintNightmare 域控 RCE (CVE-2021-1675)', 'ZeroLogon (CVE-2020-1472)', 'Exchange 邮件网关 RCE (CVE-2020-0688)', '通达 OA 任意用户登录 + iSpirit 上传组合 RCE', '致远 OA getSessionList 会话泄露', '泛微 OA BeanShell 命令执行', '用友 NC 反序列化', 'SSL VPN 设备 RCE（企业边界首选）', 'Redis 未授权写计划任务', '向日葵远控 RCE (CNVD-2022-03672)'];

  window.HWV = { PREP: PREP, REDS: REDS, IP_POOLS: IP_POOLS, ALERTS: ALERTS, NOISE: NOISE, PARTNER: PARTNER, PARTNER_ALERT: PARTNER_ALERT, UNITS: UNITS, FEED: FEED, NDAY: NDAY, r: r, pick: pick };
})();
