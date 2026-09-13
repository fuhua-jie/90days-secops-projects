/* ============================================================
   data-glossary3.js — 术语表扩容包 D（+105 条 → 总量 305）
   追加进 GLOSSARY
   ============================================================ */
(function () {
  const G = [];
  const g = (t, en, c, d, eg) => G.push({ t, en, c, d, eg });

  /* —— 检测工程 —— */
  g('Sigma', '—', '检测工程', '开源的通用检测规则格式：一份 YAML 规则可转换为多种 SIEM 平台的查询语法。', '一条 Sigma 规则可同时生成 Splunk/Elastic/QRadar 查询——跨平台复用。');
  g('DeTT&CT', '—', '检测工程', 'ATT&CK 覆盖率可视化管理工具：把日志质量/检测规则/可见性映射到 ATT&CK 矩阵热力图。', '用 DeTT&CT 找出"有日志但没规则"的薄弱格子。');
  g('Detection Engineering', '检测工程', '检测工程', '安全运营的"规则开发"子学科：像写代码一样写检测规则（版本控制/测试/部署/迭代）。', '检测工程师 = 安全运营里的"软件开发者"。');
  g('Purple Team', '紫队', '检测工程', '红蓝协作：红队执行已知 TTP → 蓝队验证能否检测 → 缺口补齐 → 复测。', '紫队不是一个人是"一种工作方式"。');
  g('False Positive Rate', '误报率', '检测工程', '规则告警中误报的占比——过高导致告警疲劳，过低可能漏报。', '误报率 50% 的规则必须调优。');
  g('Detection Coverage', '检测覆盖率', '检测工程', 'ATT&CK 关键技术中被"有效检测"覆盖的占比。', '覆盖率矩阵是安全运营成熟度的可视化。');
  g('Rule Tuning', '规则调优', '检测工程', '基于误报分析持续优化规则的阈值/排除条件/匹配逻辑。', '规则上线 ≠ 终点，调优才是开始。');
  g('Use Case Library', '用例库', '检测工程', '按 ATT&CK 组织的检测用例集合：每条包含数据源/规则/响应手册/验证方法。', '用例库是 SOC 从个人能力变成组织能力的关键沉淀。');

  /* —— DFIR 取证 —— */
  g('Volatility', '—', 'DFIR取证', '开源内存取证框架：从内存镜像中提取进程/网络/注册表/注入代码等证据。', 'malfind 插件直接定位可疑注入内存段。');
  g('Plaso / log2timeline', '—', 'DFIR取证', '超级时间线工具：把文件系统/注册表/浏览器/日志等多源证据统一到一条时间轴。', '一条 CSV 还原攻击者从进入到外泄的全部动作。');
  g('Autopsy', '—', 'DFIR取证', '开源磁盘取证工具（The Sleuth Kit 的 GUI）：文件恢复/关键字搜索/时间线分析。', 'Autopsy 可以恢复"已删除"的文件（只要数据块未被覆盖）。');
  g('KAPE', 'Kroll Artifact Parser and Extractor', 'DFIR取证', '快速采集和解析 Windows 取证工件的工具：分钟级完成磁盘关键数据提取。', 'KAPE 的 _kape.cli 可按目标快速拉取指定目录的取证工件。');
  g('Evidence Chain', '证据链', 'DFIR取证', '取证证据从采集到分析的完整流转记录：谁在何时获取/传输/分析，hash 全程校验。', '证据链断裂=法律上不可采信。');
  g('Order of Volatility', '易失性顺序', 'DFIR取证', '取证采集的优先顺序：CPU/寄存器 → 内存 → 网络 → 磁盘 → 外接设备——越易失越先采。', '断电后内存证据归零——所以"先抓内存再关机"。');
  g('Anti-Forensics', '反取证', 'DFIR取证', '攻击者为破坏取证而使用的技术：清日志/时间戳篡改/数据加密/覆盖删除。', '反取证本身就是"确凿证据"——正常人不会清审计日志。');

  /* —— AD 攻防 —— */
  g('BloodHound', '—', 'AD攻防', '域攻击路径分析工具：用图数据库自动发现"从普通用户到 Domain Admin"的最短路径。', 'BloodHound 一键找出"这条路径比另一条快 3 步"。');
  g('Kerberoasting', '—', 'AD攻防', '请求服务 TGS 票据并离线破解服务账号密码。', '服务账号密码必须长而随机。');
  g('AS-REP Roasting', '—', 'AD攻防', '对关闭 Kerberos 预认证的账号直接要 TGT 并离线破解。', '检查域内哪些账号没有开启预认证。');
  g('DCSync', '—', 'AD攻防', '模拟域控复制协议请求全部账号哈希（需要复制权限）。', 'DSReplicationGetChangesAll 事件是 DCSync 的指纹。');
  g('Golden Ticket', '黄金票据', 'AD攻防', '用 krbtgt 哈希伪造任意账号的 TGT——全域万能门票。', 'krbtgt 重置两次是唯一解药。');
  g('Silver Ticket', '白银票据', 'AD攻防', '用服务账号 NTLM 哈希伪造特定服务的 TGS——影响范围比金票小但更隐蔽。', '银票不经过 DC，DC 上没有日志。');
  g('Credential Guard', '—', 'AD攻防', '用虚拟化安全（VSM）隔离 LSASS 进程，Mimikatz 读不到明文和哈希。', 'Win 10/11 + TPM 的企业标配。');
  g('Tiered Administration', '分层管理', 'AD攻防', '域管理分级：Tier 0（域控）凭据绝不在 Tier 1/2 设备登录。', '域管在工作站登邮箱 = 凭据降级泄露。');
  g('ESC1-ESC8', '—', 'AD攻防', 'AD CS 证书服务的 8 类错误配置，每种都可导致提权或域接管。', 'ESC1 = 模板允许自填 SAN + 域管可授权。');
  g('LAPS', 'Local Administrator Password Solution', 'AD攻防', '微软方案：每台电脑的本地管理员密码定期自动随机化并存入 AD。', 'LAPS 让"一台沦陷→全部沦陷"变成不可能。');

  /* —— 云安全进阶 —— */
  g('Assume Role', '—', '云安全进阶', '临时扮演另一个 IAM 角色获取其权限——横向移动的云原版。', '攻击者用泄露 AK Assume 高权限角色。');
  g('Cloud Workload', '云工作负载', '云安全进阶', '云上运行的所有计算实例：VM/容器/Serverless 函数。', '每类工作负载需要不同的保护策略。');
  g('Shared Responsibility Model', '责任共担模型', '云安全进阶', '云厂商负责"云的安全"，客户负责"云中的安全"——边界要搞清。', '数据加密/访问控制/应用安全都是客户的责任。');
  g('OIDC / SAML', 'OpenID Connect / Security Assertion Markup Language', '云安全进阶', '身份联合协议：用企业 IdP 登录云控制台——统一身份管理的桥梁。', 'SSO 配置错误可能让外部人员冒充内部用户。');
  g('Terraform / IaC', 'Infrastructure as Code', '云安全进阶', '基础设施即代码：用代码定义云资源——安全策略也可以代码化。', 'IaC 安全扫描（如 tfsec）在部署前拦截配置错误。');
  g('Lateral Movement (Cloud)', '云上横向移动', '云安全进阶', '用泄露凭据 Assume 多个角色/访问多个服务/跨账号跳转。', '云上横向靠 IAM 策略而非网络端口。');

  /* —— 恶意软件分析 —— */
  g('Sandbox', '沙箱', '恶意软件分析', '隔离执行环境：运行可疑文件并记录其行为（文件/网络/注册表）。', 'Cuckoo Sandbox / ANY.RUN / Joe Sandbox。');
  g('PE Header', 'Portable Executable Header', '恶意软件分析', 'Windows 可执行文件的头部信息：编译时间/导入表/节区/熵值。', '导入表出现 VirtualAlloc+WriteProcessMemory = 注入能力。');
  g('OPCD / YARA', '—', '恶意软件分析', 'YARA 规则语言：用字符串/条件描述恶意软件家族特征，批量扫描。', '三条起步规则：互斥体名+特征串+编译时间窗。');
  g('VirusTotal', 'VT', '恶意软件分析', '多引擎在线扫描平台：70+ 杀毒引擎同时检测文件/URL/域名。', 'VT 上 0/70 检出 ≠ 安全（可能是 0day）。');
  g('MITRE ATT&CK Evaluations', '—', '恶意软件分析', 'MITRE 每年对 EDR 产品按 APT TTP 进行的公开评估——选 EDR 的参考依据。', '看评估结果中的 Detection Coverage 和 Telemetry Quality。');
  g('C2 Profile', '—', '恶意软件分析', 'C2 通信的协议/格式/间隔等特征——同一家族的 C2 Profile 一致。', '识别 C2 Profile 可以写检测规则并关联同家族样本。');
  g('RAT', 'Remote Access Trojan', '恶意软件分析', '远程访问木马：文件管理/键盘记录/屏幕/摄像头/麦克风全功能远控。', 'Gh0st/Quasar/NjRAT 是常见 RAT 家族。');
  g('Dropper', '投放器', '恶意软件分析', '第一阶段载荷：负责下载并执行真正的恶意软件。', 'Dropper 本身"干净"（只下载不恶意），需要结合行为分析。');

  /* —— 合规进阶 —— */
  g('Risk Register', '风险登记册', '合规进阶', '组织所有已知风险的台账：风险描述/等级/责任人/缓解措施/复评日期。', '风险登记册是安全治理的"总账本"。');
  g('Security Metrics', '安全指标', '合规进阶', '量化安全运营效果的数据：MTTD/MTTR/误报率/闭环率/覆盖率/风险敞口。', '没有指标的 SOC = 没有成绩单的学生。');
  g('Threat Modeling', '威胁建模', '合规进阶', '在设计阶段系统化识别潜在威胁的方法（STRIDE/DREAD/攻击树）。', 'STRIDE = Spoofing/Tampering/Repudiation/Info Disclosure/DoS/Elevation。');
  g('SOC 2', '—', '合规进阶', '面向 SaaS/服务型公司的安全审计报告：安全性/可用性/保密性/处理完整性。', 'Type I 证明设计合理，Type II 证明持续有效。');
  g('Gap Analysis', '差距分析', '合规进阶', '对比当前安全状态与目标标准（如 NIST CSF）的差距，制定改进计划。', '差距分析是安全体系建设的"起点地图"。');
  g('Data Classification', '数据分类分级', '合规进阶', '按数据的价值/敏感度分级（公开/内部/机密/核心），差异化保护。', '分级是资源分配的依据：核心数据最强保护。');
  g('Incident Response Plan', '事件响应计划', '合规进阶', '书面化的应急响应流程：角色/职责/升级路径/通讯模板/法律联系人。', '没有演练过的 IRP 等于没有。');
  g('BIA', 'Business Impact Analysis', '合规进阶', '业务影响分析：评估系统中断对业务的影响（RTO/RPO/经济损失）。', 'BIA 决定"哪些系统最先恢复"和"投资多少安全预算"。');

  /* —— 安全架构 —— */
  g('Purdue Model', 'Purdue 模型', '安全架构', '工业控制（OT/ICS）网络的分层参考架构：Level 0-5 从传感器到企业 IT。', 'IT 侧勒索不应影响 OT 侧管道——分层隔离是核心。');
  g('Micro-segmentation', '微隔离', '安全架构', '在数据中心内部实施细粒度网络隔离（工作负载级），限制横向移动。', '微隔离让"进了一台=进全部"变成"进了一台=只进一台"。');
  g('Secure by Design', '默认安全设计', '安全架构', '在设计阶段就把安全作为核心需求，而不是"事后打补丁"。', '默认配置就是最安全配置——用户不需要是专家也能安全使用。');
  g('Assume Breach', '假设已入侵', '安全架构', '以"攻击者已经在内网"为前提设计检测和限制——验证你的纵深防御是否有效。', '假设已入侵：你的 EDR 能发现吗？你的备份能用吗？你的横向隔离够吗？');
  g('Trust Boundary', '信任边界', '安全架构', '不同信任级别之间数据和指令流动的边界——每个边界都需要安全控制。', '用户→Web→API→DB，每条线都是信任边界。');
  g('Single Point of Failure', '单点故障', '安全架构', '一处失效即导致整个系统不可用的组件——安全架构要消除 SPOF。', '唯一的安全工程师离职 = 安全运营单点故障。');

  /* —— 运营进阶 —— */
  g('Runbook', '操作手册', '运营进阶', '标准化的操作步骤文档：新人也能按手册处置告警。', 'Runbook 让处置不依赖"老员工记忆"。');
  g('Use Case Library', '用例库', '运营进阶', '按 ATT&CK 组织的检测用例集合，每条含数据源/规则/响应手册。', '用例库是 SOC 成熟度的标志。');
  g('Tabletop Exercise', '桌面推演', '运营进阶', '不动真实环境的应急演练：靠剧本问答走流程。', '低成本高价值：每年至少一次跨部门推演。');
  g('Signal to Noise Ratio', '信噪比', '运营进阶', '真告警与误告警的比值——衡量 SIEM 规则质量的指标。', '信噪比低的规则要么调优要么下线。');
  g('SOC Playbook', 'SOC 剧本', '运营进阶', 'SOC 值守的标准操作程序：触发条件→执行步骤→升级路径。', 'Playbook 让新人也能正确处置。');
  g('Threat Landscape', '威胁全景', '运营进阶', '当前威胁环境的整体图景：谁在攻击谁/用什么手法/目标是什么。', '知道"现在谁在打谁"，才能把资源投在正确的防御方向。');
  g('Case Management', '案例管理', '运营进阶', '把多个相关告警关联为一个"案例"进行统一调查和闭环管理。', '一个案例 = 一次完整事件的调查与处置记录。');
  g('Single Pane of Glass', '统一面板', '运营进阶', '一个界面查看所有安全数据：告警/资产/情报/工单/报告。', '统一面板让分析师不需要在 10 个工具间切换。');
  g('Skill Matrix', '技能矩阵', '运营进阶', '团队成员的技能映射表：谁会什么/谁在学什么/谁缺什么。', '技能矩阵是排班和培训计划的依据。');
  g('TTP', 'Tactics, Techniques and Procedures', '运营进阶', '攻击者的战术/技术/过程——比 IOC 更稳定的"打法指纹"。', 'IOC 三天失效，TTP 层特征可用一年。');

  /* —— 网络进阶 —— */
  g('BGP Hijacking', 'BGP 劫持', '网络进阶', '宣告不属于你的 IP 前缀，把流量重路由到攻击者网络。', 'BGP 劫持用于加密货币窃取或流量监控。');
  g('DNS Rebinding', 'DNS 重绑定', '网络进阶', 'TTL 极短使域名先解析为可信 IP 再切换为内网 IP，绕过同源策略。', '第二次解析把域名指向 127.0.0.1 或内网 IP。');
  g('Rogue DHCP', '恶意 DHCP', '网络进阶', '攻击者在内网架设恶意 DHCP 服务器，分发恶意网关/DNS。', 'DHCP Snooping 是交换机层的防御。');
  g('VLAN Hopping', 'VLAN 跳跃', '网络进阶', '利用交换机的双标签/协商漏洞跳转到其他 VLAN。', '禁用 DTP + 固定 native VLAN 防跳跃。');
  g('Split Tunneling', 'VPN 分流', '网络进阶', 'VPN 同时走内网和公网——设备成为内外网桥接点。', '恶意软件可从公网经设备跳入内网——全隧道更安全。');

  /* —— Web 进阶 —— */
  g('Prototype Pollution', '原型污染', 'Web进阶', '通过 __proto__ 键修改 JavaScript Object.prototype，影响所有对象。', 'Node.js 应用常见——需要过滤 __proto__/constructor 键。');
  g('Request Smuggling', 'HTTP 请求走私', 'Web进阶', '前端代理和后端服务器对 CL/TE 边界理解不一致，"走私"恶意请求。', '统一前后端的 HTTP 解析器版本是修复。');
  g('JWT alg:none', '—', 'Web进阶', '把 JWT 头部的 alg 改为 "none" 并去掉签名，绕过验证。', '服务端必须白名单验证算法，不能信任客户端声明的 alg。');
  g('CSP Nonce', '—', 'Web进阶', '每次响应生成随机 nonce，只执行匹配 nonce 的脚本——比域名白名单更严格。', '即使同域被注入也无法执行（因为 nonce 不匹配）。');
  g('Clickjacking', '点击劫持', 'Web进阶', '用透明 iframe 覆盖在合法按钮上，诱导用户点击。', 'X-Frame-Options: DENY 或 CSP frame-ancestors 防御。');
  g('Subdomain Takeover', '子域名接管', 'Web进阶', '利用指向已删除/过期资源的 DNS 记录（CNAME）劫持子域名。', '定期扫描 DNS 记录中的 dangling CNAME。');

  /* —— 密码进阶 —— */
  g('FIDO2 / WebAuthn', '—', '密码进阶', '基于公钥加密的无密码认证：私钥存设备、公钥存服务端，防钓鱼。', '认证绑定域名（origin-binding），仿冒站点无法触发有效认证。');
  g('Passkey', '—', '密码进阶', '无密码认证：服务端只存公钥，即使服务端数据库泄露也无法得到私钥。', '从根本上消除密码泄露的风险。');
  g('Number Matching', '数字匹配', '密码进阶', 'MFA 推送时要求输入屏幕显示的数字，防"无脑点允许"。', '看到陌生数字就拒绝：不是你发起的验证。');
  g('Credential Stuffing', '撞库攻击', '密码进阶', '用其他网站泄露的账号密码组合批量尝试登录（人类重用密码）。', '检测特征：大量不同账号+同一来源+失败率高。');
  g('Password Manager', '密码管理器', '密码进阶', '安全存储和生成随机密码的工具（Bitwarden/1Password/KeePass）。', '主密码必须 MFA 保护+强密码——它是所有密码的钥匙。');

  /* —— 合规进阶 —— */
  g('GDPR 72-hour Rule', '72小时通知', '合规进阶', 'GDPR 要求个人数据泄露后在 72 小时内通知监管机构。', '超时通知可能面临额外处罚。');
  g('Data Classification', '数据分类分级', '合规进阶', '按数据的价值/敏感度分级（公开/内部/机密/核心），差异化保护。', '核心数据加密+审计，公开数据自由流通。');
  g('SOC 2 Type II', '—', '合规进阶', 'SOC 2 审计的观察期版本：需 3-12 个月证明控制项持续有效运行。', 'SaaS 公司拿企业客户的敲门砖。');
  g('Threat Modeling (STRIDE)', 'STRIDE 威胁建模', '合规进阶', '微软的威胁建模方法：Spoofing/Tampering/Repudiation/Info Disclosure/DoS/Elevation。', '设计阶段逐项过 STRIDE 六类威胁。');
  g('Security Metrics Dashboard', '安全指标大屏', '合规进阶', 'SOC 对外展示的核心指标可视化：告警量/闭环率/MTTD/MTTR/风险敞口。', '大屏要能回答管理层三个问题：现在安全吗、趋势如何、钱花得值吗。');

  const existing = new Set(GLOSSARY.map(g => g.t));
  const unique = G.filter(g => { if (existing.has(g.t)) return false; existing.add(g.t); return true; });
  GLOSSARY.push(...unique);
  ['检测工程', 'DFIR取证', 'AD攻防', '云安全进阶', '逆向分析', '合规进阶', '安全架构', '网络进阶', 'Web进阶', '密码进阶', '渗透进阶'].forEach(c => {
    if (!GLOSSARY_CATS.includes(c)) GLOSSARY_CATS.push(c);
  });
})();
