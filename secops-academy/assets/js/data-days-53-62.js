/* ============================================================
   data-days-53-62.js — 92 天路线 · Day 53-62 逐日详解（Python+AI）
   ============================================================ */
(function () {
  const L = [];
  const add = (o) => L.push(o);

  add({
    id: 'd53', module: 8, ico: '🐍', title: 'Day 53：Python 环境 + 基础语法',
    subtitle: '从零开始：变量/条件/循环', minutes: 90, tags: ['Python', 'Day53'],
    content: [
      { type: 'p', html: 'Python 阶段开始。零基础完全 OK——今天只学三样：变量、条件、循环。学完就能写出"逐行检查日志"的雏形。' },
      { type: 'h', text: '环境确认与交互模式' },
      { type: 'code', text: 'python3 --version\npython3          # 进入交互模式（>>> 提示符），exit() 退出\n>>> name = "SecOps"\n>>> print(f"Hello, {name}!")\n>>> for i in range(5):\n...     print(i)' },
      { type: 'h', text: '第一个脚本' },
      { type: 'code', text: 'nano hello.py\n#!/usr/bin/env python3\nscore = 87\nif score >= 90:\n    print("优秀")\nelif score >= 60:\n    print("及格")\nelse:\n    print("不及格")\nfor i in range(3):\n    print(f"第 {i} 次巡检完成")\n\npython3 hello.py' },
      { type: 'callout', ico: '⚠️', kind: 'warn', title: '新手第一大坑：缩进', html: 'Python 用<b>缩进表示代码块</b>（if/for 里面的行必须缩进）。统一用 4 个空格，Tab 和空格不要混用——90% 的入门报错是 IndentationError。' },
    ],
    takeaways: ['变量/条件/循环三件套即可写出日志检查雏形', '缩进就是语法，统一 4 空格', 'f-string 是最方便的字符串格式化'],
    checks: [
      { q: 'Python 表示代码块靠？', opts: ['大括号', '缩进', '分号', 'end 关键字'], a: 1, ex: '缩进即语法，错位直接 IndentationError。' },
      { q: 'f"第 {i} 次巡检" 中的 {i} 会？', opts: ['原样输出', '被变量 i 的值替换', '报错', '变成字符串 i'], a: 1, ex: 'f-string 会把 {} 里的表达式替换成值。' },
    ],
  });

  add({
    id: 'd54', module: 8, ico: '📂', title: 'Day 54：文件操作与字符串处理',
    subtitle: '日志分析的"读"与"拆"', minutes: 90, tags: ['Python', 'Day54'],
    content: [
      { type: 'h', text: '读文件（背下来）' },
      { type: 'code', text: 'with open("/tmp/test.log", "r") as f:\n    for line in f:\n        line = line.strip()          # 去掉行尾换行\n        if line:                     # 跳过空行\n            print(line)' },
      { type: 'h', text: '字符串三板斧' },
      { type: 'code', text: 'text = "10.0.0.50 - - [18/Jul/2026] POST /login 403"\nparts = text.split()                 # 按空格切成列表\nprint(parts[0])                      # 10.0.0.50\nprint("403" in text)                 # True\nprint(text.lower())                  # 转小写再比较关键词' },
      { type: 'h', text: '今日练习：403 提取器' },
      { type: 'code', text: 'nano extract_403.py\nwith open("/tmp/test.log") as f:\n    for line in f:\n        if "403" in line:\n            print(line.strip())\n\n# 没有日志文件？自己造：\n# printf "1.1.1.1 x x [x] POST /login 403\\n2.2.2.2 x x [x] GET / 200\\n" > /tmp/test.log' },
      { type: 'callout', ico: '💡', kind: 'tip', title: '对照 Shell', html: '这个脚本等价于 <code>grep 403 /tmp/test.log</code>——你现在用 Python 重写了 grep。理解这一点，后面把 grep 换成正则、把 print 换成告警，系统就长出来了。' },
    ],
    takeaways: ['with open + for line 是读日志的标准姿势', 'strip 去换行、split 拆词、in 判断包含', '一个 if 就重写了 grep'],
    checks: [
      { q: 'with open 相比直接 open 的好处？', opts: ['更快', '自动关闭文件', '能写', '没区别'], a: 1, ex: 'with 块结束自动 close，不怕忘关导致句柄泄漏。' },
      { q: 'parts[-1] 取的是？', opts: ['第一个', '最后一个', '中间', '报错'], a: 1, ex: '负下标从尾部数，-1 即最后一个元素。' },
    ],
  });

  add({
    id: 'd55', module: 8, ico: '🔍', title: 'Day 55：正则表达式',
    subtitle: '精确提取 IP/时间/状态码', minutes: 90, tags: ['正则', 'Day55'],
    content: [
      { type: 'p', html: 'split 只能按空格拆——要精确抽取"长得像 IP 的一串"，需要正则表达式。这是日志分析的第一硬功夫。' },
      { type: 'h', text: '五个必会符号' },
      { type: 'code', text: '\\d  数字      \\w  字母数字下划线      \\S  非空白\n+   前面的重复 1 次以上               {3}  恰好 3 次\n[abc]  字符集      ^开头  $结尾      .   任意字符' },
      { type: 'h', text: '三个提取实战' },
      { type: 'code', text: 'import re\nline = \'10.0.0.50 - - [18/Jul/2026:10:00:01] "POST /login" 403 256\'\n\nip = re.search(r"(\\d{1,3}\\.){3}\\d{1,3}", line).group()\ntime = re.search(r"\\[(.+?)\\]", line).group(1)\nstatus = re.search(r\'"\\s+(\\d{3}) \', line).group(1)\nprint(ip, time, status)' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '理解要点', html: 're.search 找到第一个匹配就返回；.group() 取出内容。<b>让 AI 帮你写正则</b>是合法高效的做法——但你要会读、会改、会验证（用 python 逐条跑样本验证）。' },
    ],
    takeaways: ['\\d \\S + {} [] 是正则基本词汇', 're.search + group() 是提取标配', '让 AI 生成、自己验证，是正则的高效学法'],
    checks: [
      { q: '正则 \\d{3} 匹配？', opts: ['3 个字母', '恰好 3 位数字', '至少 3 个字符', '数字 3'], a: 1, ex: '\\d 是数字，{3} 表示恰好重复 3 次。' },
      { q: 're.search 与 re.match 的区别？', opts: ['无区别', 'search 全文找，match 只从开头', 'match 更快', 'search 返回列表'], a: 1, ex: 'match 锚定开头，search 扫描全文第一个匹配。' },
    ],
  });

  add({
    id: 'd56', module: 8, ico: '🗂️', title: 'Day 56：字典与列表——从"找"到"数"',
    subtitle: 'IP 计数器 + Counter 一行流', minutes: 90, tags: ['Python', '统计', 'Day56'],
    content: [
      { type: 'p', html: '昨天能"找"，今天学"数"——统计每个 IP 出现几次，是所有频率型检测（爆破/扫描）的地基。' },
      { type: 'h', text: '手写计数器（理解原理）' },
      { type: 'code', text: 'ip_count = {}\nfor line in open("/tmp/test.log"):\n    ip = line.split()[0]\n    ip_count[ip] = ip_count.get(ip, 0) + 1    # 没有就从 0 开始\nprint(ip_count)' },
      { type: 'h', text: 'Counter 一行流（工作常用）' },
      { type: 'code', text: 'from collections import Counter\nips = [line.split()[0] for line in open("/tmp/test.log")]   # 列表推导式\nfor ip, n in Counter(ips).most_common(5):\n    print(f"{ip}: {n} 次")' },
      { type: 'callout', ico: '🎯', kind: 'tip', title: '今日产出', html: '把两个版本都敲通，加上阈值判断：<code>if n >= 3: print("可疑:", ip)</code>——<b>恭喜，你已经写出了"爆破检测规则"的雏形</b>。' },
    ],
    takeaways: ['字典计数器：get(key, 0) + 1 套路', 'Counter.most_common(n) 是统计标配', '计数+阈值判断 = 频率型检测规则的雏形'],
    checks: [
      { q: 'ip_count.get(ip, 0) 中 0 的作用？', opts: ['最大值', '键不存在时返回的默认值', '步长', '序号'], a: 1, ex: 'get 带默认值，避免"键不存在"的 KeyError。' },
      { q: 'Counter(ips).most_common(5) 返回？', opts: ['前 5 个 IP', '出现最多的前 5 项及次数', '随机 5 个', '总数'], a: 1, ex: 'most_common 按次数降序返回前 n 项。' },
    ],
  });

  add({
    id: 'd57', module: 8, ico: '🧪', title: 'Day 57：综合小项目——简易日志分析器',
    subtitle: '跟着敲通 simple_log_analyzer.py', minutes: 100, tags: ['Python', 'Day57'],
    content: [
      { type: 'p', html: '把前四天拼成一个完整脚本：<b>读取 → 提取 → 统计 → 报告</b>。目标是跑通并理解每一行，不要求默写。' },
      { type: 'h', text: '跟着敲（结构背下来）' },
      { type: 'code', text: '#!/usr/bin/env python3\nimport re\nfrom collections import Counter\n\ndef analyze_log(log_file):\n    ips, statuses, urls = [], [], []\n    for line in open(log_file):\n        if (m := re.search(r"(\\d{1,3}\\.){3}\\d{1,3}", line)): ips.append(m.group())\n        if (m := re.search(r\'"\\s+(\\d{3}) \', line)): statuses.append(m.group(1))\n        if (m := re.search(r\'"(?:GET|POST|PUT|DELETE)\\s+(\\S+)\', line)): urls.append(m.group(1))\n    print("=== 日志分析报告 ===")\n    print(f"总请求: {len(ips)}")\n    for ip, n in Counter(ips).most_common(5): print(f"  {ip}: {n}")\n    for st, n in Counter(statuses).most_common(): print(f"  {st}: {n}")\n\nanalyze_log("/tmp/test.log")' },
      { type: 'callout', ico: '🩹', kind: 'warn', title: '调试心法', html: '跑不通是常态：<b>逐行检查缩进 → 检查变量拼写 → 单独跑提取部分打印中间结果</b>。超过 30 分钟先休息——这是你的计划原文，亲测有效。' },
      { type: 'callout', ico: '🚀', kind: 'tip', title: '这一步的意义', html: '这个 40 行的脚本，就是项目 2 的胚胎。第 63 课开始，你会给它装上"类"的结构、塞进更多规则、接上 AI——长成一个真正的系统。' },
    ],
    takeaways: ['函数封装：analyze_log(log_file) 一个入口', '三路提取：IP/状态码/URL 各一个正则', '跑通即过关，默写不要求'],
    checks: [
      { q: '脚本无法运行时第一检查项？', opts: ['换电脑', '缩进与变量拼写', '重装 Python', '删文件'], a: 1, ex: '缩进错误和拼写错误占新手报错的 90%。' },
      { q: '这个脚本与 grep 的本质区别？', opts: ['没有区别', 'Python 版可程序化扩展成检测系统', 'Python 更快', 'grep 更强'], a: 1, ex: 'grep 是一次性查询；脚本能长成"可扩展的自动化检测系统"。' },
    ],
  });

  add({
    id: 'd58', module: 8, ico: '⛏️', title: 'Day 58：Python 处理日志实战（上）',
    subtitle: '四类安全指标提取', minutes: 90, tags: ['Python', '实战', 'Day58'],
    content: [
      { type: 'p', html: '用更大的日志文件（靶机导出或生成）练四类提取：404 明细、POST 请求、频率异常、关键词命中。' },
      { type: 'h', text: '频率异常检测（前置知识）' },
      { type: 'code', text: '# 简单版：单位行数内同一 IP 的出现次数\nfrom collections import defaultdict\nfreq = defaultdict(int)\nfor line in open("big.log"):\n    ip = line.split()[0]\n    freq[ip] += 1\nsuspects = {ip: n for ip, n in freq.items() if n > 100}\nprint("高频 IP:", suspects)' },
      { type: 'h', text: '关键词命中检测' },
      { type: 'code', text: 'KEYWORDS = ["union", "select", "<script", "../", ".env", "wp-login"]\nfor line in open("big.log"):\n    low = line.lower()\n    for kw in KEYWORDS:\n        if kw in low:\n            print(f"[{kw}] {line.strip()[:120]}")\n            break' },
      { type: 'callout', ico: '⚠️', kind: 'warn', title: '误报预感', html: '你会立刻发现误报：新闻页含 "select" 一词也命中。怎么降？——下一课的 AI 研判就是干这个的；先把这个痛点<b>原样记进笔记</b>，它是项目 2 灵魂章节的引子。' },
    ],
    takeaways: ['四类提取：404 明细/POST/频率异常/关键词命中', '简单阈值频率检测会误报——这是 AI 研判登场的伏笔', '关键词命中要用 break 防重复报告'],
    checks: [
      { q: '关键词命中"select"就告警，会误伤什么？', opts: ['无', '含 select 一词的正常页面（如新闻）', '所有 404', '图片'], a: 1, ex: '纯关键词匹配不辨语境——这正是简单规则的局限，也是 AI 研判的价值空间。' },
      { q: '同一个关键词命中多时防止重复报告的方法？', opts: ['break 跳出内层循环', '继续循环', 'print 两次', '不管'], a: 0, ex: '命中一个关键词即记录并 break，避免一条日志产生多条相同告警。' },
    ],
  });

  add({
    id: 'd59', module: 8, ico: '⛏️', title: 'Day 59：Python 处理日志实战（下）',
    subtitle: '把四类提取封装成可复用函数', minutes: 90, tags: ['Python', '重构', 'Day59'],
    content: [
      { type: 'p', html: '昨天四个脚本各干各的，今天<b>重构</b>：把重复逻辑抽成函数，为项目 2 的"类结构"做准备。重构 = 不改功能，只改结构。' },
      { type: 'h', text: '重构示例：函数化' },
      { type: 'code', text: 'def read_log(path):\n    """读取日志，返回行列表"""\n    return [l.strip() for l in open(path) if l.strip()]\n\ndef find_keywords(lines, keywords):\n    """返回 [(行号, 关键词, 截断行)]"""\n    hits = []\n    for n, line in enumerate(lines, 1):\n        low = line.lower()\n        for kw in keywords:\n            if kw in low:\n                hits.append((n, kw, line[:120]))\n                break\n    return hits\n\nlines = read_log("big.log")\nfor n, kw, sample in find_keywords(lines, ["union", "<script", ".env"]):\n    print(f"行{n} [{kw}] {sample}")' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '重构的两个信号', html: '① 相同逻辑出现在两处（该抽函数了）② 一个函数超过一屏（该拆了）。中级代码质量就是这么攒出来的。' },
    ],
    takeaways: ['重构=不改功能只改结构', '信号①：重复逻辑抽函数；信号②：超一屏就拆', 'enumerate(lines, 1) 让行号从 1 开始'],
    checks: [
      { q: '重构的定义？', opts: ['加新功能', '不改功能改结构', '删代码', '换语言'], a: 1, ex: '对外行为不变，内部结构更清晰——重构的本质。' },
      { q: 'find_keywords 返回的行号从几开始？', opts: ['0', '1', '随机', '-1'], a: 1, ex: 'enumerate(lines, 1) 指定起始编号为 1，符合人的阅读习惯。' },
    ],
  });

  add({
    id: 'd60', module: 8, ico: '🤖', title: 'Day 60：AI 辅助分析（1）——结构化研判入门',
    subtitle: '从"自由提问"到"JSON 进 JSON 出"', minutes: 90, tags: ['AI', 'Day60'],
    content: [
      { type: 'p', html: '今天开始把 AI 纳入工作流。两个层次：<b>自由提问</b>（图省事）与<b>结构化研判</b>（程序可处理）——后者是项目 2 的灵魂。' },
      { type: 'h', text: '层次 1：自由提问（注意纪律）' },
      { type: 'code', text: 'Prompt 模板：\n"我是安全运营工程师，请分析以下日志找出可疑行为：\n[粘贴 10-20 行]\n请回答：1 异常 IP？2 攻击特征？3 建议措施？"\n\n⚠️ 纪律：样本脱敏后再贴（真实 IP/域名可保留结构但替换）；\n   AI 结论必须逐条验证，不能直接采信' },
      { type: 'h', text: '层次 2：结构化研判（项目 2 的灵魂）' },
      { type: 'code', text: '喂入（JSON）：\n{"ip":"10.0.0.50","failed_logins":23,"window":"5分钟","targets":["/login.php"]}\n\n要求输出（严格 JSON）：\n{"severity":"high|medium|low","attack_type":"...","behaviors":[],"recommendation":"...","confidence":0.0-1.0}' },
      { type: 'callout', ico: '⚖️', kind: 'mind', title: '两种方式对比', html: '自由文本给<b>人</b>看很爽；固定 JSON 给<b>程序</b>处理很稳。项目的正确姿势：AI 输出 JSON → 程序解析 → 按严重级别排序进报告。' },
    ],
    takeaways: ['AI 两层次：自由提问 vs 结构化研判', '结构化 = JSON 进 JSON 出，程序可处理', '样本先脱敏，AI 结论必须人工验证'],
    checks: [
      { q: '为什么强制 AI 输出 JSON？', opts: ['好看', '程序可解析可排序可入库', '省 token', '传统'], a: 1, ex: '固定 schema 让 AI 输出能被代码直接消费，才能自动化。' },
      { q: '贴日志给 AI 前应该？', opts: ['原样贴', '脱敏处理', '全文贴', '只贴 IP'], a: 1, ex: '真实 IP/域名/账号先脱敏或替换，防止信息外泄。' },
    ],
  });

  add({
    id: 'd61', module: 8, ico: '🧙', title: 'Day 61：AI 辅助分析（2）——让 AI 造工具',
    subtitle: '生成正则 / KQL / 解释复杂日志', minutes: 80, tags: ['AI', 'Day61'],
    content: [
      { type: 'p', html: 'AI 最好的三个用途：<b>写正则、写查询语句、解释看不懂的日志</b>。今天练这三个，全部留下验证记录。' },
      { type: 'h', text: '任务 1：生成正则' },
      { type: 'code', text: 'Prompt："请写 Python 正则，从该 Apache 日志提取 IP、时间、方法、URL、状态码：\n[粘贴样例] 要求用命名分组"\n→ 拿到答案后：跑 10 行真实样本验证准确率' },
      { type: 'h', text: '任务 2：生成 KQL' },
      { type: 'code', text: 'Prompt："写 Kibana KQL，找出过去 24 小时 404 最多的前 10 个 IP"\n→ 对照官方文档验证语法（AI 可能混淆 KQL/Lucene 版本）' },
      { type: 'h', text: '任务 3：解释复杂日志' },
      { type: 'code', text: 'Prompt："以下是防火墙日志，分析是否存在 DDoS 特征：[粘贴]"\n→ 重点看 AI 的推理是否引用了日志里的真实字段——编造字段的回答直接判无效' },
      { type: 'callout', ico: '📋', kind: 'tip', title: '验证习惯（中级素养）', html: '建一个 <code>ai_verified.md</code>：左边 AI 回答，右边你的验证结论。积累一个月，你会精确知道 AI 在安全领域<b>哪里可靠、哪里必翻车</b>——这本身就是简历上的能力。' },
    ],
    takeaways: ['AI 三大好用：写正则/写查询/解释日志', 'AI 输出必须跑样本验证', '维护 ai_verified.md 记录验证结论'],
    checks: [
      { q: 'AI 生成的检测规则第一步做什么？', opts: ['直接上线', '用真实样本验证', '点赞', '转发'], a: 1, ex: 'AI 可能混淆语法版本，样本验证是第一道关。' },
      { q: 'AI 解释日志时最容易犯的错？', opts: ['太慢', '编造日志中不存在的字段', '字太多', '用英文'], a: 1, ex: '幻觉字段是 AI 分析的典型失败模式，逐字段核对原文可识别。' },
    ],
  });

  add({
    id: 'd62', module: 8, ico: '📝', title: 'Day 62：AI 辅助分析（3）——生成事件报告',
    subtitle: '数据喂进去，报告初稿吐出来', minutes: 80, tags: ['AI', '报告', 'Day62'],
    content: [
      { type: 'p', html: '报告是安全运营最花时间的产出之一。今天把"分析结果 → 报告初稿"的流程 AI 化，并形成可复用的模板。' },
      { type: 'h', text: 'Prompt 模板（保存复用）' },
      { type: 'code', text: '基于以下分析结果撰写安全事件报告：\n- IP 10.0.0.50 一小时内发起 500 次登录请求，成功 2 次\n- 尝试用户名：admin/root/test/user\n- 集中于凌晨 2:00-3:00\n格式：1 事件概述 2 影响评估 3 处置建议 4 后续跟进' },
      { type: 'h', text: '人的价值在哪' },
      { type: 'ul', items: [
        '<b>核对事实</b>：AI 编造的时间/数字必须替换成真实值',
        '<b>补影响评估</b>：AI 不知道你的业务，哪些数据值钱只有你知道',
        '<b>加判断</b>：是否升级、是否上报合规——决策在人',
      ]},
      { type: 'callout', ico: '🗂️', kind: 'tip', title: '今日产出', html: '<code>ai_report_template.md</code>：Prompt + 报告骨架 + 你的修改批注。项目 2 的报告层会直接引用这个模板。' },
    ],
    takeaways: ['AI 起草 + 人工核对/补业务/做决策', 'Prompt 模板化，一次调好长期复用', 'AI 编造的数字必须替换为真实值'],
    checks: [
      { q: 'AI 生成的报告中"影响评估"部分最大的问题？', opts: ['太长', '不了解你的业务与数据价值', '没有标题', '是英文'], a: 1, ex: '影响评估依赖业务上下文，AI 只能泛泛而谈，必须人工补充。' },
      { q: 'Prompt 模板化的好处？', opts: ['省事且输出质量稳定', '可以发朋友圈', '不需要验证', '自动修 bug'], a: 0, ex: '固定结构 + 可替换变量 = 可复用的高质量工作流。' },
    ],
  });

  LESSONS.push(...L);
})();
