/* ============================================================
   data-plan-junior.js — 模块 8 · 初级安全运营 · 92 天实战路线
   来源：用户 92 天自学计划（整理补全）+ 站内补充
   数据结构与 data-lessons.js 一致（MODULES/LESSONS push）
   ============================================================ */
(function () {
  MODULES.push({
    id: 8, ico: '🐧', name: '初级安全运营 · 92天路线', color: 'li',
    desc: '完整的 92 天自学路线：Linux 补全 → 网络与抓包 → 靶场实战 → ATT&CK/SOC → ELK → Python 自动化 → 项目与求职',
    minutes: 2100,
  });

  const L = [];
  const add = (o) => L.push(o);

  /* ---------- 路线总览 ---------- */
  add({
    id: 'p92-00', module: 8, ico: '🗺️', title: '路线总览：92 天怎么学最有效',
    subtitle: '六个阶段 · 每日 2-3 小时 · 全程免费 · 目标是能干活', minutes: 12, tags: ['路线图', '必读'],
    content: [
      { type: 'p', html: '这是一条为<b>零基础 → 初级安全运营 / SOC 分析师</b>设计的完整路线。它不是知识点清单，而是一张"每天干什么"的施工图：理论 1 小时 + 实操 1 小时 + 笔记 30 分钟，学完每阶段都有能写进简历的产出。' },
      { type: 'table', head: ['阶段', '天数', '干什么', '产出'], rows: [
        ['一 Linux 收尾+网络', 'Day 1-14', 'Shell/日志/三剑客 + 网络与抓包', '日志分析速查表 + 抓包文件'],
        ['二 Web安全+靶场', 'Day 15-30', 'OWASP Top10 + DVWA + VulnHub', '漏洞复现记录 + 攻击特征手册'],
        ['ATT&CK+SOC流程', 'Day 31-32', '攻防通用语言 + 事件响应流程', 'ATT&CK 映射表 + 响应流程图'],
        ['三 SIEM/ELK', 'Day 33-52', 'Docker + ELK + 安全日志分析', '项目1：Web日志分析平台'],
        ['四 Python+AI', 'Day 53-72', '自动化脚本 + 规则引擎 + AI研判', '项目2：日志异常检测系统'],
        ['五 项目完善', 'Day 73-87', '3 个项目 + 简历 + 面试准备', '简历 + 面试题库'],
        ['六 求职冲刺', 'Day 88-92', '批量投递 + 面试跟进', 'offer 或调整策略'],
      ]},
      { type: 'h', text: '每日学习模板（严格执行）' },
      { type: 'code', text: '【今日学习】2-3 小时\n├─ 理论学习：1 小时（看视频/文档）\n├─ 动手实操：1 小时（跟着做，不要只看）\n├─ 笔记整理：30 分钟（用自己的话写，不要复制粘贴）\n└─ 疑问记录：不懂的先记下，周末统一查或问 AI' },
      { type: 'callout', ico: '💡', kind: 'tip', title: '三个铁律', html: '① <b>实操优先</b>：看懂 ≠ 会做，每节课必须有动手产出。② <b>笔记用自己的话</b>：抄书等于没学。③ <b>卡住超 30 分钟先休息</b>：卡壳是常态，回头再看往往秒懂。' },
      { type: 'callout', ico: '🧭', kind: 'mind', title: '和本站怎么配合', html: '92 天路线是<b>主线任务</b>；本站模块 1-7 是<b>概念速查</b>（卡壳时回看），游戏中心（SOC 值班室/日志侦探/CTF/护网模拟器）是<b>每日热身</b>。学每条路线前先玩 10 分钟对应游戏，效率更高。' },
    ],
    takeaways: ['92 天 = 6 个阶段，每阶段有明确产出', '每天 2-3 小时：理论 1h + 实操 1h + 笔记 30min', '卡住 30 分钟先休息，实操优先于看视频'],
    checks: [
      { q: '92 天路线中，"理论 1 小时 + 实操 1 小时 + 笔记 30 分钟"里最不能省的是？', opts: ['理论学习', '动手实操', '刷剧', '抄文档'], a: 1, ex: '看懂≠会做。安全运营是手艺活，实操和笔记优先于刷视频。' },
      { q: '学习卡住超过多久建议先休息？', opts: ['10 分钟', '30 分钟', '3 小时', '永不休息'], a: 1, ex: '卡壳超过 30 分钟先休息，回头再看往往秒懂。' },
    ],
  });

  /* ---------- Linux 补全 1 ---------- */
  add({
    id: 'p92-01', module: 8, ico: '🐧', title: 'Linux 补全（1）：权限体系与用户管理',
    subtitle: 'SUID/SGID/Sticky 深入 · useradd/group · sudoers —— 92 天计划的前置补全', minutes: 45, tags: ['Linux', '补全', '必会'],
    content: [
      { type: 'p', html: '92 天计划从"Shell 进阶"开始，默认你已会基础命令。这一课把安全运营最常用的<b>权限与账号</b>补扎实——排查入侵时你要回答的第一个问题就是："这个文件为什么能被执行？这个账号是谁加的？"' },
      { type: 'h', text: '权限位与三种特殊权限' },
      { type: 'code', text: 'ls -l /usr/bin/passwd\n-rwsr-xr-x 1 root root ... passwd\n#  ↑ s = SUID：执行者临时获得"文件属主"的权限\n\nchmod 4755 file   # SUID（4）\nchmod 2755 dir    # SGID（2）：目录内新文件继承组\nchmod 1755 dir    # Sticky（1）：/tmp 那样的"只有本人能删"' },
      { type: 'callout', ico: '🔍', kind: 'tip', title: '安全视角', html: '入侵者最爱留 <b>SUID 后门</b>。每周跑一次：<code>find / -perm -4000 -type f 2>/dev/null</code>，对照基线，多出来的就是警报（本站"实战靶场"游戏考的就是这个）。' },
      { type: 'h', text: '用户与组：排查与加固' },
      { type: 'code', text: 'cat /etc/passwd            # 账号清单（重点看 uid=0 的非 root 账号）\ncat /etc/shadow            # 密码哈希（root 才能读）\nuseradd -m -s /bin/bash ops01\nusermod -aG wheel ops01    # 加入 sudo 组（-a 追加，别漏了会把组覆盖掉）\npasswd -l svc_old          # 锁定账号（离职当天必做）\nlast                       # 历史登录\nlastlog                    # 每个账号最近一次登录' },
      { type: 'table', head: ['排查点', '命令', '警报信号'], rows: [
        ['隐藏的 uid=0 账号', "awk -F: '$3==0{print $1}' /etc/passwd", 'root 以外的任何账号'],
        ['能登录的账号', "awk -F: '$7!~/(nologin|false)/' /etc/passwd", '来路不明的 shell'],
        ['sudoers 被改', 'cat /etc/sudoers /etc/sudoers.d/*', 'NOPASSWD 出现在陌生账号'],
        ['空口令账号', "awk -F: '($2==\"\"){print $1}' /etc/shadow", '任何空口令都是洞'],
      ]},
      { type: 'callout', ico: '⚠️', kind: 'warn', title: '离职流程', html: '真实事故：离职员工账号半年后登录内网。账号治理三步：<b>离职当天锁账号 → 一周内回收 VPN/堡垒机权限 → 每月审计一次账号清单</b>。' },
    ],
    takeaways: ['SUID/SGID/Sticky 是提权和后门排查的高频点', 'uid=0 非 root 账号 = 直接警报', '离职当天锁号，每月审计一次账号清单'],
    checks: [
      { q: '发现一个 uid=0 但用户名不是 root 的账号，说明？', opts: ['正常现象', '极可能是后门账号', '系统自动创建的', '是访客账号'], a: 1, ex: 'uid=0 即 root 权限，多出来一个就是入侵者留的后门。' },
      { q: '排查 SUID 后门的命令是？', opts: ['ls -la /tmp', 'find / -perm -4000 -type f', 'cat /etc/passwd', 'ps aux'], a: 1, ex: 'find / -perm -4000 全盘找 SUID 文件，对照基线找异常。' },
    ],
  });

  /* ---------- Linux 补全 2 ---------- */
  add({
    id: 'p92-02', module: 8, ico: '⚙️', title: 'Linux 补全（2）：进程、服务与 systemd',
    subtitle: 'ps/top/kill · systemctl · journalctl · 开机自启排查', minutes: 40, tags: ['Linux', '补全', 'systemd'],
    content: [
      { type: 'p', html: '挖矿木马、反向 Shell、C2 心跳——它们活着就是"进程"，开机复活就是"服务"。这一课把进程与服务管理按<b>排查视角</b>串起来。' },
      { type: 'h', text: '进程排查三板斧' },
      { type: 'code', text: 'ps aux --sort=-%cpu | head      # CPU 占用 Top（挖矿第一现场）\nps -ef --forest                 # 进程树（看谁拉起了谁）\nlsof -p <PID>                   # 该进程打开的文件与网络连接\nlsof -i :4444                   # 谁在监听/连接 4444 端口\nkill -9 <PID>                   # 强杀（先记录再杀，留证据）' },
      { type: 'callout', ico: '🎯', kind: 'tip', title: '杀不死的进程', html: 'kill 完又复活 = 有<b>守护/定时拉起</b>。排查顺序：crontab -l → systemctl list-timers → /etc/rc.local → 父进程。只杀进程不清持久化 = 白干。' },
      { type: 'h', text: 'systemd：服务与自启' },
      { type: 'code', text: 'systemctl status nginx          # 服务状态\nsystemctl list-unit-files --state=enabled   # 开机自启清单\nsystemctl list-timers           # 定时器（新型持久化点）\nsystemctl cat nginx             # 看 unit 文件里 ExecStart 到底跑了什么\njournalctl -u sshd --since today   # 某服务今天的日志' },
      { type: 'table', head: ['入侵者常驻点', '位置', '排查命令'], rows: [
        ['恶意服务', '/etc/systemd/system/*.service', 'systemctl list-unit-files --state=enabled'],
        ['定时器', '/etc/systemd/system/*.timer', 'systemctl list-timers --all'],
        ['cron', '/var/spool/cron/ + /etc/cron*', 'crontab -l; ls -la /etc/cron.d/'],
        ['rc.local', '/etc/rc.local', 'cat /etc/rc.local'],
        ['profile 钩子', '/etc/profile.d/*.sh', 'ls -la /etc/profile.d/'],
      ]},
      { type: 'callout', ico: '📌', kind: 'mind', title: '记住这个顺序', html: '应急排查持久化 = <b>cron → systemd 服务/定时器 → rc.local → profile → SSH 公钥</b>，五处全查完才算查完。站内"日志侦探"游戏练的就是这个眼力。' },
    ],
    takeaways: ['杀不死的进程必有其持久化点，按五处清单排查', 'systemctl list-timers 是新型持久化排查点', '先记录（lsof/ps 快照）再杀进程，保留证据'],
    checks: [
      { q: 'kill 掉恶意进程后 5 分钟又复活，最先排查？', opts: ['重启服务器', 'crontab 与 systemd 定时器/服务', '重装系统', '换密码'], a: 1, ex: '复活=有拉起机制，cron 和 systemd service/timer 是两大常驻点。' },
      { q: '查看某服务开机自启后实际执行的命令，用？', opts: ['systemctl status', 'systemctl cat', 'journalctl', 'top'], a: 1, ex: 'systemctl cat 能看到 unit 文件里的 ExecStart 原文。' },
    ],
  });

  /* ---------- Linux 补全 3 ---------- */
  add({
    id: 'p92-03', module: 8, ico: '🔥', title: 'Linux 补全（3）：软件包、网络与防火墙',
    subtitle: 'apt/yum · ip/ss · firewalld/ufw/iptables · SSH 加固', minutes: 42, tags: ['Linux', '补全', '防火墙'],
    content: [
      { type: 'p', html: '封禁 IP、收紧端口、加固 SSH——安全运营 80% 的"处置动作"落在这一课。' },
      { type: 'h', text: '软件包管理（先查后装）' },
      { type: 'code', text: '# Debian/Ubuntu 系\napt list --installed | grep nginx\ndpkg -S /usr/sbin/nginx        # 文件属于哪个包\napt install htop && apt remove --purge 包名\n# CentOS/RHEL 系\nyum list installed | grep nginx\nrpm -qf /usr/sbin/nginx' },
      { type: 'h', text: '网络与连接排查' },
      { type: 'code', text: 'ip addr                        # 本机 IP\nip route                       # 路由表\nss -antp                       # 全部 TCP 连接+进程（netstat 现代版）\nss -antp | grep ESTAB | grep -v 127.0.0.1   # 可疑外联一眼锁定\ncurl -I http://目标            # HTTP 探测' },
      { type: 'callout', ico: '🚨', kind: 'warn', title: '外联排查口诀', html: '<b>ESTAB + 非内网 + 非业务端口 = 可疑外联</b>。常见恶意端口：4444/3333/5555（C2/矿池）。发现后：记录 PID → 杀进程 → 防火墙封目标 IP。' },
      { type: 'h', text: '防火墙三大家' },
      { type: 'code', text: '# ufw（Ubuntu，最简）\nsudo ufw allow from 10.1.1.5 to any port 22\nsudo ufw deny from 45.83.66.23        # 封恶意 IP\nsudo ufw status numbered\n\n# firewalld（CentOS）\nfirewall-cmd --permanent --add-rich-rule=\'rule family=ipv4 source address=45.83.66.23 reject\'\nfirewall-cmd --reload\n\n# iptables（通用底层）\niptables -I INPUT -s 45.83.66.23 -j DROP\niptables -L -n --line-numbers' },
      { type: 'h', text: 'SSH 加固五件套' },
      { type: 'ul', items: [
        '禁 root 密码登录：<b>PermitRootLogin no</b> 或 PermitRootLogin prohibit-password',
        '改默认端口 + <b>PasswordAuthentication no</b>（只留密钥）',
        'AllowUsers 白名单：只允许指定账号登录',
        '失败锁定：装 fail2ban（5 次失败封 10 分钟）',
        '定期审计：grep Accepted /var/log/secure 看有没有陌生来源',
      ]},
    ],
    takeaways: ['处置动作三板斧：杀进程、封 IP、修配置', 'ss -antp 是外联排查第一命令', 'SSH 加固五件套：禁root密码、密钥登录、白名单、fail2ban、定期审计'],
    checks: [
      { q: '发现服务器连着 45.83.66.23:3333（ESTAB），第一步？', opts: ['直接重启', '记录 PID 与连接再处置', '拔网线', '改 root 密码'], a: 1, ex: '先记录（lsof/ps 快照留证据），再杀进程、封 IP、查持久化。' },
      { q: 'ufw 封禁一个恶意 IP 的命令？', opts: ['ufw delete 45.83.66.23', 'ufw deny from 45.83.66.23', 'ufw add block ip', 'deny 45.83.66.23'], a: 1, ex: 'ufw deny from <IP> 即封禁，ufw status 查看。' },
    ],
  });

  /* ---------- Day 1-4 Shell ---------- */
  add({
    id: 'p92-04', module: 8, ico: '📜', title: 'Day 1-4：Shell 编程进阶（韩顺平 P94-P107）',
    subtitle: '位置参数 · 运算判断 · 分支循环函数 · 定时备份案例', minutes: 120, tags: ['Shell', 'Day1-4'],
    content: [
      { type: 'p', html: 'Shell 是安全运营的"瑞士军刀"：批量取日志、定时拉取告警、快速统计都靠它。对应韩顺平 Linux P94-P107。' },
      { type: 'h', text: 'Day 1：位置参数与预定义变量' },
      { type: 'code', text: '#!/bin/bash\necho "命令本身: $0"\necho "第一个参数: $1"\necho "所有参数($@): $@"\necho "参数个数: $#"\necho "上一命令退出状态: $?"\n# 运行: ./test.sh hello world 123' },
      { type: 'h', text: 'Day 2：运算与条件判断' },
      { type: 'code', text: 'RESULT=$((2+3)); expr 3 + 5\n[ 5 -gt 3 ] && echo yes || echo no\n# 常用判断：-e 存在 -f 是文件 -d 是目录 -r 可读 -w 可写' },
      { type: 'h', text: 'Day 3：分支循环函数 —— 综合案例：日志分析脚本' },
      { type: 'code', text: '#!/bin/bash\nread -p "日志路径: " LOGFILE\n[ ! -f "$LOGFILE" ] && echo "不存在" && exit 1\necho "总行数: $(wc -l < $LOGFILE)"\necho "404 次数: $(grep -c 404 $LOGFILE)"\necho "=== IP TOP5 ==="\ngrep -oE \'([0-9]{1,3}\\.){3}[0-9]{1,3}\' $LOGFILE | sort | uniq -c | sort -rn | head -5' },
      { type: 'h', text: 'Day 4：定时备份案例（运营必会）' },
      { type: 'code', text: '#!/bin/bash\nDATE=$(date +%Y%m%d_%H%M%S)\ntar -czf /opt/backup/backup_$DATE.tar.gz /home/yourname/Documents\ncrontab -e   # 加一行：每天凌晨 2 点\n0 2 * * * /bin/bash /home/you/backup.sh >> /var/log/backup.log 2>&1' },
      { type: 'callout', ico: '💡', kind: 'tip', title: '学法', html: '每个案例<b>亲手敲进终端跑通</b>。备份脚本改造一下就是你以后"定时拉取告警日志"的雏形。' },
    ],
    takeaways: ['$@ 与 $* 区别、$? 退出码是脚本排错基础', '日志分析脚本 = grep+awk+sort+uniq+head 组合拳', 'crontab 五段式：分 时 日 月 周'],
    checks: [
      { q: 'crontab "0 2 * * *" 表示？', opts: ['每小时第2分', '每天凌晨2点', '每周一2点', '每2小时'], a: 1, ex: '五段=分 时 日 月 周，0 2 * * * 即每天 02:00。' },
      { q: '统计日志中 IP 出现次数最多的组合拳是？', opts: ['sort | grep ip', 'grep -oE IP正则 | sort | uniq -c | sort -rn', 'wc -l', 'cat | head'], a: 1, ex: '提取→排序→计数→再排序→取头部，是日志统计的万能套路。' },
    ],
  });

  /* ---------- Day 5-7 日志 ---------- */
  add({
    id: 'p92-05', module: 8, ico: '📊', title: 'Day 5-7：日志管理与三剑客实战',
    subtitle: 'rsyslog · logrotate · grep/awk/sed 深度练习', minutes: 130, tags: ['日志', '三剑客', 'Day5-7'],
    content: [
      { type: 'p', html: '安全运营的日常 = 和日志打交道。这两天把"日志从哪来、怎么轮转、怎么分析"一次打通。' },
      { type: 'h', text: 'Day 5：rsyslog 原理与配置' },
      { type: 'code', text: 'ls /var/log/                  # syslog/auth.log(secure)/cron...\ncat /etc/rsyslog.conf          # 规则格式：设施.级别  动作\n# 例：*.* /var/log/all.log   （存所有）\nlogger -p user.info "测试日志" # 手动写一条测试' },
      { type: 'h', text: 'Day 6：logrotate 轮替' },
      { type: 'code', text: '/etc/logrotate.d/myapp:\n/var/log/myapp/*.log {\n    daily rotate 7 compress missingok notifempty\n    create 0644 root root\n}\nlogrotate -d /etc/logrotate.d/myapp   # -d 调试试跑' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '为什么运营要懂轮替', html: '排查"昨晚 3 点的攻击"却发现日志被轮转压缩了——你得知道去 <code>/var/log/*.log.1.gz</code> 里用 <code>zgrep</code> 找。安全日志要求集中存储 180 天以上，轮替策略直接决定你能不能回溯。' },
      { type: 'h', text: 'Day 7：三剑客深度练习（安全向）' },
      { type: 'code', text: '# 模拟 Web 日志找"暴力破解嫌疑"\nawk \'$9==403 {print $1}\' /tmp/test_web.log | sort | uniq -c | sort -rn | awk \'$1>=3{print "嫌疑IP:"$2,"次数:"$1}\'\n\n# 状态码分布\nawk \'{print $9}\' access.log | sort | uniq -c | sort -rn\n\n# sed 标记可疑 IP\nsed \'s/10\\.0\\.0\\.50/[SUSPICIOUS]&/\' access.log' },
      { type: 'table', head: ['需求', '命令'], rows: [
        ['所有 403 行', 'grep " 403 " access.log'],
        ['403 计数', 'grep -c " 403 " access.log'],
        ['提取 IP 列', "awk '{print $1}' access.log"],
        ['IP 计数 Top5', "awk '{print $1}' a.log | sort | uniq -c | sort -rn | head -5"],
        ['删除 200 行', "sed '/ 200 /d' access.log"],
      ]},
      { type: 'callout', ico: '🎮', kind: 'tip', title: '练手场', html: '站内<b>「日志侦探」</b>42 案就是这三剑客的陪练——每天开一局，两周后你 grep 会形成肌肉记忆。' },
    ],
    takeaways: ['rsyslog 规则=设施.级别+动作；logger 可手动造日志', '轮替日志用 zgrep/zcat 回溯，日志留存≥180天', '提取→sort→uniq -c→sort -rn 是统计万能套路'],
    checks: [
      { q: '回溯昨天被压缩轮转的日志用什么？', opts: ['cat', 'zgrep', 'tail', 'less'], a: 1, ex: 'zgrep/zcat 直接读 .gz 压缩日志。' },
      { q: 'uniq -c 前为什么通常先 sort？', opts: ['更快', 'uniq 只合并相邻重复', '为了好看', '必须的格式'], a: 1, ex: 'uniq 只合并相邻行，先 sort 把相同行排一起才能正确计数。' },
    ],
  });

  /* ---------- Day 8-14 网络 ---------- */
  add({
    id: 'p92-06', module: 8, ico: '🌐', title: 'Day 8-14：网络基础与抓包（湖科大 + Wireshark + Nmap）',
    subtitle: 'OSI/TCP-IP · 三次握手 · HTTP 状态码 · Wireshark · Nmap', minutes: 180, tags: ['网络', 'Wireshark', 'Nmap'],
    content: [
      { type: 'p', html: '看不懂网络，就看不懂告警。这一周用湖科大《计算机网络微课堂》打底，再用 Wireshark 和 Nmap 把理论"抓"到手里。' },
      { type: 'h', text: 'Day 8-11：必须背下来的框架' },
      { type: 'table', head: ['层', '关键词', '安全关注点'], rows: [
        ['应用层', 'HTTP/FTP/DNS', 'SQL注入、XSS 都发生在这一层'],
        ['传输层', 'TCP/UDP、端口', '端口扫描、C2 回连端口'],
        ['网络层', 'IP、路由', '来源 IP 封禁、溯源'],
        ['链路层', 'MAC、帧', 'ARP 欺骗'],
      ]},
      { type: 'code', text: 'TCP 三次握手：\n  客户端 → SYN(seq=x) → 服务端\n  客户端 ← SYN+ACK(seq=y,ack=x+1) ← 服务端\n  客户端 → ACK(ack=y+1) → 服务端\n四次挥手：FIN → ACK → FIN → ACK' },
      { type: 'h', text: 'Day 12：HTTP 与 F12 开发者工具' },
      { type: 'ul', items: [
        'F12 → Network：观察请求方法/状态码/请求头响应头',
        '必背状态码：<b>200</b> 成功 · <b>301/302</b> 重定向 · <b>403</b> 拒绝 · <b>404</b> 未找到 · <b>500</b> 服务器错误 · <b>502/503</b> 网关异常',
        '安全视角：大量 404=目录扫描；同 IP 高频 403/401=爆破；URL 带 union/select=注入尝试',
      ]},
      { type: 'h', text: 'Day 13-14：Wireshark + Nmap' },
      { type: 'code', text: '# Wireshark 过滤器\ntcp.port == 80        # 跟踪 TCP 握手\nhttp                  # 明文 HTTP 请求\nudp.port == 53        # DNS 查询\n右键 → Follow → TCP Stream  # 还原完整会话\n\n# Nmap\nnmap -sn 192.168.1.0/24        # 存活扫描\nnmap -sV -O 目标                # 版本+系统探测\nnmap -p 1-65535 目标            # 全端口' },
      { type: 'callout', ico: '🎯', kind: 'tip', title: '运营视角', html: '你以后看的"全流量告警"就是 Wireshark 的自动化版。现在能手工读懂三次握手，以后才能看懂 NDR 告警里的会话重建。' },
    ],
    takeaways: ['TCP 三次握手/四次挥手必须能默画', '大量404=扫描，同源高频失败=爆破——状态码是告警语言', 'Wireshark 过滤器 + Follow Stream 是流量取证基本功'],
    checks: [
      { q: 'SYN → SYN/ACK → ？', opts: ['FIN', 'ACK', 'RST', 'PSH'], a: 1, ex: '三次握手第三步是客户端回 ACK。' },
      { q: '某 IP 1 小时内产生 3500 条 404，最可能是？', opts: ['用户手滑', '目录扫描攻击', 'DNS 故障', '正常爬虫'], a: 1, ex: '404 洪峰+路径集中=目录爆破特征（注意排除已知爬虫白名单）。' },
    ],
  });

  /* ---------- Day 15-24 DVWA ---------- */
  add({
    id: 'p92-07', module: 8, ico: '💉', title: 'Day 15-24：OWASP Top10 + DVWA 靶场实战',
    subtitle: '注入/XSS/CSRF/上传/命令注入/爆破 · 从攻击学到防守', minutes: 220, tags: ['DVWA', 'OWASP', '靶场'],
    content: [
      { type: 'p', html: '防守者必须见过攻击。这两周在 DVWA 靶场把 OWASP Top10 亲手打一遍——注意：<b>仅在本地靶场练习</b>，对未授权系统测试是违法的。' },
      { type: 'h', text: '环境与主线' },
      { type: 'code', text: '# Kali 一键装依赖后：\ncd /var/www/html && sudo git clone https://github.com/digininja/DVWA.git dvwa\ncp config.inc.php.dist config.inc.php && vim config.inc.php   # 配数据库\nsudo mysql -e "CREATE DATABASE dvwa;"\n# 访问 http://localhost/dvwa/setup.php → Create Database → admin/password 登录' },
      { type: 'h', text: 'SQL 注入（Low）完整手工流程' },
      { type: 'code', text: "1'                          # 报错 → 存在注入点\n1' OR '1'='1                # 万能条件\n1' ORDER BY 2 --            # 二分试字段数\n1' UNION SELECT 1,database()--\n1' UNION SELECT 1,group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()--\n1' UNION SELECT user,password FROM users--" },
      { type: 'h', text: '其他模块要点' },
      { type: 'ul', items: [
        '<b>XSS</b>：反射型 URL 参数触发；存储型留言板持久化；Medium 用 <code>&lt;img src=x onerror=alert(1)&gt;</code> 绕 <code>&lt;script&gt;</code> 过滤',
        '<b>文件上传</b>：直接传 shell.php → 访问 uploads/shell.php?cmd=whoami；防御=白名单+目录禁执行',
        '<b>命令注入</b>：<code>127.0.0.1; cat /etc/passwd</code>；防御=禁特殊字符+参数化',
        '<b>CSRF</b>：改密码链接无 Token，构造诱导链接即改密；防御=CSRF Token+SameSite',
        '<b>爆破</b>：Hydra/Burp Intruder 跑字典；防御=验证码+失败锁定',
      ]},
      { type: 'table', head: ['漏洞', '防守方怎么检测'], rows: [
        ['SQL 注入', 'WAF 日志、数据库异常查询、URL 带 union/select'],
        ['XSS', '请求含 <script>/onerror、CSP 上报'],
        ['爆破', '同 IP 高频登录失败、失败后成功'],
        ['文件上传', '上传目录新增可执行文件、POST 到上传接口'],
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: 'Day 24 关键转折', html: '打完每个漏洞都写一行：<b>"如果我是防守方，去哪个日志里找什么特征？"</b>——这张攻防对照表就是你从"打靶场的"变"做运营的"的通行证。' },
    ],
    takeaways: ['手工注入六步：报错→万能条件→ORDER BY→UNION→库→表→列→数据', '每个漏洞都要写"防守方检测方法"', '靶场仅限本地练习，未授权测试违法'],
    checks: [
      { q: "判断注入点最简单的一步是？", opts: ["输入 1' 看是否报错", "扫描端口", "ping 目标", "看页面颜色"], a: 0, ex: "单引号破坏 SQL 结构引发报错，是最快的注入点探测。" },
      { q: "防 SQL 注入最有效的方案？", opts: ['关键词过滤', '参数化查询/预编译', '隐藏报错', '换数据库'], a: 1, ex: '参数化让用户输入永远当"数据"不当"代码"，是根治方案。' },
    ],
  });

  /* ---------- Day 25-30 进阶 ---------- */
  add({
    id: 'p92-08', module: 8, ico: '🗡️', title: 'Day 25-30：注入深入 · SQLMap · Burp · VulnHub 靶机',
    subtitle: '盲注 · tamper · Burp 模块 · 靶机信息收集到 Getshell · 攻击特征手册', minutes: 150, tags: ['SQLMap', 'Burp', 'VulnHub'],
    content: [
      { type: 'p', html: '从"会打 DVWA"到"会打真实结构"：补注入进阶、抓包工具链，以及第一台完整靶机。' },
      { type: 'h', text: '注入四类型与 SQLMap' },
      { type: 'code', text: '# 报错注入\n1\' AND extractvalue(1,concat(0x7e,database()))--\n# 时间盲注\n1\' AND IF(ASCII(SUBSTR(database(),1,1))>100,SLEEP(5),0)--\n\n# SQLMap（Medium 级别要带 Cookie）\nsqlmap -u "http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \\\n  --cookie="PHPSESSID=xxx; security=medium" --dbs --batch\nsqlmap -u "..." --tamper=space2comment      # WAF 绕过' },
      { type: 'h', text: 'Burp Suite 三板斧' },
      { type: 'ul', items: [
        '<b>Proxy</b>：浏览器代理 127.0.0.1:8080，拦截改包',
        '<b>Repeater</b>：重放并修改请求（手工注入必备）',
        '<b>Intruder</b>：爆破与模糊测试（标记变量 → 载入字典 → 攻击）',
      ]},
      { type: 'h', text: 'VulnHub 靶机标准流程（Day 28-29）' },
      { type: 'code', text: 'nmap -sn 192.168.1.0/24            # 找靶机 IP\nnmap -sV -sC -O 靶机IP              # 全信息扫描\ngobuster dir -u http://靶机IP -w /usr/share/wordlists/dirb/common.txt\nsearchsploit 服务名 版本             # 查公开漏洞\n# getshell 后：\nid; uname -a; sudo -l               # 提权三连' },
      { type: 'h', text: 'Day 30：攻击特征总结（重点产出）' },
      { type: 'table', head: ['攻击', '日志特征', '检测方法'], rows: [
        ['SQL 注入', "URL 含 ' union select --", 'WAF 日志、DB 异常查询'],
        ['XSS', '请求含 <script> onerror', 'Web 日志、CSP 报告'],
        ['爆破', '同源高频登录失败', '登录失败日志+频率统计'],
        ['文件上传', 'POST 可执行文件到上传口', '上传日志+类型检测'],
        ['目录遍历', 'URL 含 ../', '访问日志分析'],
      ]},
      { type: 'callout', ico: '📄', kind: 'tip', title: '产出即简历素材', html: '这张"攻击特征手册"直接对应以后你的<b>SIEM 规则开发</b>工作——规则的本质就是把这张表写成机器可执行的查询。' },
    ],
    takeaways: ['盲注=通过报错/延时让服务器"传话"', '靶机流程：发现→扫描→搜漏洞→利用→提权', '攻击特征手册是 SIEM 规则的雏形'],
    checks: [
      { q: '时间盲注靠什么判断注入成功？', opts: ['页面报错', '响应延时', '状态码', '弹窗'], a: 1, ex: 'SLEEP(5) 让服务器延时回应，用时间差传递信息。' },
      { q: '从防守方看，爆破攻击最直接的日志特征？', opts: ['同源 IP 高频登录失败', '404 增多', 'DNS 变慢', 'CPU 升高'], a: 0, ex: '登录失败频率是爆破检测的第一信号。' },
    ],
  });

  /* ---------- Day 31-32 ATT&CK/SOC ---------- */
  add({
    id: 'p92-09', module: 8, ico: '🧭', title: 'Day 31-32：MITRE ATT&CK 框架与 SOC 工作流程',
    subtitle: '攻防通用语言 · T 编号 · Tier 分级 · NIST 四阶段 · MTTD/MTTR', minutes: 60, tags: ['ATT&CK', 'SOC', '面试必考'],
    content: [
      { type: 'p', html: '这两 天是"从会打靶场"到"懂安全运营"的分水岭——<b>面试几乎必考，SIEM 规则全按它命名</b>。' },
      { type: 'h', text: 'ATT&CK：攻击者的行为字典' },
      { type: 'table', head: ['战术（Tactic）', '编号', '一句话'], rows: [
        ['初始访问 Initial Access', 'TA0001', '怎么进来的（钓鱼/漏洞利用）'],
        ['执行 Execution', 'TA0002', '跑了什么（命令/脚本）'],
        ['持久化 Persistence', 'TA0003', '怎么赖着不走（计划任务/服务）'],
        ['防御规避 Defense Evasion', 'TA0005', '怎么躲监控（白加黑/无文件）'],
        ['凭证访问 Credential Access', 'TA0006', '偷密码（Mimikatz/喷洒）'],
        ['横向移动 Lateral Movement', 'TA0008', '怎么扩散（psexec/PTH）'],
        ['数据外泄 Exfiltration', 'TA0010', '怎么偷出去（隧道/网盘）'],
      ]},
      { type: 'table', head: ['你学过的攻击', 'ATT&CK 技术'], rows: [
        ['SQL 注入', 'T1190 利用面向公网的应用'],
        ['暴力破解', 'T1110'],
        ['文件上传 Getshell', 'T1505.003 Web Shell'],
        ['计划任务持久化', 'T1053'],
      ]},
      { type: 'h', text: 'SOC 分级与响应流程' },
      { type: 'ul', items: [
        '<b>Tier 1</b>：盯告警、确认真伪、打标签、按流程升级',
        '<b>Tier 2</b>：深度调查、确认事件、执行遏制',
        '<b>Tier 3</b>：逆向分析、威胁狩猎、规则研究',
        '<b>升级路径</b>：告警(Alert) ≠ 事件(Event) ≠ 事故(Incident)——"告警不等于事件，事件不等于事故"',
      ]},
      { type: 'code', text: 'NIST 事件响应四阶段：\n准备 → 检测与分析 → 遏制/消除/恢复 → 事后复盘\n\n关键指标：\nMTTD 平均检测时间（越短越强）\nMTTR 平均响应时间（考核硬指标）' },
      { type: 'callout', ico: '🎤', kind: 'tip', title: '面试标准答法', html: '"你如何处理安全事件？"——按 Day 32 流程答：<b>确认真伪（看原始日志）→ 定影响面 → 打标签升级 → 遏制 → 复盘加固</b>。' },
    ],
    takeaways: ['ATT&CK 是攻击行为字典，SIEM 规则按 T 编号命名', '告警≠事件≠事故，先研判再升级', 'MTTD/MTTR 是运营团队的两把尺'],
    checks: [
      { q: 'SIEM 检测规则通常按什么命名分类？', opts: ['颜色', 'ATT&CK 技术编号', '日期', '随机名'], a: 1, ex: 'ATT&CK 是行业通用语言，规则/报告/复盘全用它对齐。' },
      { q: 'SIEM 弹了一条告警，Tier 1 第一件事？', opts: ['直接封 IP', '查原始日志确认真伪', '重启设备', '发朋友圈'], a: 1, ex: '告警≠事件，先看原始日志定性再动作。' },
    ],
  });

  /* ---------- Day 33-43 ELK ---------- */
  add({
    id: 'p92-10', module: 8, ico: '🧱', title: 'Day 33-43：Docker 与 ELK 平台搭建',
    subtitle: 'Docker/Compose · Elasticsearch/Kibana/Logstash · Grok 解析 · 可视化', minutes: 200, tags: ['ELK', 'Docker', 'SIEM'],
    content: [
      { type: 'p', html: 'ELK 是安全运营最主流的日志平台。这十天用 Docker 把它搭起来，并把 Web 日志喂进去做成可视化。' },
      { type: 'h', text: 'Day 33-37：Docker 速成' },
      { type: 'code', text: 'docker pull/run/ps/stop/rm 镜像与容器四件套\nDockerfile：FROM → RUN → COPY → EXPOSE → CMD\ndocker-compose up -d / down / logs -f\ndocker network create elk-network' },
      { type: 'h', text: 'Day 38-40：ELK 三件套 compose 骨架' },
      { type: 'code', text: 'services:\n  elasticsearch:\n    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0\n    environment: [discovery.type=single-node, xpack.security.enabled=false, ES_JAVA_OPTS=-Xms512m -Xmx512m]\n    ports: ["9200:9200"]\n  kibana:\n    image: docker.elastic.co/kibana/kibana:8.11.0\n    ports: ["5601:5601"]\n    environment: [ELASTICSEARCH_HOSTS=http://elasticsearch:9200]\n  logstash:\n    image: docker.elastic.co/logstash/logstash:8.11.0\n    volumes: ["./logstash/pipeline:/usr/share/logstash/pipeline", "./logs:/logs"]' },
      { type: 'h', text: 'Logstash 管道（Input→Filter→Output）' },
      { type: 'code', text: 'input { file { path => "/logs/*.log" start_position => "beginning" } }\nfilter {\n  grok { match => { "message" => "%{COMBINEDAPACHELOG}" } }\n  date { match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ] }\n}\noutput { elasticsearch { hosts => ["elasticsearch:9200"] index => "weblogs-%{+YYYY.MM.dd}" } }' },
      { type: 'h', text: 'Day 41-43：Kibana 三连' },
      { type: 'ul', items: [
        '<b>索引模式</b>：Stack Management → Index Patterns → weblogs-*（时间字段 @timestamp）',
        '<b>Discover</b>：KQL 查询 response:404、clientip:10.0.0.50',
        '<b>可视化</b>：柱状图（状态码分布）· 饼图（HTTP 方法）· 折线（时间趋势）→ 组装 Dashboard',
      ]},
      { type: 'callout', ico: '💾', kind: 'warn', title: '内存提醒', html: 'ES_JAVA_OPTS 先给 512m-1g，家用虚拟机别拉满；磁盘要留 20% 以上，否则 ES 会锁写。' },
    ],
    takeaways: ['ELK=采集(Logstash)+存储检索(ES)+展示(Kibana)', 'Grok 把一行日志拆成结构化字段', '索引模式+KQL 是 Kibana 分析入口'],
    checks: [
      { q: '把一行 Apache 日志拆成 IP/URL/状态码，用 Logstash 的？', opts: ['input', 'grok 过滤器', 'output', 'curl'], a: 1, ex: 'grok 用正则模式（如 %{COMBINEDAPACHELOG}）做结构化解析。' },
      { q: 'Kibana 搜"404 请求"的正确 KQL？', opts: ['status=404', 'response:404', 'SELECT 404', 'grep 404'], a: 1, ex: 'KQL 语法为 字段:值。' },
    ],
  });

  /* ---------- Day 44-52 安全日志与项目1 ---------- */
  add({
    id: 'p92-11', module: 8, ico: '🚨', title: 'Day 44-52：安全日志分析告警 + 项目1（ELK 平台）',
    subtitle: '公开数据集 · 安全可视化 · 告警规则 · 404/登录场景报告 · Elastic Security', minutes: 160, tags: ['SIEM', '告警', '项目1'],
    content: [
      { type: 'p', html: '把 ELK 从"看访问日志"升级成"抓攻击者"：喂真实安全数据集、建安全可视化、配告警规则，最后收口成<b>简历项目 1</b>。' },
      { type: 'h', text: 'Day 44-46：数据与可视化' },
      { type: 'ul', items: [
        '数据集来源：Kaggle（Web Server Logs/CyberSecurity）、SecRepo、CICIDS2017',
        'CSV 数据用 Logstash csv 过滤器解析（columns 指定列名）',
        '安全可视化四件套：源 IP Top10（条形）、攻击类型分布（饼）、时间趋势（折线）、目标端口（表格）',
      ]},
      { type: 'h', text: 'Day 47：告警规则' },
      { type: 'code', text: 'Kibana → Stack Management → Alerts:\n规则1「大量404检测」: 5 分钟内 404 > 100 次，每 1 分钟检查\n规则2「可疑IP访问」: 特定 IP 出现次数超阈值' },
      { type: 'h', text: 'Day 48-49：两个模拟场景（分析报告模板）' },
      { type: 'code', text: '场景A 大量404：\n现象：1小时 404=3500（基线50）｜92%来自 10.0.0.99\n路径：/admin /wp-login /.env → 结论：目录扫描\n建议：封禁 10.0.0.99，加 WAF 规则\n\n场景B 异常登录：\n维度：失败次数 / 成功时间分布 / 来源IP / 尝试用户名\n产出：失败vs成功时间线 + 来源分布' },
      { type: 'h', text: 'Day 51-52：项目 1 收口（加 Elastic Security）' },
      { type: 'ul', items: [
        'Kibana → Security：体验 Alerts/Rules/Timeline',
        '创建检测规则：Custom query → http.response.status_code:404，>100 触发',
        'README 写清：描述/技术栈(ELK8.11+Docker)/功能四条/截图',
      ]},
      { type: 'callout', ico: '📄', kind: 'tip', title: '简历表述（可直接抄）', html: '"使用 Docker Compose 部署 ELK 8.11，Grok 解析 Apache 日志，构建状态码/IP Top10/趋势 Dashboard，配置 404 异常与可疑 IP 告警，并使用 Elastic Security 建立自定义检测规则。"' },
    ],
    takeaways: ['告警=阈值+频率+白名单，先排爬虫再定性', '分析报告套路：现象→源IP→路径→结论→建议', '项目1 = ELK + 告警 + Elastic Security 三件套'],
    checks: [
      { q: '大量 404 告警的第一步研判？', opts: ['直接封 IP', '排除白名单爬虫/合作方再定性', '重启网站', '报警察'], a: 1, ex: '先看来源是否为已知爬虫/漏扫白名单，再定性为攻击。' },
      { q: '告警分析报告的五段套路？', opts: ['现象-源IP-路径-结论-建议', '时间-地点-人物', '开头-中间-结尾', '随意写'], a: 0, ex: '现象(量级/基线)→源IP→路径特征→定性结论→处置建议。' },
    ],
  });

  /* ---------- Day 53-62 Python+AI ---------- */
  add({
    id: 'p92-12', module: 8, ico: '🐍', title: 'Day 53-62：Python 基础与 AI 辅助分析',
    subtitle: '正则/统计/文件操作 · 让 AI 当分析助手 · 结构化 JSON 研判', minutes: 180, tags: ['Python', 'AI', 'Day53-62'],
    content: [
      { type: 'p', html: 'Python 是把"重复劳动"自动化的大杀器；AI 是放大你效率的副驾驶。这十天：基础四课 + AI 三课，零基础友好。' },
      { type: 'h', text: 'Day 53-56：四天基础' },
      { type: 'code', text: '# 文件与字符串\nwith open("a.log") as f:\n    for line in f:\n        if "403" in line: print(line.strip())\n\n# 正则三连\nip = re.search(r"((\\d{1,3}\\.){3}\\d{1,3})", line).group()\nstatus = re.search(r\'"\\s+(\\d{3})\\s+\', line).group(1)\n\n# 统计（Counter 一行流）\nCounter(ips).most_common(5)' },
      { type: 'h', text: 'Day 57-59：日志分析脚本（跑通即过关）' },
      { type: 'code', text: 'def detect_sqli(log_file):\n    keywords = ["union","select","--","\\""]\n    alerts = []\n    for n, line in enumerate(open(log_file), 1):\n        for kw in keywords:\n            if kw in line.lower():\n                alerts.append({"line": n, "kw": kw}); break\n    return alerts' },
      { type: 'h', text: 'Day 60-62：AI 结构化研判三铁律' },
      { type: 'ul', items: [
        '<b>铁律1</b>：只喂结构化 JSON，不喂原始日志（喂证据摘要）',
        '<b>铁律2</b>：强制输出固定 JSON schema（severity/attack_type/behaviors/recommendation/confidence）',
        '<b>铁律3</b>：AI 结论是建议不是判决——与规则引擎结论不一致时记"AI 误判案例"',
      ]},
      { type: 'code', text: 'Prompt 模板：\n分析以下安全告警，严格按 JSON 输出不要多余内容：\n{"severity":"high|medium|low","attack_type":"...","behaviors":[],"recommendation":"...","confidence":0.0-1.0}\n数据：{"ip":"10.0.0.50","failed_logins":23,"window":"5分钟"}' },
      { type: 'callout', ico: '🤖', kind: 'tip', title: 'AI 的正确姿势', html: 'AI 最擅长：写正则、写 KQL、解释复杂日志、起草报告。最不可信：未经你验证的"最终结论"。让 AI 当副驾驶，方向盘在你手里。' },
    ],
    takeaways: ['Python 四件套：文件/字符串/正则/Counter', 'AI 研判三铁律：JSON进、JSON出、结论当建议', 'AI 最擅长写正则/KQL/报告，结论必须人工验证'],
    checks: [
      { q: '给 AI 喂原始 10 万行日志合适吗？', opts: ['合适', '不合适，应喂结构化摘要', '越多越好', '看心情'], a: 1, ex: '喂结构化证据摘要，输出固定 schema——可控、可程序化处理。' },
      { q: '统计 IP 出现次数最简洁的写法？', opts: ['手写 if 计数', 'Counter(ips).most_common(5)', 'sort 命令', 'Excel'], a: 1, ex: 'collections.Counter 一行完成计数与排序。' },
    ],
  });

  /* ---------- Day 63-72 项目2 ---------- */
  add({
    id: 'p92-13', module: 8, ico: '🏭', title: 'Day 63-72：项目2 · 规则引擎 + AI 研判检测系统',
    subtitle: '五层流水线 · 滑动窗口 · 5 条检测规则 · 混淆矩阵评估', minutes: 200, tags: ['项目2', '规则引擎', '简历'],
    content: [
      { type: 'p', html: '这是你简历上最能打的项目：<b>解析 → 特征 → 规则 → AI 研判 → 报告</b> 五层流水线，用标注数据给出检测率与误报率。' },
      { type: 'h', text: '架构与分工' },
      { type: 'code', text: '原始日志 → 解析层 → 特征层 → 规则引擎 → AI研判 → HTML报告\n                        ↑ 90% 的检测靠规则，AI 只处理可疑样本' },
      { type: 'h', text: '特征层：滑动时间窗口' },
      { type: 'code', text: 'class SlidingWindow:\n    def __init__(self, window_sec=300):\n        self.win = window_sec; self.ip = defaultdict(deque)\n    def add(self, ip, t):\n        q = self.ip[ip]; q.append(t)\n        while q and (t - q[0]).total_seconds() > self.win: q.popleft()\n    def count(self, ip): return len(self.ip[ip])' },
      { type: 'h', text: '规则层：五条起步规则' },
      { type: 'table', head: ['规则', '逻辑', '对应攻击'], rows: [
        ['sqli_detect', "参数含 ' union select --", 'SQL 注入'],
        ['brute_force_window', '5 分钟同 IP 失败 ≥10', '暴力破解'],
        ['dir_scan', '1 分钟同 IP ≥20 个不同 404 路径', '目录扫描'],
        ['xss_detect', '参数含 <script> onerror javascript:', 'XSS'],
        ['webshell_access', '访问上传目录 .php 且 UA 非浏览器', 'WebShell'],
      ]},
      { type: 'h', text: '评估（Day 70）' },
      { type: 'code', text: '# DVWA 造攻击流量 + 正常浏览流量混合 → 标注 ground truth\nprint(f"检测率: {tp/(tp+fn)*100:.1f}%")   # 目标 ≥90%\nprint(f"误报率: {fp/(fp+tn)*100:.1f}%")   # 目标 ≤5%' },
      { type: 'callout', ico: '📄', kind: 'tip', title: '简历表述（可直接抄）', html: '"Python 五层检测流水线：自研 5 条规则（SQLi/爆破/扫描/XSS/WebShell）+ 滑动窗口；AI 对规则命中样本做 JSON 结构化研判；标注集上检测率 XX%、误报率 XX%。"' },
    ],
    takeaways: ['五层流水线：解析→特征→规则→AI研判→报告', '规则打主力，AI 只做可疑样本研判', '检测率≥90%、误报率≤5% 是简历上的硬指标'],
    checks: [
      { q: '滑动窗口解决的问题？', opts: ['统计总量', '按时间范围统计行为频率', '压缩日志', '画图'], a: 1, ex: '"5分钟内失败≥10次"这类频率型规则都靠滑动窗口实现。' },
      { q: '为什么 AI 只处理规则命中的可疑样本？', opts: ['AI 太贵太慢且会误判', 'AI 不会写代码', '规则没用', '随机'], a: 0, ex: '规则引擎精准高效打主力，AI 补研判降误报，各司其职。' },
    ],
  });

  /* ---------- Day 73-87 项目3+求职准备 ---------- */
  add({
    id: 'p92-14', module: 8, ico: '💼', title: 'Day 73-87：项目3 · 简历 · 面试准备',
    subtitle: 'DVWA 防御分析报告 · VulnHub 中级靶机 · 简历模板 · 高频面试题', minutes: 180, tags: ['简历', '面试', '项目3'],
    content: [
      { type: 'p', html: '把前 72 天的积累收口成"能讲、能展示、能写进简历"的三件套，然后直接准备面试。' },
      { type: 'h', text: '项目 3：DVWA 漏洞复现与防御分析' },
      { type: 'ul', items: [
        '每个漏洞：风险等级 → 复现步骤 → Payload → 防御方案 → <b>检测方法</b>（防守视角）',
        '工具链写清：Kali + DVWA + Burp + SQLMap',
      ]},
      { type: 'h', text: 'VulnHub 中级靶机（DC-2/DC-3）' },
      { type: 'ul', items: [
        '完整走一遍：信息收集 → 漏洞发现 → 利用 → 提权 → 痕迹清理（了解攻击者怎么藏）',
        '防守视角三问：哪些行为会留日志？怎么检测？能提取哪些 IOC？',
      ]},
      { type: 'h', text: '简历要点（弱化学历强化项目）' },
      { type: 'ul', items: [
        '技能清单：Linux 日志分析 / TCP-IP·HTTP / OWASP / ELK / Python 自动化 / SIEM 告警 / AI 辅助',
        '三个项目各三行：<b>做了什么 + 怎么做 + 量化结果</b>',
        '项目 2 一定写实测数字：检测率 XX%、误报率 XX%',
      ]},
      { type: 'h', text: '高频面试题（先背后练）' },
      { type: 'table', head: ['问题', '答题要点'], rows: [
        ['什么是 SQL 注入？怎么防？', '用户输入被当 SQL 执行；参数化查询根治'],
        ['如何分析 Web 日志异常？', '状态码/频率/来源三维度 + 基线对比'],
        ['发现服务器被入侵怎么办？', '隔离→取证→排查持久化→恢复→复盘'],
        ['什么是 SIEM？', '日志集中+关联分析+告警的平台，如 ELK/ Splunk/奇安信'],
        ['三次握手', 'SYN → SYN/ACK → ACK'],
      ]},
      { type: 'callout', ico: '🎤', kind: 'tip', title: '自我介绍模板', html: '"我是零基础转型，用 92 天完成了系统学习：搭建了 ELK 日志分析平台、开发了带 AI 研判的日志检测系统（检测率 XX%）、在靶场完整复现了 OWASP Top10 并输出防御方案。我学习能力强，日志分析和命令行是我的日常。"' },
    ],
    takeaways: ['三个项目 = ELK 平台 + 检测系统 + DVWA 分析', '简历每个项目：做了什么+怎么做+量化结果', '面试题按"要点+例子"准备，不要背长篇'],
    checks: [
      { q: '简历上项目经验最该突出的是？', opts: ['学历', '做了什么+量化结果', '会背的概念', '报过的班'], a: 1, ex: '量化结果（检测率/误报率/告警量）最有说服力。' },
      { q: '"发现服务器被入侵"第一动作？', opts: ['重启', '网络隔离保留现场', '删日志', '继续观察一周'], a: 1, ex: '先隔离（断网不断电）保留内存与日志证据，再排查。' },
    ],
  });

  /* ---------- 补充：Windows 基础 ---------- */
  add({
    id: 'p92-15', module: 8, ico: '🪟', title: '补充：Windows 安全基础（计划缺口）',
    subtitle: '事件 ID 4624/4625/4688/4720/7045 · PowerShell 入门 · 工作中躲不开的另一半', minutes: 60, tags: ['Windows', '补充', '必会'],
    content: [
      { type: 'p', html: '92 天计划全是 Linux——但企业内网一半以上的资产是 Windows，告警一半来自 Windows 事件日志。这一课补上这块缺口。' },
      { type: 'h', text: '必背事件 ID（背下来=能看懂一半告警）' },
      { type: 'table', head: ['事件 ID', '含义', '安全意义'], rows: [
        ['4624', '登录成功', '看 Logon Type 和来源 IP'],
        ['4625', '登录失败', '爆破检测的主数据源'],
        ['4634/4647', '注销', '会话结束时间'],
        ['4672', '特殊权限登录', '管理员登录，重点关注'],
        ['4688', '新进程创建', '进程链审计（谁拉起了谁）'],
        ['4720', '账号创建', '后门账号警报'],
        ['4728/4732', '加入组', '被加进管理组=权限提升'],
        ['7045', '新服务安装', 'psexec 横向的标志'],
        ['1102', '日志被清除', '灭迹行为，本身就是警报'],
      ]},
      { type: 'code', text: 'Logon Type 速查：2=交互(本机) 3=网络 5=服务 8=明文 9=PTH(哈希传递) 10=RDP\n\n# PowerShell 排查三连\nGet-WinEvent -FilterHashtable @{LogName="Security";Id=4625} -MaxEvents 50\nGet-Process | Sort CPU -Desc | Select -First 10\nGet-ScheduledTask | Where State -eq "Ready"' },
      { type: 'h', text: 'Sysmon：把 Windows 日志变强' },
      { type: 'ul', items: [
        'Sysmon（Sysinternals）记录进程创建(1)、网络(3)、文件创建(11)、注册表(12-14)、镜像加载(7)',
        '配 SwiftOnSecurity 的 sysmon-config 起步即可',
        'EDR 的告警逻辑本质就是 Sysmon 这类遥测 + 规则',
      ]},
      { type: 'callout', ico: '🎮', kind: 'tip', title: '联动', html: '站内<b>「日志侦探」的 Windows 事件三案</b>（4625 爆破 / 计划任务 / LSASS）就是这一课的实操场。' },
    ],
    takeaways: ['4624/4625 看登录，4688 看进程，4720/7045 看持久化，1102=灭迹', 'Logon Type 9 = 哈希传递的标志', 'Sysmon 是 Windows 遥测增强的标准方案'],
    checks: [
      { q: '事件 1102 出现意味着？', opts: ['登录成功', '审计日志被清除', '服务安装', '进程创建'], a: 1, ex: '清日志本身就是重大警报——正常系统不会清审计日志。' },
      { q: 'Logon Type 9 常见于？', opts: ['本机键盘登录', '哈希传递（PTH）', 'RDP', '服务启动'], a: 1, ex: 'Type 9 = NewCredentials，是哈希传递的典型特征。' },
    ],
  });

  /* ---------- 补充：应急速查 ---------- */
  add({
    id: 'p92-16', module: 8, ico: '🚑', title: '补充：入侵应急响应速查（双平台清单）',
    subtitle: '六步法 · Linux/Windows 排查清单 · 处置红线', minutes: 50, tags: ['应急', '补充', '速查'],
    content: [
      { type: 'p', html: '把模块 6 的应急方法落成一张"拿来就能用"的清单。真实场景：领导半夜打电话"服务器好像被黑了"，你按这张表走。' },
      { type: 'h', text: '六步法' },
      { type: 'code', text: '① 隔离（断网不断电，保留内存与日志）\n② 取证（先拍快照/导日志，再动手）\n③ 排查（入侵路径 + 持久化五处）\n④ 清除（后门/账号/定时任务/公钥）\n⑤ 恢复（改密/补丁/灰度上线）\n⑥ 复盘（时间线 + 整改清单 + 报告）' },
      { type: 'table', head: ['症状', 'Linux 查', 'Windows 查'], rows: [
        ['CPU 100%', 'top → lsof -p PID', '任务管理器 → Process Explorer'],
        ['可疑外联', 'ss -antp → lsof -i:端口', 'netstat -ano → 对应 PID'],
        ['莫名账号', '/etc/passwd uid=0', '事件 4720 + lusrmgr'],
        ['计划任务', 'crontab -l / cron.d', 'schtasks / 任务计划程序'],
        ['Webshell', 'find 目录 -mtime -1 + D 思路', '站点目录 + 河马/D 盾'],
        ['日志被清', 'auditd 是否在', '事件 1102'],
      ]},
      { type: 'callout', ico: '🚫', kind: 'warn', title: '处置红线', html: '<b>不要急着重启/重装</b>（内存证据全没）；<b>不要直接删恶意文件</b>（先留样本）；<b>不要忘了改所有相关密码</b>（含数据库/堡垒机）。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '演练场', html: '站内<b>「实战靶场」30 关</b>就是这份清单的模拟考场——SSH 爆破、挖矿、Webshell、SUID 提权全都有。' },
    ],
    takeaways: ['六步法：隔离→取证→排查→清除→恢复→复盘', '断网不断电，先取证再处置', '持久化五处（cron/服务/定时器/rc.local/profile/公钥）必须全查'],
    checks: [
      { q: '确认被入侵后第一动作？', opts: ['重启清内存', '网络隔离保留现场', '删除恶意文件', '发朋友圈'], a: 1, ex: '断网不断电：保住内存与日志证据，再按六步法走。' },
      { q: '以下哪个不是持久化排查点？', opts: ['crontab', 'systemd 服务', '屏幕壁纸', 'SSH 公钥'], a: 2, ex: '壁纸 harmless；cron/服务/公钥/profile 才是驻留点。' },
    ],
  });

  /* ---------- Day 88-92 求职 ---------- */
  add({
    id: 'p92-17', module: 8, ico: '🎯', title: 'Day 88-92：求职冲刺与 Plan B',
    subtitle: '投递策略 · 预期管理 · 面试跟进 · 心态', minutes: 60, tags: ['求职', '冲刺'],
    content: [
      { type: 'p', html: '最后五天不是学习，是<b>把学到的卖出去</b>。预期管理是这一阶段的全部。' },
      { type: 'h', text: '岗位策略：先上车再换座' },
      { type: 'ul', items: [
        '安全<b>实习生</b>（门槛最低，无经验首选）',
        '<b>驻场安全工程师</b>（外包驻场，积累日志分析经验最快的路）',
        '安全<b>运营助理</b> / 安全运维',
        '渗透测试助理（如果对攻击更有兴趣）',
      ]},
      { type: 'h', text: '投递与话术' },
      { type: 'code', text: '每天投 10-15 个，目标累计 50+；记录：公司/岗位/时间/状态\nBoss 打招呼模板：\n"您好，我对安全运营岗位很感兴趣。系统自学了 Linux 日志分析、\nELK 平台与 Python 自动化，有 3 个实战项目（含检测率数据），\n希望有机会面试。"' },
      { type: 'callout', ico: '🧘', kind: 'mind', title: 'Plan B 心态', html: '92 天没 offer 很正常。加一台靶机报告、项目传 GitHub、扩大投递面；安全行业<b>越老越吃香</b>，第一份工作不是终点是跳板。' },
    ],
    takeaways: ['先投实习生/助理/驻场，先进门再升级', '打招呼话术突出 3 个项目与量化数据', '目标累计 50+ 投递，没有offer就补作品继续投'],
    checks: [
      { q: '零基础第一份工作最优策略？', opts: ['只投大厂安全专家', '先进实习生/驻场积累经验', '不投等内推', '转行'], a: 1, ex: '"先上车再换座"：驻场/实习是日志分析经验积累最快入口。' },
    ],
  });

  LESSONS.push(...L);
})();
