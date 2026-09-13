/* ============================================================
   data-days-33-52.js — 92 天路线 · Day 33-52 逐日详解（ELK 阶段）
   ============================================================ */
(function () {
  const L = [];
  const add = (o) => L.push(o);

  add({
    id: 'd33', module: 8, ico: '🐳', title: 'Day 33：Docker 安装与基本命令',
    subtitle: '容器四概念：镜像/容器/仓库/端口映射', minutes: 90, tags: ['Docker', 'Day33'],
    content: [
      { type: 'p', html: 'ELK 三件套要用 Docker 部署。今天把 Docker 装好、把核心命令练成条件反射。' },
      { type: 'h', text: '安装与验证' },
      { type: 'code', text: 'sudo apt update && sudo apt install -y docker.io docker-compose-v2\nsudo systemctl enable --now docker\nsudo usermod -aG docker $USER      # 加入 docker 组后【注销重登】才生效\ndocker run hello-world             # 经典验证' },
      { type: 'h', text: '每日五连（练到不用想）' },
      { type: 'code', text: 'docker pull nginx                  # 拉镜像\ndocker run -d -p 8080:80 --name web nginx   # 起容器（-d 后台）\ndocker ps                          # 看运行中\ndocker logs web                    # 看容器日志\ndocker stop web && docker rm web   # 停止并删除' },
      { type: 'callout', ico: '💡', kind: 'tip', title: '理解端口映射', html: '<code>-p 8080:80</code> = 把容器里的 80 端口"接"到宿主机 8080。浏览器访问 localhost:8080 看到 nginx 页 = 映射成功。ELK 的 9200/5601 同理。' },
      { type: 'h', text: '常见坑' },
      { type: 'ul', items: [
        'usermod 后忘记重登录 → 一直 permission denied',
        '容器名重复 → 先 docker rm 旧容器',
        '国内拉镜像慢 → 配置镜像加速器',
      ]},
    ],
    takeaways: ['-p 宿主端口:容器端口 是访问容器服务的钥匙', 'usermod 加组后必须重新登录', 'ps/logs/stop/rm 是容器日常四连'],
    checks: [
      { q: '容器起了但浏览器访问不了，最可能漏了？', opts: ['-d 参数', '-p 端口映射', '--name', '镜像名'], a: 1, ex: '没做端口映射时容器端口不暴露到宿主机。' },
      { q: 'docker ps 看不到某容器说明？', opts: ['没装 Docker', '容器未运行（加 -a 可见）', '端口冲突', '镜像损坏'], a: 1, ex: 'docker ps 只显示运行中的容器，-a 显示全部。' },
    ],
  });

  add({
    id: 'd34', module: 8, ico: '📦', title: 'Day 34：Dockerfile 与数据卷',
    subtitle: '把"装环境"变成一份可复用的配方', minutes: 80, tags: ['Docker', 'Day34'],
    content: [
      { type: 'p', html: 'Dockerfile = 环境的"菜谱"：写一次，任何人任何机器都能做出一模一样的环境。数据卷则解决"容器删了数据也没了"的问题。' },
      { type: 'h', text: 'Dockerfile 五连' },
      { type: 'code', text: 'FROM ubuntu:20.04                  # 基于什么镜像\nRUN apt-get update && apt-get install -y nginx\nCOPY index.html /var/www/html/     # 把文件拷进镜像\nEXPOSE 80                          # 声明端口（文档作用）\nCMD ["nginx", "-g", "daemon off;"] # 启动命令\n\ndocker build -t my-nginx .         # 构建（注意最后的 . 表示当前目录）' },
      { type: 'h', text: '数据卷：持久化与共享' },
      { type: 'code', text: 'docker volume create mydata\ndocker run -d -v mydata:/data nginx        # 命名卷\ndocker run -d -v ~/elk/logs:/logs nginx    # 直接挂宿主目录（ELK 用的就是这种）' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '为什么 ELK 离不开这两样', html: 'ES 的数据必须放卷（容器删数据还在）；Logstash 要挂载宿主的日志目录（把日志"喂"进容器）。明天写 compose 时这两样都会出现。' },
    ],
    takeaways: ['Dockerfile=环境菜谱，build 构建镜像', '-v 挂载卷实现持久化与目录共享', 'ES 数据放卷、Logstash 挂宿主日志目录'],
    checks: [
      { q: '容器删除后数据还在，靠的是？', opts: ['-d 参数', '数据卷挂载', '--name', '重启'], a: 1, ex: '卷独立于容器生命周期，删容器不删卷。' },
      { q: 'docker build 命令最后的 "." 表示？', opts: ['当前目录（找 Dockerfile）', '根目录', '输出路径', '无意义'], a: 0, ex: '构建上下文是当前目录，Dockerfile 必须在其中。' },
    ],
  });

  add({
    id: 'd35', module: 8, ico: '🎼', title: 'Day 35：Docker Compose 多容器编排',
    subtitle: '一个 YAML 管一队容器', minutes: 80, tags: ['Docker', 'Compose', 'Day35'],
    content: [
      { type: 'p', html: 'ELK 要同时跑 3 个容器，手敲三条 run 命令既累又容易错——Compose 用一个 YAML 声明"要哪些容器、怎么连"，一条命令全起。' },
      { type: 'h', text: '练一个双容器的例子' },
      { type: 'code', text: '# docker-compose.yml\nservices:\n  web:\n    image: nginx\n    ports: ["8080:80"]\n  db:\n    image: mysql:5.7\n    environment:\n      MYSQL_ROOT_PASSWORD: rootpass\n    volumes:\n      - db_data:/var/lib/mysql\nvolumes:\n  db_data:\n\ndocker compose up -d      # 一条命令全起\ndocker compose down       # 全停（-v 连卷删，慎用）\ndocker compose logs -f    # 看日志' },
      { type: 'h', text: '关键概念' },
      { type: 'ul', items: [
        '同 compose 内的容器<b>自动同网络</b>，用服务名互相访问（web 访问 db 直接写 db）',
        '<code>environment</code> 传环境变量（MySQL 密码就是这么做）',
        '<code>depends_on</code> 控制启动顺序（明天 ELK 用到）',
      ]},
      { type: 'callout', ico: '💡', kind: 'tip', title: '明天的预告', html: 'Day 38-40 会把 services 换成 elasticsearch/kibana/logstash 三个服务——今天练熟语法，明天就是"换名字填参数"。' },
    ],
    takeaways: ['compose 一条命令编排多容器', '服务名即主机名（内置 DNS 互通）', 'environment 传配置、volumes 持久化'],
    checks: [
      { q: 'Compose 里 web 容器访问 db 容器，地址写？', opts: ['localhost', '服务名 db', '127.0.0.2', 'IP 必须手查'], a: 1, ex: '同 compose 网络内置 DNS，服务名直接解析。' },
      { q: 'docker compose down 与 stop 的区别？', opts: ['一样', 'down 停止并删除容器与网络', 'down 只重启', '无 down 命令'], a: 1, ex: 'down 是"拆家"，容器/网络都会删（卷要加 -v 才删）。' },
    ],
  });

  add({
    id: 'd36', module: 8, ico: '🌐', title: 'Day 36：Docker 网络与 ELK 部署准备',
    subtitle: 'bridge/host/none · 为明天起 ES 做准备', minutes: 60, tags: ['Docker', 'Day36'],
    content: [
      { type: 'p', html: '今天半学半休：理解 Docker 网络模式，然后把 ELK 部署的材料准备好。' },
      { type: 'h', text: '三种网络模式' },
      { type: 'table', head: ['模式', '说明', '场景'], rows: [
        ['bridge（默认）', '容器在独立虚拟网桥里，端口映射出去', '绝大多数场景'],
        ['host', '容器直接用宿主机网络栈', '需要极致性能/特殊协议'],
        ['none', '无网络', '隔离任务'],
      ]},
      { type: 'code', text: 'docker network ls\ndocker network create elk-network\ndocker network inspect bridge | head -30    # 看看里面有哪些容器' },
      { type: 'h', text: 'ELK 部署准备清单' },
      { type: 'ul', items: [
        '确认虚拟机内存 ≥4GB（ES 至少要 1GB 才舒服）',
        '磁盘剩余 ≥20GB（ES 数据很吃盘）',
        '熟悉 elastic.co 官方 Docker 文档位置（明天照着跑）',
        '记下今天的系统时间——ES 索引按时间切，数据时间要对',
      ]},
      { type: 'callout', ico: '⏰', kind: 'warn', title: '新手最常见的时间坑', html: '日志里的时间是 7 月 18 日，Kibana 默认只看"最近 15 分钟"——于是看不到数据就以为失败了。记住：<b>先调时间范围再看数据</b>。' },
    ],
    takeaways: ['bridge 是默认网络，服务名互通靠它', 'ES 部署前确认内存/磁盘余量', 'Kibana 看不到数据先调时间范围'],
    checks: [
      { q: 'Docker 默认网络模式？', opts: ['host', 'bridge', 'none', 'overlay'], a: 1, ex: 'bridge 桥接网络是默认，配合 -p 端口映射使用。' },
      { q: 'Discover 里没数据，第一个检查项？', opts: ['重启 ES', '时间范围选择器', '换浏览器', '重新导入'], a: 1, ex: 'Kibana 默认只显示最近 15 分钟，历史数据要手动调时间范围。' },
    ],
  });

  add({
    id: 'd37', module: 8, ico: '🧱', title: 'Day 37：ELK 数据流复习与部署日计划',
    subtitle: '把数据流图默画一遍，明天正式开工', minutes: 45, tags: ['ELK', '复习', 'Day37'],
    content: [
      { type: 'p', html: '今天轻量：把 ELK 的数据流和部署计划在脑子里过一遍——明天开始的三天部署会很顺。' },
      { type: 'h', text: '数据流默写（对答案）' },
      { type: 'code', text: 'logs/*.log\n  → Logstash [file input → grok 拆字段 → date 转时间]\n  → Elasticsearch [索引 weblogs-日期，字段全部可检索]\n  → Kibana [索引模式 weblogs-* → Discover/Lens/Dashboard/告警]' },
      { type: 'h', text: '三天部署计划' },
      { type: 'ul', items: [
        '<b>Day 38</b>：compose 里先只放 ES → up → curl 9200 验证',
        '<b>Day 39</b>：追加 Kibana → 5601 验证',
        '<b>Day 40</b>：追加 Logstash + 写管道 → 日志流入 ES',
      ]},
      { type: 'ul', items: [
        '验证顺序必须是：ES 通 → Kibana 通 → Logstash 有日志进',
        '每步的验证命令提前想好（curl 9200 / 浏览器 5601 / Kibana Discover 看数据）',
      ]},
      { type: 'callout', ico: '✅', kind: 'tip', title: '为什么分三天', html: '三件套一起起，坏了不知道坏在哪。<b>逐个上、逐个验</b>是排障的基本功——这个习惯值一个月工资。' },
    ],
    takeaways: ['数据流四环节能默画', '部署节奏：ES→Kibana→Logstash，逐个验证', '每步先想好"怎么验证成功"'],
    checks: [
      { q: '三件套部署的正确顺序？', opts: ['Kibana→ES→Logstash', 'ES→Kibana→Logstash', 'Logstash→Kibana→ES', '同时全起'], a: 1, ex: '先有存储才有展示，最后接数据源，逐个验证。' },
      { q: 'ES 的默认验证命令？', opts: ['访问 5601', 'curl localhost:9200', 'docker logs kibana', 'ping'], a: 1, ex: 'curl localhost:9200 返回版本 JSON 即健康。' },
    ],
  });

  add({
    id: 'd38', module: 8, ico: '🟢', title: 'Day 38：Elasticsearch 上线',
    subtitle: '单节点 ES 部署与三大核心概念', minutes: 90, tags: ['ES', 'Day38'],
    content: [
      { type: 'p', html: '正式开工第一天：把 Elasticsearch 跑起来，并理解它存储数据的三个核心概念。' },
      { type: 'h', text: '部署（compose 骨架）' },
      { type: 'code', text: 'services:\n  elasticsearch:\n    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0\n    environment:\n      - discovery.type=single-node\n      - xpack.security.enabled=false\n      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"\n    ports: ["9200:9200"]\n    volumes: [es_data:/usr/share/elasticsearch/data]\nvolumes: { es_data: }\n\n# 前置（宿主机执行，不改必失败）：\nsudo sysctl -w vm.max_map_count=262144\necho "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-elk.conf' },
      { type: 'h', text: '验证与三大概念' },
      { type: 'code', text: 'curl "http://localhost:9200/_cluster/health?pretty"\n# status: yellow 在单节点是正常的（副本分片无处放）' },
      { type: 'table', head: ['概念', '类比', '说明'], rows: [
        ['Index 索引', '一张表 / 一个文件夹', 'weblogs-2026.07.18 一天一个'],
        ['Document 文档', '一行记录', '一条日志 = 一个 JSON 文档'],
        ['Shard 分片', '抽屉', '数据被切分存放（单机 yellow 的原因）'],
      ]},
      { type: 'callout', ico: '⚠️', kind: 'warn', title: '两个高频失败', html: '① vm.max_map_count 没调 → 启动即崩（看 docker logs es）② 内存不足 → 容器 137 退出（OOM），调低 ES_JAVA_OPTS 或加内存。' },
    ],
    takeaways: ['vm.max_map_count=262144 是 ES 上线硬前提', 'yellow 在单节点属正常', '索引/文档/分片三概念对应表/行/抽屉'],
    checks: [
      { q: '单节点集群健康状态 yellow 说明？', opts: ['坏了', '主分片正常、副本分片无处分配', '数据丢失', '磁盘满'], a: 1, ex: '副本需要第二节点，单机放不下所以黄色——数据完好。' },
      { q: 'ES 启动崩溃日志提到 max virtual memory areas？', opts: ['重装 ES', '调 vm.max_map_count=262144', '加 CPU', '换端口'], a: 1, ex: 'ES 依赖 mmap，系统默认值不够，必须调内核参数。' },
    ],
  });

  add({
    id: 'd39', module: 8, ico: '🔵', title: 'Day 39：Kibana 上线',
    subtitle: '5601 端口的三大利器', minutes: 60, tags: ['Kibana', 'Day39'],
    content: [
      { type: 'p', html: 'ES 是引擎，Kibana 才是驾驶舱。今天接上 Kibana 并熟悉界面布局。' },
      { type: 'code', text: '  kibana:\n    image: docker.elastic.co/kibana/kibana:8.11.0\n    ports: ["5601:5601"]\n    environment:\n      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200\n    depends_on: [elasticsearch]\n\ndocker compose up -d\n# 浏览器访问 http://localhost:5601' },
      { type: 'h', text: '首次进入三件事' },
      { type: 'ul', items: [
        '选 <b>Explore on my own</b> 跳过引导',
        '左上角 ☰ 菜单逛一遍：Discover / Dashboard / Stack Management',
        '确认顶部搜索框能搜（暂时无数据正常）',
      ]},
      { type: 'callout', ico: '🩺', kind: 'tip', title: '排障两板斧', html: 'Kibana 显示 "server is not ready yet" = 还在启动（等 1-2 分钟）；一直起不来 = <code>docker compose logs kibana</code> 看报错（多半是连不上 ES）。' },
    ],
    takeaways: ['Kibana 通过 ELASTICSEARCH_HOSTS 连 ES', '服务未就绪是正常的，等就行', '三大入口：Discover/Dashboard/Stack Management'],
    checks: [
      { q: 'Kibana 页面一直 "not ready yet"，先做什么？', opts: ['重装', '等 1-2 分钟并查容器日志', '换端口', '删数据'], a: 1, ex: 'Kibana 启动较慢，日志里能看到它与 ES 的连接状态。' },
      { q: 'Kibana 连接 ES 的配置项？', opts: ['ES_HOST', 'ELASTICSEARCH_HOSTS', 'ES_URL', 'KIBANA_ES'], a: 1, ex: 'environment 里 ELASTICSEARCH_HOSTS 指向 ES 服务地址。' },
    ],
  });

  add({
    id: 'd40', module: 8, ico: '🟠', title: 'Day 40：Logstash 管道——数据开始流动',
    subtitle: 'Input → Grok → Output 三段式', minutes: 100, tags: ['Logstash', 'Grok', 'Day40'],
    content: [
      { type: 'p', html: '今天的里程碑：<b>第一行日志自动流进 ES</b>。Logstash 管道三段式是 ELK 的灵魂。' },
      { type: 'code', text: 'input {\n  file { path => "/logs/*.log" start_position => "beginning" sincedb_path => "/dev/null" }\n}\nfilter {\n  grok { match => { "message" => "%{COMBINEDAPACHELOG}" } }\n  date { match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ] target => "@timestamp" }\n}\noutput {\n  elasticsearch { hosts => ["http://elasticsearch:9200"] index => "weblogs-%{+YYYY.MM.dd}" }\n}' },
      { type: 'h', text: '逐段讲解' },
      { type: 'ul', items: [
        '<b>input file</b>：读挂载进来的日志目录；sincedb_path=/dev/null 让重启后重读（学习方便）',
        '<b>grok + COMBINEDAPACHELOG</b>：内置模板把一行拆成 clientip/verb/request/response/timestamp 等字段',
        '<b>date</b>：把日志时间写进 @timestamp（否则时间是"导入那一刻"）',
        '<b>output</b>：按天建索引 weblogs-YYYY.MM.dd',
      ]},
      { type: 'h', text: '造日志验证' },
      { type: 'code', text: 'echo \'192.168.1.10 - - [18/Jul/2026:10:00:01 +0800] "GET /index.html HTTP/1.1" 200 1024\' >> ~/elk/logs/access.log\n# 稍等几秒 → Kibana Discover（记得调时间范围）看这条数据' },
      { type: 'callout', ico: '🔍', kind: 'tip', title: '排障三板斧', html: '数据没进来？① <code>docker compose logs logstash</code> 看管道报错 ② 检查挂载路径对不对 ③ grok 失败的行会打 _grokparsefailure 标签——在 Discover 搜它。' },
    ],
    takeaways: ['管道三段式：input→filter→output', 'grok 拆字段、date 修正时间', '发现 _grokparsefailure = 格式与模板不匹配'],
    checks: [
      { q: 'grok 解析失败的日志会带什么标记？', opts: ['_grokparsefailure', '_fail', 'error', 'skip'], a: 0, ex: 'Logstash 会自动打 _grokparsefailure 标签，在 Kibana 里可搜。' },
      { q: 'date 过滤器的作用？', opts: ['日期显示格式化', '把日志时间写入 @timestamp', '删除旧数据', '转时区'], a: 1, ex: '不修正的话 @timestamp=导入时刻，时间轴全是错的。' },
    ],
  });

  add({
    id: 'd41', module: 8, ico: '🔗', title: 'Day 41：ELK 整合测试',
    subtitle: '索引模式 + KQL 验证全链路', minutes: 70, tags: ['ELK', 'KQL', 'Day41'],
    content: [
      { type: 'p', html: '数据已在 ES 里，今天在 Kibana 建"取数入口"（索引模式），并跑通第一批检索。' },
      { type: 'code', text: 'Stack Management → Index Patterns → Create:\n  Name: weblogs-*\n  Time field: @timestamp\n\nDiscover 选 weblogs-*，时间范围 Last 1 year\n\nKQL 练习：\nresponse:404\nclientip:10.0.0.50\nresponse:404 and verb:POST\nnot response:200' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: 'KQL 与正则的区别', html: 'KQL 是<b>对字段做检索</b>（字段:值），不是对文本做正则——因为 grok 已经把日志拆成字段了。这就是"解析层"的价值：不解析就没法这样查。' },
    ],
    takeaways: ['索引模式=Kibana 的取数入口，时间字段必须对', 'KQL 按字段:值检索', '调时间范围是排障第一 reflex'],
    checks: [
      { q: '索引模式的 Time field 选什么？', opts: ['任意', '@timestamp', 'clientip', 'response'], a: 1, ex: '时间字段驱动 Kibana 的时间轴过滤，标准是 @timestamp。' },
      { q: 'KQL 查"非 200 的请求"？', opts: ['response!=200', 'not response:200', '-response:200', 'response<>200'], a: 1, ex: 'KQL 用 not 字段:值 语法做取反。' },
    ],
  });

  add({
    id: 'd42', module: 8, ico: '📊', title: 'Day 42：Kibana 可视化基础',
    subtitle: '柱状图 / 饼图 / 折线图三连', minutes: 80, tags: ['可视化', 'Day42'],
    content: [
      { type: 'p', html: '数字变图形，一眼看趋势。今天用 Lens 做三张最常用的运营图。' },
      { type: 'code', text: 'Analytics → Lens → 选 weblogs-*\n\n① 柱状图：横轴 @timestamp(按小时) 纵轴 Count，拆分维度 response.keyword\n   → 看"什么状态码在什么时候激增"\n② 饼图：切分 verb.keyword\n   → GET/POST 占比异常变化 = 行为变化信号\n③ 折线图：@timestamp 时间趋势 + Count\n   → 流量基线就在这张图上' },
      { type: 'callout', ico: '🛡️', kind: 'tip', title: '运营视角', html: '这三张图就是 SOC 大屏的"祖宗"：<b>趋势看异常、分布看构成、TopN 看焦点</b>。明天把它们组装成 Dashboard 并加下钻。' },
    ],
    takeaways: ['趋势/分布/TopN 是可视化的三大母题', 'Lens 拖字段即成图', 'response.keyword 拆分是状态码分析标配'],
    checks: [
      { q: '看"访问量何时突增"用什么图？', opts: ['饼图', '折线/面积（时间趋势）', '表格', '仪表盘数字'], a: 1, ex: '时间趋势图让峰值一眼可见。' },
      { q: '拆分状态码分布用哪个字段？', opts: ['@timestamp', 'response.keyword', 'clientip', 'message'], a: 1, ex: 'keyword 子字段用于精确聚合文本值。' },
    ],
  });

  add({
    id: 'd43', module: 8, ico: '🖼️', title: 'Day 43：Dashboard 组装与下钻',
    subtitle: '三张图 → 一块大屏 → 一个能下钻的分析台', minutes: 80, tags: ['Dashboard', 'Day43'],
    content: [
      { type: 'p', html: '今天把图组装成 Dashboard，并练"下钻分析"——从"404 变多了"一路点到"具体哪条请求"。' },
      { type: 'code', text: 'Dashboard → Create → 添加三张图 → 保存「Web访问分析」\n\n下钻练习：\nAdd filter → response is 404      # 整屏只剩 404\n再加 filter → clientip is 10.0.0.50  # 再缩到特定 IP\n点任意图表的某一段 → View surrounding documents / 查看原始文档' },
      { type: 'callout', ico: '🕐', kind: 'tip', title: '时间范围双击技巧', html: '折线图上<b>框选一段时间</b>可直接缩放到该时段——定位"攻击发生的确切时间窗"就靠这一手。' },
      { type: 'callout', ico: '💾', kind: 'tip', title: '留个好习惯', html: 'Dashboard 调完后到 Stack Management → Saved Objects → Export——配置可迁移、可备份，也能给面试官展示（附导出文件在项目目录）。' },
    ],
    takeaways: ['Dashboard = 图 + 筛选器 + 下钻的组合', '框选时间缩放是定位攻击窗口的利器', 'Saved Objects 导出让配置可迁移'],
    checks: [
      { q: 'Dashboard 下钻分析的第一步通常是？', opts: ['加筛选器缩小范围', '删图表', '换配色', '重启'], a: 0, ex: '先加 filter 锁定维度（状态码/IP），再看原始文档。' },
      { q: '导出 Dashboard 配置的位置？', opts: ['Discover', 'Saved Objects', 'Lens', 'Dev Tools'], a: 1, ex: 'Stack Management → Saved Objects 支持导入导出。' },
    ],
  });

  add({
    id: 'd44', module: 8, ico: '🗃️', title: 'Day 44：获取公开安全日志数据集',
    subtitle: 'Kaggle / SecRepo / CICIDS2017', minutes: 60, tags: ['数据集', 'Day44'],
    content: [
      { type: 'p', html: '自己的靶场流量太少，今天引入"真实世界的数据集"——安全分析的水平取决于见过多少真实数据。' },
      { type: 'h', text: '数据集来源' },
      { type: 'ul', items: [
        '<b>Kaggle</b>：搜 Web Server Logs / Cybersecurity Attacks（注册免费）',
        '<b>SecRepo.com</b>：安全日志样本合集',
        '<b>CICIDS2017</b>：学术界标准入侵检测数据集（CSV，标签齐全）',
      ]},
      { type: 'h', text: '拿到数据先看四件事' },
      { type: 'ul', items: [
        '格式：CSV / 纯文本 / JSON？',
        '字段：有没有时间戳、源 IP、动作字段？',
        '体量：多大？要不要分批导入？',
        '标签：有没有"这是攻击/这是正常"的标注（决定能不能做评估）',
      ]},
      { type: 'callout', ico: '⚠️', kind: 'warn', title: '常见坑', html: '公开数据集的时间戳常常是"生成时间"不是真实时间——导入后 Kibana 默认时间范围看不到，记得调范围或用其他字段过滤。' },
    ],
    takeaways: ['三大来源：Kaggle/SecRepo/CICIDS2017', '先看格式/字段/体量/标签四件事', '数据集时间戳陷阱：导入后调 Kibana 时间范围'],
    checks: [
      { q: '选择数据集时"标签"字段决定了？', opts: ['文件大小', '能否做检出/误报评估', '颜色', '导入速度'], a: 1, ex: '有标注才能算检测率与误报率——评估的前提。' },
      { q: '导入后发现 Discover 没数据，最常见原因？', opts: ['数据坏了', '时间戳不在默认时间范围', 'Kibana 崩了', '网断了'], a: 1, ex: '公开数据集时间多为过去某段，需手动调 Kibana 时间范围。' },
    ],
  });

  add({
    id: 'd45', module: 8, ico: '📥', title: 'Day 45：导入真实安全日志到 ELK',
    subtitle: 'CSV 管线适配非标准格式', minutes: 70, tags: ['Logstash', 'CSV', 'Day45'],
    content: [
      { type: 'p', html: '真实数据不会长得像 Apache 日志。今天学 Logstash 的"换接头"能力：同一套 output，只改 input/filter。' },
      { type: 'code', text: 'input { file { path => "/logs/*.csv" start_position => "beginning" sincedb_path => "/dev/null" } }\nfilter {\n  csv {\n    separator => ","\n    columns => ["timestamp","source_ip","destination_ip","port","protocol","action"]\n  }\n  date { match => [ "timestamp", "ISO8601" ] }\n  mutate { convert => { "port" => "integer" } }\n}\noutput { elasticsearch { hosts => ["http://elasticsearch:9200"] index => "secds-%{+YYYY.MM.dd}" } }' },
      { type: 'callout', ico: '🧪', kind: 'tip', title: '验证方法', html: '新索引 secds-* 建新索引模式 → Discover 里逐字段抽查：<b>字段值有没有错位</b>（CSV 第一行若是表头会被当数据处理，加 if [source_ip] == "source_ip" { drop {} } 丢弃表头行）。' },
    ],
    takeaways: ['换数据源只换 input/filter，output 不动', 'csv 过滤器按 columns 定字段名', '表头行要用 if+drop 丢掉'],
    checks: [
      { q: 'CSV 第一行表头被当数据处理，怎么丢？', opts: ['手动删行', 'if 判断字段值等于表头名则 drop', '改 CSV', '没办法'], a: 1, ex: 'filter 里 if [字段]=="表头名" { drop {} } 是标准做法。' },
      { q: '端口字段要参与数值比较，需要？', opts: ['mutate convert 成 integer', '改成字符串', '删除', 'base64'], a: 0, ex: 'CSV 进来的都是字符串，mutate convert 转数值类型才能比较。' },
    ],
  });

  add({
    id: 'd46', module: 8, ico: '📊', title: 'Day 46：安全分析可视化四件套',
    subtitle: '源IP Top10 / 攻击类型分布 / 时间趋势 / Metric 指标', minutes: 80, tags: ['可视化', 'Day46'],
    content: [
      { type: 'p', html: '基于安全数据集做四张"安全运营标配图"——以后公司的 SOC 大屏就是这些图的放大版。' },
      { type: 'ul', items: [
        '<b>源 IP Top 10</b>：Lens 条形图，按 source_ip 聚合 Count 倒序——"谁最活跃"',
        '<b>攻击类型分布</b>：饼图按 action/attack_type 拆分——"都在发生什么"',
        '<b>攻击时间趋势</b>：折线按时间——"什么时候集中爆发"',
        '<b>指标卡 Metric</b>：总事件数 + 唯一 IP 数（Unique count of source_ip）——"整体规模"',
      ]},
      { type: 'callout', ico: '🖼️', kind: 'tip', title: '组装 SOC 大屏', html: '四张图 + 昨天的三张访问分析图，组成「安全监控 Dashboard」。布局原则：<b>指标卡放顶部，趋势放中间，TopN 和分布放两边</b>——一眼扫完整体状态。' },
    ],
    takeaways: ['安全可视化四件套：TopN/分布/趋势/指标卡', '大屏布局原则：指标顶、趋势中、TopN 两侧', 'Unique count 是"多少个不同来源"的关键聚合'],
    checks: [
      { q: '"有多少个不同攻击来源"用什么聚合？', opts: ['Count', 'Unique count of source_ip', 'Sum', 'Average'], a: 1, ex: 'Unique count 去重计数，统计不同 IP 数量。' },
      { q: 'SOC 大屏布局原则？', opts: ['随机', '指标卡顶部、趋势中部、TopN 两侧', '全放文字', '图越大越好'], a: 1, ex: '先扫整体（指标），再看趋势，最后下钻细节。' },
    ],
  });

  add({
    id: 'd47', module: 8, ico: '🔔', title: 'Day 47：Kibana 告警规则',
    subtitle: '从"看图"到"自动报警"——基线与阈值', minutes: 80, tags: ['告警', 'Day47'],
    content: [
      { type: 'p', html: '图是给人看的，告警是机器替人盯。今天配置两条告警规则，学会"阈值怎么定"。' },
      { type: 'code', text: 'Stack Management → Alerts → Manage Rules → Create rule\n类型：Elasticsearch query\n\n规则1「大量 404 检测」\n  Data view: weblogs-*  查询: response:404\n  When: document count IS ABOVE 100（时间范围 5 分钟）\n  Check every: 1 分钟\n\n规则2「可疑 IP 高频访问」\n  查询: clientip:10.0.0.50 and response:403\n  阈值: above 10\n\nActions: Index 连接器（把告警写入索引，学习环境最简）' },
      { type: 'callout', ico: '📏', kind: 'tip', title: '阈值怎么定（面试题）', html: '<b>先测基线再定阈值</b>：看正常情况下 404 每小时多少次（比如 50），阈值设基线的 5~10 倍（250~500）。拍脑袋的阈值只有两个下场：误报爆炸或者漏报到底。' },
      { type: 'h', text: '验证触发' },
      { type: 'code', text: '# 手动造一波 404：\nfor i in $(seq 1 150); do echo "x - - [18/Jul/2026:10:00:01] \\"GET /t$i HTTP/1.1\\" 404 1" >> ~/elk/logs/access.log; done\n# 等 5 分钟 → Alerts 页看触发' },
    ],
    takeaways: ['告警=查询+阈值+频率+动作', '阈值=基线的 5~10 倍，先测基线', 'Index 连接器是学习环境最简的告警动作'],
    checks: [
      { q: '告警阈值 100 的依据应该来自？', opts: ['拍脑袋', '正常基线的 5~10 倍', '越大越好', '越小越好'], a: 1, ex: '基于基线的异常检测：阈值脱离基线就是赌博。' },
      { q: '学习环境最简单的告警动作连接器？', opts: ['邮件', 'Index 写入索引', '电话', '短信'], a: 1, ex: 'Index 连接器无需外部服务，告警写索引后 Discover 可查。' },
    ],
  });

  add({
    id: 'd48', module: 8, ico: '🔍', title: 'Day 48：模拟场景——「大量 404 请求」',
    subtitle: '第一次完整的告警研判与报告', minutes: 80, tags: ['场景', '报告', 'Day48'],
    content: [
      { type: 'p', html: '背景：SIEM 告警"某 Web 服务器过去 1 小时 3500 次 404，怀疑目录扫描"。今天你以 Tier 1 身份完成分析并出报告。' },
      { type: 'h', text: '分析四维度（Discover 操作）' },
      { type: 'ul', items: [
        '<b>时间分布</b>：折线图看 404 是否突发（而非缓慢增长）',
        '<b>源 IP 聚焦</b>：饼图按 clientip——92% 集中于一个 IP？',
        '<b>路径特征</b>：看 404 的 request 字段——/admin /wp-login /.env 有字典特征',
        '<b>对比基线</b>：平时 404 每小时多少？放大多少倍？',
      ]},
      { type: 'h', text: '报告模板（照填）' },
      { type: 'code', text: '告警时间：2026-07-18 14:00  级别：中\n现象：过去 1 小时 404=3500 次（基线 50/小时）\n源 IP：92% 来自 10.0.0.99\n路径：/admin /wp-login /.env 等敏感路径\n结论：疑似目录扫描/暴力猜解\n建议：封禁 10.0.0.99；WAF 加敏感路径规则；排查服务器上是否存在同名文件' },
      { type: 'callout', ico: '🧠', kind: 'mind', title: '必答思考题', html: '① 为什么确认是"扫描"而不是"用户手滑"？（量级+集中度+路径特征）② 如果 404 里混着 200 呢？（说明扫到了东西——升级为高危！这个细节是 Tier1/Tier2 的分水岭）' },
    ],
    takeaways: ['研判四维度：时间/源IP/路径/基线', '404 里混着 200 = 扫到了真实文件，必须升级', '报告五段：现象/源IP/路径/结论/建议'],
    checks: [
      { q: '404 扫描中出现少量 200，说明？', opts: ['正常', '有路径被扫到了（升级处理）', '统计错误', '可以忽略'], a: 1, ex: '扫描器对"存在文件"的响应是 200——混入 200 意味着可能扫出敏感文件。' },
      { q: '区分"扫描"与"手滑"的关键？', opts: ['量级+集中度+路径特征', '时间', 'IP 是否国外', '状态码'], a: 0, ex: '量级远超基线+来源集中+路径呈字典特征=扫描。' },
    ],
  });

  add({
    id: 'd49', module: 8, ico: '🔐', title: 'Day 49：模拟场景——「异常登录行为」',
    subtitle: 'SSH 登录日志的四维分析', minutes: 70, tags: ['登录', '场景', 'Day49'],
    content: [
      { type: 'p', html: '第二个高频场景：登录日志分析。维度换成了"账号/时间/来源/成败"。' },
      { type: 'h', text: '分析四维度' },
      { type: 'ul', items: [
        '<b>失败次数</b>：Failed password 频率与来源集中度',
        '<b>成功时间</b>：是否有凌晨/非工作时段的成功登录',
        '<b>来源 IP</b>：陌生地理/陌生网段/已知恶意 IP',
        '<b>用户名</b>：是否在尝试不存在的用户（爆破特征）',
      ]},
      { type: 'code', text: '# 准备 SSH 日志样本并导入（grok 换成 SSH 模式或用 dissect）\ncat /var/log/auth.log | grep sshd\n\n# Lens：登录失败 vs 成功 双折线\n# 时间过滤凌晨时段 → 成功登录的来源 IP 列表' },
      { type: 'h', text: '报告要点（比 404 场景多想一层）' },
      { type: 'ul', items: [
        '失败后成功的 IP = <b>最高优先级</b>（可能已进入）',
        '成功登录的账号要回访使用者："是你凌晨 3 点登的吗？"',
        '如果确认非本人 → 立即进入应急流程（模块 6 六步法）',
      ]},
      { type: 'callout', ico: '🧠', kind: 'mind', title: '与 404 场景的区别', html: '404 场景损失是"信息暴露风险"；登录场景一旦成功，<b>损失已经发生</b>——所以研判节奏更快、处置更重（直接上应急）。' },
    ],
    takeaways: ['登录分析四维度：失败/时间/来源/用户名', '失败后成功 = 最高优先级信号', '登录异常确认后直接触发应急六步法'],
    checks: [
      { q: '登录场景最危险的信号？', opts: ['失败很多', '失败后成功', '成功后登出', '用户名错误'], a: 1, ex: '失败→成功说明爆破得手，损失可能已发生。' },
      { q: '确认陌生成功登录非本人后，进入？', opts: ['继续观察', '应急响应六步法', '只改密码', '无动作'], a: 1, ex: '已进入=安全事件，按应急六步法处置。' },
    ],
  });

  add({
    id: 'd50', module: 8, ico: '🧹', title: 'Day 50：ELK 复习与优化',
    subtitle: '整理部署手册 · 优化配置 · 导出资产', minutes: 70, tags: ['ELK', '复习', 'Day50'],
    content: [
      { type: 'p', html: '阶段收官日：把 18 天的 ELK 工作整理成"可交接、可复现、可展示"的资产。' },
      { type: 'h', text: '三件收尾事' },
      { type: 'ul', items: [
        '<b>部署手册</b>：从 Day 33-41 的笔记整理成"从零到可用"的完整文档（步骤+验证+报错处理）',
        '<b>优化</b>：Logstash 多加字段解析；Dashboard 布局重排；告警阈值按基线复核一遍',
        '<b>导出</b>：Saved Objects 全量导出（Dashboard/可视化/索引模式 JSON）——放进项目目录',
      ]},
      { type: 'callout', ico: '🧪', kind: 'tip', title: '自检问答', html: '① 数据流四环节能默画吗？② grok 失败怎么排？③ 告警阈值怎么定？④ 给你一份新日志，多久能接入？——四个都答上，ELK 阶段毕业。' },
    ],
    takeaways: ['部署手册=可交接资产，必须完整成文', 'Saved Objects 导出=配置可迁移', '四问自检：数据流/grok排障/阈值/新日志接入'],
    checks: [
      { q: 'ELK 阶段最重要的"资产"是？', opts: ['跑着的容器', '部署手册+Dashboard+告警规则等可交接资产', '截图', '虚拟机'], a: 1, ex: '环境会坏，成文的能力与配置资产才是可展示、可迁移的。' },
      { q: 'Saved Objects 导出的文件格式？', opts: ['PDF', 'JSON', 'CSV', 'ZIP'], a: 1, ex: '导出为 JSON，可在其他 Kibana 环境导入。' },
    ],
  });

  add({
    id: 'd51', module: 8, ico: '🛡️', title: 'Day 51：项目 1 收口（上）——Elastic Security 体验',
    subtitle: '从 ELK 升级成 SIEM：规则库与时间线', minutes: 80, tags: ['Elastic Security', '项目1', 'Day51'],
    content: [
      { type: 'p', html: '你搭的 ELK 是"平台"，加上 Security 应用就升级成"SIEM"。今天体验它的规则库与时间线。' },
      { type: 'code', text: '☰ → Security → Rules → Create new rule\n  类型：Custom query\n  Data view: weblogs-*\n  KQL: response:404\n  条件：IS ABOVE 100（每 5 分钟）\n  命名："大量 404 请求检测" → 保存\n\n☰ → Security → Alerts：看规则触发的告警\n☰ → Security → Timeline：拖字段做临时关联分析' },
      { type: 'callout', ico: '🆚', kind: 'mind', title: '和 Day 47 的 Alerts 什么关系？', html: 'Day 47 的 Alerts 是平台自带告警功能；<b>Elastic Security 是完整的 SIEM 应用</b>：自带几千条 ATT&CK 对齐的检测规则、事件时间线、案例管理。你今天的自定义规则只是冰山一角——但入门足够。' },
      { type: 'callout', ico: '🎮', kind: 'tip', title: '联动', html: '站内「中级模块」的告警运营/误报治理课，讲的正是这些规则库长大之后的治理问题——提前打个预防针。' },
    ],
    takeaways: ['Elastic Security = ELK 之上的 SIEM 应用', '自带 ATT&CK 对齐的检测规则库', 'Timeline 是临时关联分析工具'],
    checks: [
      { q: 'Elastic Security 相比基础 Alerts 的最大增强？', opts: ['界面好看', '自带 ATT&CK 对齐规则库与时间线', '免费', '更快'], a: 1, ex: '规则库+Timeline+案例管理让它成为完整 SIEM 应用。' },
      { q: 'Timeline 的用途？', opts: ['看时间', '临时拖字段做关联调查', '建索引', '写报告'], a: 1, ex: 'Timeline 是调查工作台：多条件临时关联、逐条排查。' },
    ],
  });

  add({
    id: 'd52', module: 8, ico: '🏁', title: 'Day 52：项目 1 收口（下）——README 与作品集',
    subtitle: '简历项目 1 正式完成', minutes: 70, tags: ['项目1', '简历', 'Day52'],
    content: [
      { type: 'p', html: 'ELK 阶段最后一天：把一切收口成"可交付、可展示、可讲述"的项目 1。' },
      { type: 'h', text: '交付清单' },
      { type: 'ul', items: [
        'README.md：描述/技术栈/功能四条/快速开始/截图',
        'docker-compose.yml + logstash 管线配置（可复现环境的全部文件）',
        'Saved Objects 导出 JSON（Dashboard 资产）',
        '两份场景分析报告（404/登录）',
        '全部截图（Dashboard/告警/Discover）',
      ]},
      { type: 'h', text: '简历三行文案（抄改）' },
      { type: 'code', text: '项目：基于 ELK 的 Web 日志分析平台\n· Docker Compose 部署 Elasticsearch/Logstash/Kibana 8.11，Grok 结构化解析 Apache 日志\n· 构建状态码分布、IP Top、访问趋势 Dashboard；按基线配置 404 突增与可疑 IP 告警\n· 使用 Elastic Security 创建自定义检测规则，完成目录扫描与口令爆破两起模拟场景分析报告' },
      { type: 'callout', ico: '🎤', kind: 'tip', title: '面试讲法（2 分钟版）', html: '"我用 Docker 部署了 ELK 8.11 三件套，Logstash 用 Grok 把 Apache 日志拆成结构化字段入 ES；基于字段做了趋势/分布/TopN 可视化，并按正常基线设了 404 突增与可疑 IP 两条告警；最后用 Elastic Security 建了自定义检测规则。为了验证效果，我生成了 500 多条混合攻击流量，目录扫描和爆破场景都能准确触发。"' },
      { type: 'callout', ico: '➡️', kind: 'mind', title: '下一站', html: 'Day 53 进入 Python——为项目 2（LogSentinel）铺路。你已经在站内「中级模块」和游戏里反复见过那些攻击了，接下来的代码会写得很有感觉。' },
    ],
    takeaways: ['项目 1 交付五件套：README/配置/导出/报告/截图', '简历三行 = 做了什么+怎么做的+验证效果', '面试讲法按"数据流→可视化→告警→验证"讲'],
    checks: [
      { q: '项目 1 的面试主线讲法？', opts: ['罗列组件名', '按数据流→可视化→告警→验证的顺序讲', '只讲安装过程', '只讲理论'], a: 1, ex: '按数据流讲展示系统理解，用验证效果展示严谨。' },
      { q: '简历项目描述最该包含的元素？', opts: ['组件罗列', '做了什么+怎么做的+验证效果', '难度吐槽', '学习时长'], a: 1, ex: '量化验证效果（500 条混合流量准确触发）最有说服力。' },
    ],
  });

  LESSONS.push(...L);
})();
