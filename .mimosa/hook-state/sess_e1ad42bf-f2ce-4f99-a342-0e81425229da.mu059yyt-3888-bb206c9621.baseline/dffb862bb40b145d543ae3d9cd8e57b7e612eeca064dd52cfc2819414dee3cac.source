/* ============================================================
   data-days-63-72.js — 92 天路线 · Day 63-72 逐日详解（项目 2 开发）
   配套自学笔记：项目2-LogSentinel日志检测系统-完整教程笔记.md
   ============================================================ */
(function () {
  const L = [];
  const add = (o) => L.push(o);
  const NOTE = '配套详细教程见笔记《项目2-LogSentinel日志检测系统-完整教程笔记.md》';

  add({
    id: 'd63', module: 8, ico: '🏗️', title: 'Day 63-65（上）：自动化脚本骨架搭建',
    subtitle: '项目 2 正式动工：解析层 + 读取封装', minutes: 150, tags: ['项目2', 'Day63'],
    content: [
      { type: 'p', html: '项目 2 开工。今天把 LogSentinel 的<b>目录骨架与解析层</b>搭起来——这是五层流水线的第一层。' },
      { type: 'h', text: '目录与解析层' },
      { type: 'code', text: 'mkdir -p ~/projects/logsentinel && cd ~/projects/logsentinel\n# 文件规划：parser.py / features.py / rules.py / ai_judge.py / report.py / sentinel.py\n\n# parser.py 核心（逐行敲，别复制）：\nimport re\nLOG_PATTERN = re.compile(\n    r\'(?P<ip>\\S+) \\S+ \\S+ \\[(?P<time>[^\\]]+)\\] \'\n    r\'"(?P<method>\\S+) (?P<url>\\S+) [^"]*" (?P<status>\\d{3}) (?P<size>\\S+)\'\n)\ndef parse_line(line):\n    m = LOG_PATTERN.match(line)\n    return m.groupdict() if m else None' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 0-2 课）' },
    ],
    takeaways: ['解析层 = 正则命名分组 + groupdict()', '解析失败返回 None 而不是崩溃', '按文件分层为后面铺路'],
    checks: [
      { q: 'parse_line 对不匹配的行返回？', opts: ['空字典', 'None', '报错', '原行'], a: 1, ex: '返回 None 让调用方跳过，程序不崩。' },
      { q: '五层流水线的顺序？', opts: ['解析→特征→规则→AI研判→报告', '报告→规则→解析', '随机', '规则→解析→报告'], a: 0, ex: '先结构化，再统计特征，再套规则，AI 只碰可疑样本。' },
    ],
  });

  add({
    id: 'd64', module: 8, ico: '🧪', title: 'Day 64（中）：测试数据与解析验证',
    subtitle: '没有数据，写什么检测都是纸上谈兵', minutes: 120, tags: ['项目2', 'Day64'],
    content: [
      { type: 'p', html: '先造数据再写代码：生成 normal.log（正常）与 attack.log（攻击）两组文件——它们既是调试数据，也是第 7 课的评估集。' },
      { type: 'code', text: 'gen_data.py 要点（自己写）：\n- 攻击 IP 固定一个（如 45.83.66.23），正常 IP 三四个内网\n- 攻击流量四类：爆破(30 条 403)/扫描(40 条 404)/SQLi(10 条 UNION)/XSS(8 条 script)\n- 时间戳递增，random.seed(42) 固定可复现\n\n验证：python3 -c "from parser import parse_file; print(len(parse_file(\'attack.log\')))"' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 7 课 7.1 节有完整生成器代码，第 5 课有验证方法）' },
    ],
    takeaways: ['数据先行：调试集与评估集一次造好', 'random.seed 固定保证可复现', '解析层必须先在真实数据上验证'],
    checks: [
      { q: '为什么生成数据要固定 random.seed？', opts: ['更快', '每次生成完全相同便于复现', '更安全', '必须的'], a: 1, ex: '可复现才能稳定调试与对比评估结果。' },
      { q: '评估用的数据集应该怎么分组？', opts: ['全攻击', '正常与攻击分开两个文件', '混在一起不标注', '随机'], a: 1, ex: '分开文件+已知答案，才能算检出率与误报率。' },
    ],
  });

  add({
    id: 'd65', module: 8, ico: '🪟', title: 'Day 65（下）：特征层——滑动时间窗口',
    subtitle: '"5 分钟内失败 ≥10 次"的实现', minutes: 120, tags: ['项目2', '滑动窗口', 'Day65'],
    content: [
      { type: 'p', html: '今天实现项目 2 最有技术含量的部件：<b>SlidingWindow 滑动时间窗口</b>。理解了它，频率型检测就通了。' },
      { type: 'code', text: 'from collections import defaultdict, deque\nclass SlidingWindow:\n    def __init__(self, window_sec=300):\n        self.win = window_sec\n        self.ip = defaultdict(deque)\n    def add(self, ip, dt):\n        q = self.ip[ip]; q.append(dt)\n        while q and (dt - q[0]).total_seconds() > self.win:\n            q.popleft()          # 踢出窗口外的旧事件——"滑动"的本质\n    def count(self, ip):\n        return len(self.ip[ip])' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 3 课含手动测试用例：12 次→1 次的验证实验）' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '思考题', html: '如果攻击者把间隔拉长到刚好卡在窗口边缘怎么办？——把窗口调大、结合多维度（IP+目标路径组合）统计，或者引入"衰减计数"。想得越深，离高级越近。' },
    ],
    takeaways: ['deque + popleft 实现窗口滑动', 'count 只数窗口内事件', '窗口值要结合攻击节奏思考'],
    checks: [
      { q: '窗口滑动的实现关键操作？', opts: ['排序', 'popleft 踢出窗口外旧事件', '删除字典', '加锁'], a: 1, ex: '新事件入队尾，旧事件从队头弹出，队列长度即窗口内次数。' },
      { q: 'defaultdict(deque) 的作用？', opts: ['加速', '访问不存在的 IP 自动建空队列', '排序', '持久化'], a: 1, ex: '免去"键不存在"的判断，代码更干净。' },
    ],
  });

  add({
    id: 'd66', module: 8, ico: '📏', title: 'Day 66-67（一）：规则引擎——五条规则上线',
    subtitle: 'SQLi/爆破/扫描/XSS/WebShell', minutes: 150, tags: ['项目2', '规则', 'Day66'],
    content: [
      { type: 'p', html: '两天的重头戏：把五条检测规则全部实现并接入。每条规则 = 一个函数，输入数据输出告警（带证据）。' },
      { type: 'code', text: '# rules.py 结构（每条一个函数）\ndef rule_sqli(entries): ...            # URL 含 union/select/\' --\ndef rule_brute_force(entries, window): # 滑窗计数 == 阈值时告警\ndef rule_dir_scan(entries, min_paths): # 同 IP 不同 404 路径数\ndef rule_xss(entries): ...             # URL 含 <script/onerror\ndef rule_webshell(entries): ...        # 上传目录 .php + UA 非浏览器' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 4 课含五条规则完整代码与逐条讲解，含 == 与 >= 的告警去重细节）' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '本课灵魂', html: '<b>每条告警必须带证据</b>（URL/计数/样本路径）——证据是给 AI 研判喂 JSON 的原料，也是人工复核的依据。没证据的告警一文不值。' },
    ],
    takeaways: ['规则=函数：输入数据输出告警字典', '告警必须带证据字段（供 AI 与人工）', '爆破告警用 == 阈值做去重'],
    checks: [
      { q: '告警字典里必须有？', opts: ['证据字段', '表情包', '随机 ID', '作者'], a: 0, ex: '证据链（URL/计数/样本）支撑 AI 研判与人工复核。' },
      { q: 'rule_brute_force 用 == 而非 >= 判断阈值是为了？', opts: ['更严格', '同一 IP 只在达到阈值时报一次', '更快', '省内存'], a: 1, ex: '>= 会每多一条失败就重复报一次。' },
    ],
  });

  add({
    id: 'd67', module: 8, ico: '⚙️', title: 'Day 67（二）：规则联调与误报初体验',
    subtitle: '在 normal.log 上验证"零误报"', minutes: 100, tags: ['项目2', '调优', 'Day67'],
    content: [
      { type: 'p', html: '规则写完不等于能用。今天做两件事：<b>在 attack.log 上验证全部触发</b>；在 <b>normal.log 上验证零误报</b>——后者往往要改好几轮。' },
      { type: 'code', text: 'try_rules.py：\nfrom parser import parse_file\nfrom features import SlidingWindow\nfrom rules import *\n\ndata = parse_file("attack.log")\nwindow = SlidingWindow(300)\nprint("SQLi:", len(rule_sqli(data)))\nprint("爆破:", len(rule_brute_force(data, window)))\n# ……同法跑 normal.log 对比' },
      { type: 'callout', ico: '🩹', kind: 'warn', title: '你可能遇到的误报', html: '正常流量里含 <code>select</code> 一词的页面被 SQLi 规则命中？→ 收紧：只检查 <b>URL 参数部分</b>而不是整条 URL，或要求"引号+关键词"同时出现。这就是<b>误报治理的第一次实战</b>，把过程记进笔记。' },
    ],
    takeaways: ['规则验证两极：attack 全触发 + normal 零误报', '误报治理：收紧匹配范围/组合条件', '误报调优过程本身就是简历素材'],
    checks: [
      { q: 'normal.log 出现误报的正确处理？', opts: ['关规则', '分析原因收紧匹配条件', '不管', '删数据'], a: 1, ex: '分析误报根因，用组合条件/范围收紧精确修复。' },
      { q: 'SQLi 规则误报"含 select 的正常页"，可用的收紧方式？', opts: ['只检查 URL 参数部分', '加大日志', '关规则', '换语言'], a: 0, ex: '参数部分才是注入 Payload 的藏身处，排除路径本身的误命中。' },
    ],
  });

  add({
    id: 'd68', module: 8, ico: '🤝', title: 'Day 68（一）：AI 研判层接入',
    subtitle: 'GLM 大模型成为你的副驾驶', minutes: 120, tags: ['项目2', 'AI', 'Day68'],
    content: [
      { type: 'p', html: '今天的里程碑：告警自动送进 GLM，拿回结构化研判意见。三铁律再念一遍：<b>JSON 进、JSON 出、结论当建议</b>。' },
      { type: 'code', text: '# 准备（安全纪律）：\necho \'export ARK_API_KEY="你的Key"\' >> ~/.bashrc\necho \'export ARK_MODEL="你的接入点ID"\' >> ~/.bashrc\nsource ~/.bashrc\n# Key 永不写进代码、永不发给任何人\n\n# ai_judge.py 核心逻辑：\nAPI_KEY = os.environ.get("ARK_API_KEY")     # 从环境读，代码里无密钥\npayload = {"model": MODEL, "messages": [...], "temperature": 0.2}\nresp = requests.post(API_URL, json=payload, headers=..., timeout=30)\nresult = json.loads(resp.json()["choices"][0]["message"]["content"])' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 5 课含完整代码、逐块讲解、降级验证实验）' },
      { type: 'callout', ico: '🛡️', kind: 'warn', title: '工程纪律', html: '<b>try/except 包住全部 AI 调用</b>：超时/配额/网络任何异常都返回 None——AI 挂了系统不能挂，这是"副驾驶"的职业操守。' },
    ],
    takeaways: ['Key 只存环境变量，代码零密钥', 'temperature 低=输出稳定', 'AI 调用必须整体 try/except 降级'],
    checks: [
      { q: 'AI 研判失败时系统应该？', opts: ['崩溃退出', '返回 None 跳过继续跑', '重试到死', '关机'], a: 1, ex: 'AI 是增强不是依赖，失败要优雅降级。' },
      { q: 'API Key 的正确存放位置？', opts: ['代码顶部', '环境变量', 'README', '聊天记录'], a: 1, ex: '环境变量与代码分离，仓库公开也不泄密。' },
    ],
  });

  add({
    id: 'd69', module: 8, ico: '📑', title: 'Day 69（二）：报告层 + 主程序串线',
    subtitle: '五层流水线全线贯通的日子', minutes: 120, tags: ['项目2', '报告', 'Day69'],
    content: [
      { type: 'p', html: '今天写报告层（终端+HTML），并用 sentinel.py 主程序把五层全部串起来——<b>系统今天正式诞生</b>。' },
      { type: 'code', text: '# 主程序骨架（argparse 提升专业度）\nap = argparse.ArgumentParser(description="LogSentinel 日志异常检测")\nap.add_argument("logfile")\nap.add_argument("--ai", action="store_true")\nap.add_argument("--html", action="store_true")\nargs = ap.parse_args()\n\n# ① parse_file → ② SlidingWindow → ③ rules → ④ ai_judge(--ai 时) → ⑤ report' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 6 课含 sentinel.py 与 report.py 完整代码）' },
      { type: 'callout', ico: '🎉', kind: 'tip', title: '今天跑通后', html: '<code>python3 sentinel.py attack.log --ai --html</code>——终端出报告、浏览器开 HTML、告警带 AI 意见。<b>发个朋友圈庆祝</b>，然后继续明天的评估。' },
    ],
    takeaways: ['argparse 让工具有专业界面', '主程序只做调度，各层各管各的', '全链路贯通是项目的"诞生时刻"'],
    checks: [
      { q: '主程序 sentinel.py 的职责？', opts: ['实现所有功能', '调度五层并处理命令行参数', '只画图', '存数据'], a: 1, ex: '关注点分离：主程序做调度，逻辑在各层模块。' },
      { q: '--ai 开关的作用？', opts: ['装饰', '控制是否调用 AI 研判（需配置 Key）', '加速', '静音'], a: 1, ex: 'AI 是可选增强，开关让系统在无 Key 环境也能跑。' },
    ],
  });

  add({
    id: 'd70', module: 8, ico: '📏', title: 'Day 70（三）：评估——混淆矩阵与指标',
    subtitle: '检测率 ≥90%、误报率 ≤5% 的硬指标日', minutes: 100, tags: ['项目2', '评估', 'Day70'],
    content: [
      { type: 'p', html: '项目含金量取决于今天：在带答案的数据集上算出<b>检测率与误报率</b>，画出混淆矩阵。' },
      { type: 'code', text: '# 分别跑两份数据，比对告警 IP 集合与答案 IP 集合\nevaluate.py:\nattacked = detect("attack.log")     # 告警的 IP 集合\nnormal = detect("normal.log")\nrecall = "100%" if ATTACK_IP in attacked else "0%"\nfp_rate = len(normal) / 正常IP总数 * 100\n\n# 输出示例：检测率 100% / 误报率 0%' },
      { type: 'callout', ico: '📖', kind: 'tip', title: '详细讲解', html: NOTE + '（第 7 课含评估脚本、IP 级评估原理、DVWA 造真攻击流量的加餐）' },
      { type: 'callout', ico: '🧾', kind: 'tip', title: '数字怎么填简历', html: '<b>只填实测值，不编造</b>。教学集上 100%/0% 很正常（数据简单）；想更硬核就把正常流量加大到几千条再测，误报率会暴露规则的真实水平——那才是更值得优化的事。' },
    ],
    takeaways: ['检测率=攻击被抓比例；误报率=正常被冤比例', '评估必须在带答案的数据集上做', '只填实测数字，加大流量集可测出真实水平'],
    checks: [
      { q: '误报率的分子是？', opts: ['被误报的正常项数', '攻击总数', '全部日志', '告警总数'], a: 0, ex: '误报率 = 误报正常项 / 正常项总数。' },
      { q: '教学数据集检测率 100% 说明？', opts: ['系统完美', '数据集较简单，可加大正常流量验证', '评估错了', '规则完美'], a: 1, ex: '简单数据集好成绩是预期内的，加大正常流量才有区分度。' },
    ],
  });

  add({
    id: 'd71', module: 8, ico: '🧹', title: 'Day 71-72（一）：代码整理与复盘',
    subtitle: '从"能跑"到"能看"', minutes: 100, tags: ['项目2', '整理', 'Day71'],
    content: [
      { type: 'p', html: '代码能跑了，但"能看"才是中级水平。今天做代码整理与项目复盘。' },
      { type: 'ul', items: [
        '每个文件加<b>模块级 docstring</b>（这个文件是干什么的）',
        '函数补 docstring 与类型提示（def f(path: str) -> list:）',
        '删除调试用的 print 与死代码',
        '自查重构两信号：重复逻辑抽函数；超一屏拆函数',
      ]},
      { type: 'h', text: '复盘三问（写进项目文档）' },
      { type: 'ul', items: [
        '哪条规则误报最多？如果重写，怎么降？（例：SQLi 规则只查参数部分）',
        '滑动窗口在分布式场景会失效吗？（会——多机内存不共享，需要 Redis 等集中存储）',
        'AI 研判的置信度怎么用？（低于 0.5 的自动转人工）',
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: '复盘的价值', html: '这三问的答案，就是面试官问"这个项目有什么不足/如果重做会怎么做"的标准答案。<b>主动暴露不足并给出改进方向</b>，比包装完美更有说服力。' },
    ],
    takeaways: ['docstring + 类型提示让代码"能看"', '复盘三问是面试标准答案的素材', '主动说不足+改进方向 > 包装完美'],
    checks: [
      { q: '滑动窗口在多机部署下的缺陷？', opts: ['没有缺陷', '内存不共享需集中存储（如 Redis）', '太慢', '不支持 IP'], a: 1, ex: '本地内存计数只在单进程有效——知道局限才显专业。' },
      { q: '面试被问"项目不足"应？', opts: ['说没有', '主动指出不足并给出改进方向', '转移话题', '贬低项目'], a: 1, ex: '承认局限+改进路径展示的是工程判断力。' },
    ],
  });

  add({
    id: 'd72', module: 8, ico: '📤', title: 'Day 72（二）：GitHub 发布与简历落地',
    subtitle: '项目 2 正式进作品集', minutes: 80, tags: ['项目2', 'GitHub', 'Day72'],
    content: [
      { type: 'p', html: '今天发布 LogSentinel 并更新作品集 README——与项目三同样的流程，你已经是熟练工了。' },
      { type: 'ul', items: [
        '仓库命名建议：<code>logsentinel</code>；README 用项目 2 笔记第 8 课的模板',
        '你的作品集仓库加 project2 文件夹或在 README 更新项目二章节（链接与实际对齐）',
        '简历三行文案落地（项目 2 笔记第 8 课 8.2 节）',
        '<b>互链</b>：logsentinel 的 README 提到"攻击测试数据可复用 DVWA 项目的流量生成思路"；DVWA 仓库反向提及——作品集成网状',
      ]},
      { type: 'callout', ico: '🏁', kind: 'tip', title: '里程碑达成', html: '至此 92 天计划的<b>两个核心项目全部完成</b>（ELK + LogSentinel），加上项目 3 报告——你的简历技术面已经成型。剩下的就是补细节、练面试、投出去。' },
    ],
    takeaways: ['发布流程与项目 3 一致：README→commit→push', '作品集互链形成网状引用', '双项目完成 = 简历技术面成型'],
    checks: [
      { q: '作品集仓库的加分做法？', opts: ['项目互相引用形成体系', '越多仓库越乱', '全部私有', '不写 README'], a: 0, ex: '互链展示体系化思维，面试官能看出项目的规划性。' },
      { q: 'LogSentinel 仓库 README 必须包含？', opts: ['架构图/检测效果数据/快速开始', '你的照片', '所有代码', '密码'], a: 0, ex: '架构+实测数据+快速开始，是评估一个安全工具仓库的三要素。' },
    ],
  });

  LESSONS.push(...L);
})();
