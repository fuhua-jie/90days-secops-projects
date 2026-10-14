# ELK 安全日志分析平台 搭建手册

| 项 | 值 |
| --- | --- |
| 环境 | Ubuntu VM（主机名 `soc`，`192.168.103.134`），Docker + Docker Compose |
| 组件 | Elasticsearch 8.11.0 · Kibana 8.11.0 · Logstash 8.11.0 |
| 用途 | 把 Web 访问日志与 SSH 认证日志统一采集进 ES，供 Kibana 检索、可视化、告警 |
| 手册版本 | v1.0 · 2026-10-03 |

> **怎么用这本手册**：第 0–4 节是「照着搭」，第 3 节是「数据灌歪了怎么救」，第 5 节是「怎么证明搭对了」，第 6 节是「坏了先查哪里」，第 7 节是「前人踩过的坑，别再踩」。
> **搭一个平台是一次性工作；把数据重灌对、把字段查对，才是每天都要做的事。** 第 3、4 节请重点看。

---

## 0. 环境与版本

### 0.1 组件与端口

| 组件 | 镜像 | 端口 | 认证 |
| --- | --- | --- | --- |
| Elasticsearch | `elasticsearch:8.11.0` | `9200` | 学习环境关闭（`xpack.security.enabled=false`） |
| Kibana | `kibana:8.11.0` | `5601` | 无 |
| Logstash | `logstash:8.11.0` | 容器内 5044（本方案用 file input，不需要暴露） | 无 |

> **架构一句话**：Logstash 从挂载进容器的 `logs/` 目录读文件 → 解析（grok）→ 写进 ES 的按天索引 → Kibana 建索引模式后查询。
> ES 是仓库、Kibana 是橱窗、Logstash 是那台只会搬不会判断的传送带。

### 0.2 目录结构

```
~/elk/
├── docker-compose.yml          # 三件套定义
├── .env                        # 密钥（★ 不提交 git）
├── .gitignore                  # ★ 防误提交
├── logstash/
│   └── pipeline/
│       ├── logstash.conf       # ★ 唯一管道定义（目录里只能有这个文件）
│       └── （备份一律放目录外）
├── logs/                       # 挂载到容器 /logs（数据文件，不提交）
│   ├── access.log              # Web 日志
│   ├── access-2017-01-10.log
│   ├── .sincedb_weblog         # ★ Web 输入的记账本（不要手写、不要提交）
│   └── auth/
│       ├── auth.log            # SSH 日志
│       └── .sincedb_ssh        # ★ SSH 输入的记账本
└── gen-auth.sh                 # 造数据脚本（本地生成测试数据用）
```

### 0.3 时区约定（★ 最容易埋雷的地方）

| 位置 | 时区 | 结论 |
| --- | --- | --- |
| VM 系统时钟 | UTC | `date` 输出永远是 UTC |
| 日志里写的时间戳 | 带显式 `+00:00` | 采集侧不需要再换算 |
| 浏览器 / Kibana | 本地时区（北京 +0800） | **看图看到的时间和日志里的时间差 8 小时，是正常的** |

> 🔑 **铁律：让每一个时间戳都带时区偏移。** 只要日志里带了 `+00:00`，Logstash 的 `date` 过滤器用 `ISO8601` 就能认，不用配 `timezone`；反过来，一旦源日志是「无时区的裸时间」，采集端就必须显式声明 `timezone => "Asia/Shanghai"`，写错就是整体偏移 8 小时——**而且是静默的，没有任何报错。**

---

## 1. docker-compose.yml

### 1.1 完整文件

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data      # ★ 必须精确到这个路径
    restart: unless-stopped                        # ★ 宿主机重启后自动拉起

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY=${KIBANA_ENCRYPTION_KEY}   # ★ 走 .env
    depends_on:
      - elasticsearch
    restart: unless-stopped

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    # ★ 刻意不写 ports：本方案用 file input 读挂载目录，不需要对外暴露 5044
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/logs
    environment:
      - LS_JAVA_OPTS=-Xms256m -Xmx256m
    depends_on:
      - elasticsearch
    restart: unless-stopped

volumes:
  es_data:
```

### 1.2 四个必须解释的点

**（1）卷路径 `es_data:/usr/share/elasticsearch/data` 一个字都不能错。**

这是**容器内 ES 存数据的真实路径**。写成别的（本项目历史上误写成 `/user/share/elasticsearch/data`）不会报错，只会让 ES 把数据写进**容器可写层**。后果：

- `docker compose restart` 数据还在（容器没重建）
- `docker compose down`（删容器）→ **数据全部消失**，索引、仪表盘、告警规则一起没

> 🔑 **检查方法**：
> ```bash
> docker inspect elasticsearch --format '{{range .Mounts}}{{.Type}} | {{.Name}} -> {{.Destination}}{{"\n"}}{{end}}'
> ```
> 必须看到 `volume | elk_es_data -> /usr/share/elasticsearch/data`。看到 `Destination` 不是这个路径，或者根本没输出，就是挂错了。

**（2）`restart: unless-stopped` 决定平台能不能自愈。**

没有这条策略时，宿主机一关机（或 Docker 守护进程重启），三个容器全变成 `Exited`，开机后**不会自己起来**。现象是「昨天还好好的，今天 SSH 上去全连不上」——其实服务根本没跑。

> 🔑 **检查方法**：
> ```bash
> docker compose ps -a        # 看是不是一堆 Exited
> docker inspect -f '{{.Name}} -> {{.HostConfig.RestartPolicy.Name}}' elasticsearch kibana logstash
> ```

**（3）密钥必须走 `.env`。**

`XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY` 是 Kibana 加密已保存对象用的密钥。明文写在 compose 里 = 提交进 git = 所有克隆的人都能解密你的 Saved Objects（仪表盘、告警规则）。

```bash
# 生成
openssl rand -hex 32
# 写入 ~/elk/.env
KIBANA_ENCRYPTION_KEY=<上面生成的 64 位十六进制>
```

`~/elk/.gitignore`：

```gitignore
.env
logs/
.sincedb_*
*.sincedb_*
```

> 🔑 **泄密不是"被黑"才叫泄密**：密钥进过一次 git 历史，就算之后删掉，历史里还在。**所以要在第一次 `git add` 之前就想好。**

**（4）logstash 不需要暴露 `5044` 端口。**

`5044` 是 **beats 协议**的默认端口（Filebeat / Logstash-forwarder 往 Logstash 送数据用的）。本方案的数据来源是**挂载进容器的 `logs/` 目录**，用的是 `file` input —— **它读的是本地文件，不是网络输入，所以对外一个端口都不需要开。**

很多教程里会把 `ports: - "5044:5044"` 一起抄进来。它不报错、也不影响功能，但它违反了一条基本纪律：

> 🔑 **没在用的服务，就不要开端口。**
> 从蓝队视角看，主机上每一个 `LISTEN` 都是一件**资产**，都必须能回答三个问题：**谁在监听、为什么需要、不关会怎样。**
> 答不上来的那一个，就是别人扫端口时的入口，也是你自己写资产清单时的漏洞。

> 🔑 **顺手检查法**：
> ```bash
> docker compose config | grep -A3 ports     # 声明了哪些端口
> ss -tlnp                                    # 主机上实际在听什么
> ```
> 两者对得上、且每一个都能说出用途，才算**端口是清白的**。

### 1.3 启动与健康检查

```bash
cd ~/elk
docker compose up -d

# ES 起来大约需要 20–30 秒，用这个等它
until curl -s localhost:9200 >/dev/null; do sleep 3; done && echo "ES ready"

docker compose ps
curl -s 'localhost:9200/_cluster/health?pretty'
```

> ⚠️ **`yellow` 是正常的，不要当故障查。** 单节点 + 每个索引默认 1 个副本 → 副本分片永远无处安放，`unassigned_shards` 恒等于索引数。学习环境用 `yellow` 完全够用。

---

## 2. Logstash 管道设计

### 2.1 input：两个文件源，两条硬规矩

```ruby
input {
  file {
    path => "/logs/*.log"
    start_position => "beginning"
    sincedb_path => "/logs/.sincedb_weblog"
    tags => ["weblog"]
  }
#------防止glob重叠----------
  file {
    path => "/logs/auth/*.log"
    start_position => "beginning"
    sincedb_path => "/logs/auth/.sincedb_ssh"
    tags => ["ssh"]
  }
}
```

**规矩一：glob 不能重叠。**
`/logs/*.log` 只匹配 `logs/` 这一层；`/logs/auth/*.log` 只匹配 `auth/`。如果第一个写成 `/logs/**/*.log`（递归），`auth.log` 会**同时被两个 input 读到**，同一条日志进 ES 两次。

**规矩二：两个 input 的 sincedb 必须分开。**
sincedb 是「读到哪个字节了」的记账本。两个 input 共用一个文件 → 两条流互相覆盖对方的偏移量 → 数据丢一部分、重一部分。

**关于 `sincedb_path`：**

| 值 | 行为 |
| --- | --- |
| `"/dev/null"` | 不记账。**每次重启都从 `start_position` 重新读**（学习阶段方便，等于"每次重启全量重灌"） |
| 真实文件（推荐） | 记账。重启继续从上次偏移读，**不重复** |

真实 sincedb 文件内容形如：

```
1048597 0 64512 609 1791026178.761147 /logs/access.log
└inode ─┘ └dev┘ └─偏移─┘ └─时间戳─┘      └─路径─┘
```

关键：**第 4 列（字节偏移）等于文件大小时 = 已读完**；重启后不会再读一遍。

> 🔑 **这也解释了"删了文件重建，为什么会被重读一遍"**：`rm` 之后再创建，**inode 变了**，账本里查不到这个 inode → Logstash 把它当新文件。

### 2.2 分支：靠 `tags` 区分日志来源

```ruby
filter {
  if "weblog" in [tags] { ... }
  if "ssh" in [tags] { ... }
}
```

> ⚠️ **`if [tags] == "weblog"` 是错的。** `tags` 是**数组**不是字符串。写错不会报错，只会所有分支都不执行，所有文档都进 `_grokparsefailure`。

### 2.3 两层 grok：信封 + 正文

**为什么分两层？** 因为 SSH 日志是 `时间 主机 程序[PID]: 正文`——前半段是所有日志都有的统一结构（信封），后半段才是事件本身（正文）。把它们拆开，正文的正则就能写得简单得多。

**第一层：剥信封**

```ruby
grok {
  match => { "message" => "%{TIMESTAMP_ISO8601:log_timestamp} %{IPORHOST:host_name} %{NOTSPACE}\[%{POSINT}\]: %{GREEDYDATA:ssh_message}" }
}
mutate { copy => {"host_name" => "[host][name]"} }
```

- `TIMESTAMP_ISO8601` 认 `2026-09-25T10:01:55.048808+00:00`
- `IPORHOST` 匹配主机名或 IP
- `NOTSPACE` 匹配 `sshd-session`（**注意区分：`sshd` 是主监听进程，`sshd-session` 是每条连接的会话进程**）
- `\[` `\]` **必须转义**，否则被当字符类
- `GREEDYDATA` 把剩下的全吞了，存进 `ssh_message`
- `mutate copy` 是为了让主机名进 Kibana 的内置字段 `[host][name]`

> ⚠️ **写 grok 时数括号**：一个 pattern 字符串里 `%{` 的数量必须等于 `}` 的数量。多写一个 `}`（`...%{GREEDYDATA:ssh_message}}"`）会让正则去**要求一个真实的 `}` 字符**，整条消息立刻解析失败。

**第二层：按关键字分派正文**

```ruby
if "Failed password" in [ssh_message] {
  grok { match => { "ssh_message" => "Failed password for (?:invalid user )?%{USERNAME:ssh_name} from %{IP:ssh_ip}"} }
  mutate { add_field => { "ssh_event" => "login_failed" }}
}
else if "Accepted" in [ssh_message] { ... login_success ... }
else if "Invalid user" in [ssh_message] { ... invalid_user ... }
else if "pam_unix(sshd:session)" in [ssh_message] { ... pam_unix ... }
else if "Disconnected" in [ssh_message] { ... disconnect ... }
else if "Server listening" in [ssh_message] { ... service_event ... }
else { mutate { add_field => { "ssh_event" => "other" } } }
```

各分支的产出字段：

| 分支 | 匹配串（关键部分） | 产出 |
| --- | --- | --- |
| 登录失败 | `Failed password for (?:invalid user )?%{USERNAME:ssh_name} from %{IP:ssh_ip}` | `ssh_name` `ssh_ip` |
| 登录成功 | `Accepted %{WORD} for %{USERNAME:ssh_name} from %{IP:ssh_ip}` | `ssh_name` `ssh_ip` |
| 无效用户 | `Invalid user %{USERNAME:ssh_name} from %{IP:ssh_ip}` | `ssh_name` `ssh_ip` |
| 会话 | `pam_unix\(sshd:session\): session %{WORD} for user %{USERNAME:ssh_name}` | `ssh_name` |
| 断开 | `Disconnected from (?:invalid user \|authenticating user )?%{USERNAME:ssh_name} %{IP:ssh_ip} port %{POSINT:ssh_port} \[preauth\]` | `ssh_name` `ssh_ip` `ssh_port` |

> ⭐ **`else { ... "other" }` 兜底分支不能省。** 没有它，任何没被六个分支覆盖的日志都会静默丢掉（或者被算成解析失败）。有了它，"没见过的日志长什么样"变成了一个**可查询的问题**：`ssh_event:"other"`。

> ⭐ **`(?:invalid user |authenticating user )?` 这种"可选前缀"是坑中坑**：可选组**自带尾随空格**，所以它后面**绝对不能再写空格**。写成 `)? %{USERNAME...}` 会因为多一个空格而匹配不到（真实串在前缀之后直接就是用户名）。**删字面量时，要连分隔符一起删。**

### 2.4 `tag_on_failure` 与 `_grokparsefailure`

grok 匹配失败时，Logstash **不会丢事件**，而是往 `tags` 数组里加一个 `_grokparsefailure`。

```bash
# 一眼看有没有坏正则
curl -s 'localhost:9200/ssh-auth-*/_search' -H 'Content-Type: application/json' \
  -d '{"size":0,"aggs":{"t":{"terms":{"field":"tags.keyword"}}}}'
```

> ⚠️ **`_grokparsefailure` 只告诉你"失败了"，不告诉你"为什么"。** 想知道为什么，用 `_simulate`（见 §4.4）——1 秒验证，不用重灌。

### 2.5 `mutate`：打标签、搬字段、清垃圾

| 操作 | 用法 | 场景 |
| --- | --- | --- |
| `add_field` | `{ "ssh_event" => "login_failed" }` | 给事件分类 |
| `copy` | `{ "host_name" => "[host][name]" }` | 映射到 Kibana 内置字段 |
| `remove_field` | `[ "log_timestamp", "ssh_message" ]` | 清理中间字段 |

> ⚠️ **`remove_field` 的位置必须在这条事件处理链的**最末尾**——所有分支都读完了 `ssh_message` 才能删。放错位置，后面分支读到空值，静默全废。
> ⚠️ **调试阶段先注释掉**，管道稳定后再启用；出问题时第一时间把它注回去，否则你连原始日志都看不到。

### 2.6 `date`：把日志时间搬进 `@timestamp`

```ruby
date {
  match => [ "log_timestamp", "ISO8601" ]
  target => "@timestamp"
}
```

- 源时间戳带 `+00:00` → **不需要 `timezone` 选项**（`timezone` 只在源日志没有时区信息时才用）
- 不写 `target` 默认就是 `@timestamp`
- **不做这一步的后果**：`@timestamp` 会是「Logstash 读到这行的时间」而不是「日志真实发生的时间」——回溯事件时间线时全错，而且错得很隐蔽（数据看起来是有的）

### 2.7 output

```ruby
output {
  if "weblog" in [tags] {
    elasticsearch { hosts => ["elasticsearch:9200"]  index => "weblogs-%{+YYYY.MM.dd}" }
  }
  if "ssh" in [tags] {
    elasticsearch { hosts => ["elasticsearch:9200"]  index => "ssh-auth-%{+YYYY.MM.dd}" }
  }
}
```

按 `tags` 分流到不同索引——索引名用日志里的日期（`%{+YYYY.MM.dd}` 取自 `@timestamp`，也就是**日志时间**，不是写入时间）。

> 🚫 **绝对不要加这个东西**：
> ```ruby
> fingerprint { source => ["[event][original]"]  target => "[@metadata][fp]"  method => "SHA256" }
> elasticsearch { ... document_id => "%{[@metadata][fp]}" }
> ```
> 它看起来很专业（"幂等写入"），实际上**在毁证据**。原因见 §7 坑 8。

---

## 3. 数据重灌 SOP ⭐ 本手册最重要的一节

### 3.1 什么时候需要重灌

- 改了 grok / 字段映射 / 索引模板，**希望已有数据重新按新规则解析一遍**
- 索引里的数据和文件对不上，想从干净状态重来
- 准备交付演示，需要确定性的基线

### 3.2 为什么"删索引 + 重启"不够

> ⭐ **`start_position => "beginning"` 只对「Logstash 启动之后才出现（或发生变动）的文件」生效。**
> **启动前就已经躺在目录里的文件，即使你把 sincedb 删得干干净净，Logstash 也会把它登记成「当前大小、从尾部开始读」。**

这不是猜的，是本次对照实验测出来的：

| 文件 | mtime | 相对 Logstash 启动 | 结果 |
| --- | --- | --- | --- |
| `auth.log` | 早于进程启动 | 启动前就存在 | **从尾部读，0 条入库** |
| `newfile-test.log` | 进程运行中创建 | 启动后出现 | **从头读完，2 条入库** ✅ |

而 `touch auth.log`（把 mtime 改新）**没有用**——判断依据不是 mtime 的绝对值，而是「文件相对于输入插件启动时刻的新旧」。

### 3.3 正确顺序（实测通过）

```bash
cd ~/elk

# 1) 停 Logstash —— 避免边删边读
docker compose stop logstash

# 2) 删索引（全部要重灌的索引，一个都不能漏）
curl -s -X DELETE 'localhost:9200/ssh-auth-2026.09.26,ssh-auth-2026.09.27'

# 3) 删 sincedb 记账 + 删数据文件（★ 两步都要做）
rm -f ~/elk/logs/auth/.sincedb_ssh ~/elk/logs/auth/auth.log

# 4) 起 Logstash —— 此刻目录里没有 auth.log，不会被登记
docker compose start logstash
sleep 45

# 5) 生成数据 —— 文件"出现在进程启动之后"，start_position 才生效
LOG=/home/hua/elk/logs/auth/auth.log bash ~/elk/gen-auth.sh

# 6) 等管道吃完，再验收
sleep 45
curl -s 'localhost:9200/_cat/indices?h=index,docs.count&s=index'
```

> ⭐ **第 3 步和第 5 步是这套 SOP 的灵魂**：先把文件删掉（避免被从尾部登记），等进程起来之后**再**把文件生出来（这时才走 `start_position`）。

### 3.4 验收：必须"连数两次"

```bash
wc -l ~/elk/logs/auth/auth.log                          # 文件行数
curl -s 'localhost:9200/ssh-auth-*/_count?pretty'       # 索引总条数 → 必须相等
```

> ⚠️ **计数要隔 15 秒数第二次。** 管道还在吃数据时读到的数字偏小——本次踩过：用户第一次读到 `204`，15 秒后重数已经是 `400`。**两次一致才算稳定。**

---

## 4. Index Template 与字段映射

### 4.1 为什么需要

ES 的动态映射会把 `ssh_ip` 猜成 `text`（带一个 `keyword` 子字段）。`text` 类型的问题：

| 需求 | `text` 类型下 | 映射成 `ip` 之后 |
| --- | --- | --- |
| 精确查一个 IP | ✅ | ✅ |
| **网段查询**（`192.168.103.0/24`） | ❌ 报错 | ✅ |
| 前缀通配 | ✅ | ❌ **静默返回 0**（见 §4.3） |
| 聚合 | 需用 `.keyword` | 需用 `.keyword` |

### 4.2 建模板

```bash
curl -s -X PUT 'localhost:9200/_index_template/ssh-auth-template' \
  -H 'Content-Type: application/json' -d '{
  "index_patterns": ["ssh-auth-*"],
  "template": {
    "mappings": {
      "properties": {
        "ssh_ip": {
          "type": "ip",
          "fields": { "keyword": { "type": "keyword", "ignore_above": 256 } }
        }
      }
    }
  }
}'
```

验证：

```bash
curl -s 'localhost:9200/ssh-auth-*/_mapping/field/ssh_ip?pretty'   # 期望 "type": "ip"
```

> ⚠️ **模板只对「之后新建」的索引生效。** 已有索引不会回溯变更 mapping → **必须配合 §3 的重灌流程**。这也是为什么两件事总是绑在一起做。

### 4.3 查询写法对照表（8 个变体实测）

| 写法 | `text` 时期 | 改成 `ip` 后 | 说明 |
| --- | --- | --- | --- |
| `ssh_ip: 192.168.103.1` | ✅ 7 | ✅ 7 | 精确 IP |
| `ssh_ip: 192.168.103.*` | ✅ 7 | ❌ **0** | ⚠️ **静默失效**（`ip` 类型不支持 `*`） |
| `ssh_ip: 192.168.103.0/24` | ❌ 400 | ❌ 400 | 斜杠要转义 |
| `ssh_ip: 192.168.103.0\/24` | — | ✅ 7 | CIDR 只认这种写法 |
| `ssh_ip.keyword: 192.168.103.*` | ✅ | ✅ **7** | ⭐ **不加引号**，两种 mapping 通吃 |
| `ssh_ip.keyword: "192.168.103.*"` | ❌ | ❌ **0** | ⚠️ 引号把 `*` 变字面量 |
| `ssh_ip.keyword: 203.0.113.*` | ✅ | ✅ 376 | |
| `ssh_ip.keyword: "203.0.113.*"` | ❌ | ❌ 0 | |

> ⭐ **两条铁律**
> 1. **要通配就不要加引号。** `"192.168.103.*"` 是一个精确匹配字面量字符串 `192.168.103.*` 的查询，永远匹配不到真实 IP。
> 2. **网段/前缀匹配优先写 `ssh_ip.keyword: <前缀>.*`**（不依赖 mapping 类型，迁移后不失效）；需要真正的 CIDR 语义时才用 `ssh_ip: <ip>\/<mask>`。

> ⚠️ **最危险的地方在于它不报错。** 写错了只是返回 0 条，你会以为"今天没攻击"。——**告警规则的 0 命中，必须当成一个需要解释的现象，而不是一个让人安心的结论。**

### 4.4 用 `_simulate` 秒验 grok（不用重灌）

```bash
curl -s -X POST 'localhost:9200/_ingest/pipeline/_simulate?pretty' \
  -H 'Content-Type: application/json' -d '{
  "pipeline": {
    "processors": [
      { "grok": {
          "field": "message",
          "patterns": ["Disconnected from (?:invalid user |authenticating user )?%{USERNAME:ssh_name} %{IP:ssh_ip} port %{POSINT:ssh_port} \\[preauth\\]"],
          "ignore_failure": true
      }}
    ]
  },
  "docs": [
    { "_source": { "message": "Disconnected from invalid user oracle 198.51.100.99 port 32491 [preauth]" } },
    { "_source": { "message": "Disconnected from authenticating user root 203.0.113.88 port 41872 [preauth]" } }
  ]
}'
```

- 输出里每个 doc 有 `doc._source` 就是**匹配成功且字段已产出**
- ⚠️ **`"ignore_failure": true` 必须加**，否则第一个不匹配的文档会让整条 simulate 报 400
- ⚠️ Logstash 里的 `\[preauth\]` 抄进 JSON 要写成 `\\[preauth\\]`

---

## 5. 验收判据与自检命令

**平台搭好后，这 7 条全绿才算能用。**

| # | 判据 | 命令 | 期望 |
| --- | --- | --- | --- |
| 1 | 索引总条数 == 文件行数 | `wc -l logs/auth/auth.log` vs `curl -s 'localhost:9200/ssh-auth-*/_count'` | 相等 |
| 2 | 重启一次不重灌（幂等） | 重启后再数一遍 | 两次数字相同 |
| 3 | 没有解析失败 | `tags.keyword` 聚合 | 只有 `ssh`，`_grokparsefailure` = 0 |
| 4 | 中间字段已清理 | `_count?q=_exists_:ssh_message` / `_exists_:log_timestamp` | 都是 0 |
| 5 | 字段类型正确 | `GET ssh-auth-*/_mapping/field/ssh_ip` | `"type": "ip"` |
| 6 | 网段匹配可用 | `_count?q=ssh_ip.keyword:192.168.103.*` | 与内网登录数一致 |
| 7 | 事件分布对得上剧本 | `ssh_event.keyword` 聚合 | 各类数量与造数据脚本一致 |

**第 1 条的两条补充技巧：**

```bash
# 数据文件里的"唯一行数"——用来和索引条数做比对
sort -u logs/auth/auth.log | wc -l

# 交叉验证：有值的文档数 + 没值的文档数 == 总数
curl -s 'localhost:9200/ssh-auth-*/_count?q=ssh_ip:*'     # 有 IP 的
# 总数 − 有 IP 的 = 本来就没有 IP 字段的那几类（本例 16 + 2 = 18）
```

> ⭐ **交叉验证是这本手册里最值钱的一个习惯**：任何"某个查询返回 N 条"，都要能找到另一个数字和它**对得上**。对不上，就说明你对数据的理解有一块是错的。

### 5.1 变更纪律：先证明前置条件，再动运行时

> **血的教训（2026-10-04）**：把 Kibana 密钥从 compose 挪进 `.env`，顺序搞反了——先改 compose 引用行 + `up -d`，**最后**才验证 `.env`。
> 结果 `.env` 里键名写重复了（`KIBANA_ENCRYPTION_KEYKIBANA_ENCRYPTION_KEY=`）、值还被 `<>` 包住，compose **静默填了空字符串** → Kibana 带着**空密钥**上线，日志报 `Saved objects encryption key is not set`，alerting / actions API 被禁用。
> 万幸当时 `.kibana` 里 `alert` 类型对象数为 **0**，没有加密对象存在，否则就是数据解不开。

**任何"会改变运行时状态的编辑"，按这四步走：**

| 步骤 | 动作 | 为什么 |
| --- | --- | --- |
| 1 | **写文件**（用 heredoc，别手打）：`cat > 文件 <<'EOF' … EOF` | 零容错的内容，手打必错 |
| 2 | **读回**：`cat -A 文件` | `$` = 行尾、`^M` = CRLF、`<>` / 键名重复 / 多余空格**当场现形** |
| 3 | **只读验证**：`docker compose config \| grep <变量>` | 证明"解析后的值 == 期望值"，这一步不碰运行时 |
| 4 | **才动运行时**：`docker compose up -d` | 前置条件已被证明；改坏了也能立刻定位在哪一步 |

> 🔑 **提醒挡不住错误，只有"验证通过才允许下一步"的硬顺序挡得住。** 光在文档里写一句"值要原样复制"，救不了这次事故。
> ⚠️ `docker compose restart` **不会重读 compose 文件** —— 改环境变量必须 `up -d` 重建容器。
> ⚠️ `.env` 的值是**裸值**：不要 `<>`、不要引号、不要首尾空格。
> ⚠️ 判断"是不是真的生效"，要看**正向证据**（本例：Kibana 日志出现 `[INFO][plugins.encryptedSavedObjects] Hashed 'xpack.encryptedSavedObjects.encryptionKey' for this instance: …`），而不是"没看到报错"。

---

## 6. 故障排查速查表

**从现象出发，先查什么、根因是什么。**

| 现象 | 先查什么 | 常见根因 |
| --- | --- | --- |
| 索引条数 **<** 文件行数 | `sort -u 文件 \| wc -l` 与索引条数比对 | 拿日志内容当主键（fingerprint）→ **内容相同的行被判成同一条**，攻击证据被合并 |
| 索引条数 **>** 文件行数 | 各索引 `docs.count`、sincedb 内容、重启次数 | 没记账（`sincedb_path => "/dev/null"`）→ 每次重启全量重灌 |
| `_grokparsefailure` > 0 | `tags.keyword` 聚合定位，再用 `_simulate` 验正则 | ① 字面量多/少写 ② `[` `]` 没转义 ③ 可选组后又多写分隔符 ④ `%{...}` 没起字段名 |
| 重灌后 **0 条** | 文件 mtime vs 容器启动时刻 | `start_position` 只对「进程启动后出现的文件」生效 |
| 查询返回 **0 条** | `_mapping/field/xxx` + 检查有没有加引号 | `ip` 类型不支持 `*`；引号吃掉通配符 |
| 时间整体偏 8 小时 | 日志里有没有时区；`date` 过滤器有没有 `timezone` | 无时区源 + 未声明时区（或声明反了） |
| 字段有值但 Kibana 搜不到 | `_mapping` 看是 `text` 还是 `keyword` | `text` 被分词，需要用 `.keyword` |
| 容器全 `Exited`（隔夜） | `docker compose ps -a` + `docker inspect` 看 RestartPolicy | 宿主机重启，且没配 `restart:` 策略 |
| 配置没生效（环境变量类） | `docker compose config \| grep <变量名>` | `.env` 键名写错/重复，或值被 `<>`、引号包住 → compose **静默填空字符串**（只给一句 `WARN ... variable is not set`，不算报错） |
| 改配置没生效 | `docker compose exec logstash ls -la /usr/share/logstash/pipeline/` | ① 改错了文件 ② **目录里有 `.bak`/`.swp` 被一起合并进管道** |
| 配置改了但数据没重来 | 是否删了索引 + 删了 sincedb + 删了数据文件 | 三者缺一不可（见 §3） |

**通用排查顺序**（不知道从哪下手时）：

```
1. docker compose ps -a          服务活着吗？
2. docker logs logstash | tail   管道起来了吗？events.in / events.out 各是多少？
3. ls -la pipeline 目录          配置真的是我改的那个吗？有没有多余文件？
4. cat sincedb                   读到哪里了？偏移 == 文件大小吗？
5. ES 索引 docs.count            实际落盘多少条？
6. _simulate                     正则到底能不能匹配？
```

> ⭐ **`events.in` 和 `events.out` 是分水岭**：`in` 是文件里读到的行数，`out` 是写进 ES 的数量。`in = out = 文件行数` 说明管道没问题，问题在别处（比如查询写错了）；`in > out` 说明是解析或输出环节在丢数据。

---

## 7. 已知坑清单

> **每条都记三件事：现象、根因、怎么发现的。** 只记结论的坑，三个月后你连"当时为什么算坑"都想不起来。

| # | 坑 | 现象 | 根因 | 怎么发现 |
| --- | --- | --- | --- | --- |
| 1 | 共享管道不分流 | 两类日志互相解析失败 | 一个管道收多种日志却没按 `tags` 分支 | 所有文档都进 `_grokparsefailure` |
| 2 | grok 多一个 `}` | 全部文档解析失败，配置自检却通过 | `%{...}` 数量比 `}` 多一个 → 正则要求一个字面 `}` | 逐字符数括号；`_simulate` 复现 |
| 3 | 时区偏移 8 小时 | 攻击时间对不上 | 源日志无时区 + `date` 未声明 `timezone` | 比对原始日志行与 `@timestamp` |
| 4 | `TZ=` 静默回退 | 造数据脚本写出的时间不在预期区间 | `TZ=Asia/Shanghai date ...` 在无 tzdata 环境静默回退 UTC | 加自检：`[ "$(date -u -d '... +0800' +%H)" = "04" ] \|\| exit 1` |
| 5 | `tag_on_failure` 被共用 | 一个分支失败，其他分支也标失败 | 多个 grok 共享默认的 `_grokparsefailure` 标记 | 查看 `tags` 数组内容 |
| 6 | `.bak` 被合并进管道 | 改了配置不生效，还冒出重复数据 | `path.config` 指向**目录**时，目录内所有文件合并成一条管道 | `docker compose exec logstash ls -la /usr/share/logstash/pipeline/` |
| 7 | inode 变了被当新文件 | 删文件重建后整份重读 | sincedb 按 **inode** 记账，`rm` + 新建 = 新 inode | 看 sincedb 第 1 列 inode 变化 |
| 8 | **幂等键选错，比不幂等更危险** | 索引条数远小于文件行数（150 → 2） | `fingerprint` 拿**日志原文**当主键 + `document_id` ⇒ "内容相同的行只留一条" ⇒ **把"40 次一字不差的爆破"合并成 1 条** | `sort -u 文件 \| wc -l` 与索引条数**精确相等** |
| 9 | `ip` 映射后通配静默失效 | `ssh_ip:192.168.103.*` 从 7 变 0 | `ip` 类型不支持 `*` | 换 mapping 前后跑同一查询对比 |
| 10 | `start_position` 对旧文件不生效 | 删光 sincedb 也读不回来，0 条 | 只对「输入插件启动之后出现的文件」生效 | 对照实验：旧文件 vs 进程运行中新建文件 |
| 11 | 在验收基线上做实验 | 总数多出 2 条，`448 ≠ 446` | 测试数据写进了正式索引 | 交叉验证时发现差额，反查 `ssh_ip` |
| 12 | 可选组后多一个分隔符 | 正则怎么写都不匹配 | `(?:a \|b )?` 自带尾随空格，后面不能再写空格 | `_simulate` 4 变体对照 |
| 13 | `Configuration OK` ≠ 正则正确 | 语法自检全绿，数据一条没进 | 自检只验证**配置能被解析**，不验证**正则能匹配** | `_simulate` |
| 14 | 引号吃掉通配符 | `ssh_ip.keyword:"192.168.103.*"` 永远 0 条 | 引号 = 精确匹配，`*` 变成普通字符 | 8 变体对照实验 |
| 15 | **`.env` 写坏 → compose 静默降级** | 服务能起来，某个功能却"像没配"（如 Kibana 报 `Saved objects encryption key is not set`、alerting/actions API 被禁用） | ① 键名写重复（`KIBANA_ENCRYPTION_KEYKIBANA_ENCRYPTION_KEY=`）② 值被 `<>` 包住 ⇒ 键名对不上 → **填空字符串**，只给 WARN | `cat -A .env` 读回内容；`docker compose config \| grep <变量>` 看解析结果 |
| 16 | **Kibana API 发给了 ES**（Dev Tools Console） | `POST /api/saved_objects/...` 在 Console 里报 `no handler found for uri` | **Console 只对 ES(9200) 说话**；Kibana API 只能 `curl localhost:5601` + `-H 'kbn-xsrf: true'` | 看错误"方言"：ES = `{"error" : "..."}`；Kibana = `{"statusCode":...,"message":"..."}` |
| 17 | **检测引擎权限 400**（Security → Rules 打不开） | `Failed to retrieve detection engine privileges`，`undefined: undefined (400)` | `xpack.security.enabled=false` ⇒ ES 的 `/_security/user/_privileges`、`/_security/api_key` **根本不存在** → 检测引擎拿不到"以谁的名义运行" | `curl -X POST localhost:9200/_security/api_key` → `no handler found` 即确诊 |
| 18 | **Logstash 有两种对外身份，只配了一种** | 数据没报错（还没数据可写），监控输出却狂刷 401 | 写数据走**索引级**权限（`logstash_internal`）；上报自身监控走**集群级** `monitoring/bulk`（内置 `logstash_system`）—— **两个身份都要** | `docker logs logstash \| grep elasticsearchmonitoring` |
| 19 | **规则跑 succeeded 但告警 0**（**时间层**） | 数据、字段、阈值全对，Alerts 就是空 | 数据的时间戳在**上一次执行窗口之外**：`from=now-360s`，数据在窗口外 66 秒 → 永远追不上 | `date_histogram` 看数据的真实时间分布 vs 规则 `from/to` |
| 20 | **sincedb 认名不认内容** | 覆盖同名日志文件，新数据一条都没进来 | sincedb 记录的是「文件名 + inode + 字节偏移」，**不读内容**；覆盖不改变偏移 ⇒ 静默丢失。**做实验永远用新文件名** | 对照 `ls -l` 字节数与索引 `_count` |
| 21 | **Group by 是告警明细的唯一来源** | 告警 `terms` 变空，告警只剩"窗口内 N 条"，连事件类型都没了 | UI 编辑规则时把 Group by 清空保存 ⇒ `threshold.field: []` ⇒ 聚合无分组维度 | API 读回 `threshold` 看字段列表（UI 保存 ≠ 按你以为的生效） |
| 22 | **threshold 分组值只进 `terms`，不复制成顶层字段** | 告警表格加 `source.address` 列显示 `—`，但 JSON 里明明有 IP | 分组值写在 `kibana.alert.threshold_result.terms[]`；`terms[].field` 只是从**源索引抄来的聚合路径标签**（text 类型会被 `.keyword` 化），告警索引本身并不存在这个字段，8.11 **不会**复制成顶层 ECS 字段 | **2026-10-09 三连实测**：① `_mapping/field/source.address.keyword` → 返回空 `{}`（字段不存在）② `terms.value` term 查询 → 命中 1 条（值机器可读）③ 顶层 `source.address` exists → 0 条（列 `—` 是必然）；自动化取值走 `terms[i].value` |
| 23 | **API 挂得上连接器，UI 一开编辑器就崩** | 规则挂 `.server-log` 连接器 PUT 200 成功；此后点 `Edit rule settings` 白屏报 `Cannot read properties of undefined (reading 'enabled')`（triggersActionsUi.chunk） | UI 渲染"已挂 action"时要查一张**连接器类型元数据表**，而 `.server-log` 被排除在规则 Actions 的 inline gallery 之外 ⇒ 表里没有这一行 ⇒ `undefined`。**"API 能建能挂" ≠ "UI 能渲染"** | 挂完必须回 UI 重开一次编辑器；崩了用 `PUT actions: []` 回滚（本次即如此，规则无损） |
| 24 | **通知送达，但内容全是空值** | 工单文档进索引了，`message` 渲染成 `count= terms= url=`，`documentId` 也空 | mustache 对**未定义变量静默渲染成空串**（不报错）；`context.threshold_result`、`context.id`、`context.hits` 在 8.11 模板层**根本不存在**（连弃用名单都没进） | 权威变量表＝编辑器右上 **Available variables** 弹层（`alert.*` / `rule.*` / `context.rule.*`）；探针法：一条 message 塞 9 个候选变量 + `{{#x}}字母{{/x}}` 测存在性 |
| 25 | **以为 `documentId` 就是 `_id`，天然去重** | 同 `documentId` 写两次 → 两条文档、两个随机 `_id`；`GET soc-notifications/_doc/<documentId>` → `found:false` | Index 连接器的 `documentId` 只是**写进文档的普通字段**，`_id` 每次由 ES 随机生成 ⇒ 想"去重"必须自己按字段查 | `_id` 对质 `documentId` 字段；后续去重查询用 `documentId` 字段，不要用 `_doc/` |
| 26 | **logstash 反复重启，日志 401 + Pipeline error**（**坑 6 复发**） | `Could not read Elasticsearch. Please check the credentials` 循环刷，日志被当第二份配置合并 | 备份文件 `logstash.conf.bak-ecs-20261009` 放在 `pipeline/` 目录里 ⇒ `path.config` 指向**目录**时**目录内所有文件都被合并加载** | `docker compose exec logstash grep -A3 pipeline.sources` 看吞了几个文件；备份挪到 `~/elk/backups/` |

> ⭐ **坑 26 = 坑 6 复发**，这是本手册最值得自我批判的一条：坑 6 早就写在纸上，照样又踩一次——**记下来的坑不等于免疫，只有"做实验时顺手挪开备份"这种动作才叫闭环**。同理坑 7（inode）也在 Day 52 复发过一次（`sed` 重写文件 → inode 变 → sincedb 当新文件从头读 → 2017 索引一夜翻倍）。

> ⭐ **2026-10-11 补充两条（不单独编号，属查询/迁移写法）**：
> ① **CIDR 查询必须加引号**：`source.address:10.0.0.0/24` → `Failed to parse query`（`/` 被当分词符）；写 `source.address:"10.0.0.0/24"` 才命中（实测 600 条）。
> ② **迁移的"两全方案"＝reindex + 模式内改名**：ancestors 存的是**模式** `weblogs-*` 而非具体索引名 ⇒ `reindex` 保 `_id`（满足"id 存活"）＋新名仍以 `weblogs-` 开头（满足"模式匹配"）即可两全；`GET weblogs-*/_doc/<id>` **不支持通配符**（unrecognized parameter expand_wildcards），按 id 跨模式验证要用 `_search` + `{"query":{"ids":{"values":[...]}}}`。别名（alias）只在"有人拿**精确旧名**当钥匙"时才需要。 |

> ⭐ **坑 8 值得单独记住**：它的直觉反了——一个**看起来更严谨**的做法（给每条日志算指纹、保证幂等写入）造成了**证据蒸发**。安全日志的本质属性是「**内容完全相同的多条记录，本身就是攻击特征**」（40 次一字不差的爆破）。用内容当主键，等于向系统宣告"内容相同即同一条"。
> **正确的护栏是 `sincedb`：它保证"文件只被消费一次"，而不是"相同的行只留一条"。**

> ⭐ **坑 19 的三层对照**：同一个"规则没触发"，可能是三种完全不同的病——
> ① **数据层**：索引里根本没有这批数据（看 `_cat/indices`）
> ② **字段层**：数据进了，但字段名/类型/值不满足条件（`_source` 有 ≠ mapping 可查，用 `_exists_` + `terms agg` 验）
> ③ **时间层**：字段全对，但数据的 `@timestamp` 不在规则的 `from ~ to` 窗口里（date_histogram 对照）
> **先问"在哪一层"，再动手。** 详见 §10。

---

## 8. 日常操作速查

```bash
cd ~/elk
# ⚠️ Day 51 开认证后：所有 curl 必须带 -u（2026-10-11 补）。密码从 .env 取，不回显：
EP=$(grep '^ELASTIC_PASSWORD=' .env | cut -d= -f2)

# 起停
docker compose up -d | stop | restart | ps | ps -a

# Logstash 配置语法自检（不用重启）
docker compose exec logstash /usr/share/logstash/bin/logstash --config.test_and_exit \
  -f /usr/share/logstash/pipeline/logstash.conf

# 看管道到底吃了多少条（in / out 分水岭）
docker logs logstash 2>&1 | grep -E "events.in|events.out|Pipeline started" | tail

# 索引概览
curl -s -u elastic:$EP 'localhost:9200/_cat/indices?h=index,docs.count,store.size&s=index'

# 单索引条数
curl -s -u elastic:$EP 'localhost:9200/ssh-auth-2026.09.27/_count?pretty'

# 聚合看分布
curl -s -u elastic:$EP 'localhost:9200/ssh-auth-*/_search' -H 'Content-Type: application/json' \
  -d '{"size":0,"aggs":{"e":{"terms":{"field":"ssh_event.keyword"}}}}'
```

> ⚠️ **`docker compose down` 会删容器**——数据安全依赖 §1.2 的卷路径配对了没有。确认过 `docker inspect` 的挂载，再按 `down`。

---

## 9. 开启认证与 SIEM 检测（Day 51）

> **为什么有这一节**：Elastic Security 的检测引擎**必须**有"身份"才能运行 —— 它要 ① 查当前用户权限（`/_security/user/_privileges`）② 给每条规则发一把 API key（`/_security/api_key`）。`xpack.security.enabled=false` 时这两个 API **不存在**，页面只会给你 `undefined: undefined (400)`。

### 9.1 三个服务的身份模型（最小权限）

| 服务 | 身份 | 权限模型 | 用途 |
| --- | --- | --- | --- |
| 你（人） | `elastic`（超管） | 全部 | 登录 Kibana、管理 |
| Kibana → ES | 内置 `kibana_system` | cluster `monitor / manage_index_templates / monitoring/bulk…` | Kibana 自己连 ES |
| Logstash → 写数据 | 自建 `logstash_internal` + 角色 `logstash_writer_elk` | **索引级**：`ssh-auth-*`、`weblogs-*` 的 `create_index/write/create/index/manage` | 管道写日志 |
| Logstash → 上报监控 | 内置 `logstash_system` | **集群级** `cluster:admin/xpack/monitoring/bulk`（**`indices: []`**） | 上报 `.monitoring-logstash-*` |

> ⭐ **`logstash_system` 的 `indices: []` 是关键教学点**：它一个索引权限都没有，却能上报监控 —— 因为**监控走集群级 `monitoring/bulk`，不走索引级权限**。
> **同一个组件、两种用途、两套权限模型、两个身份。** 这才是"最小权限"的实际含义。

### 9.2 关键配置位置

```yaml
# docker-compose.yml（三处）
elasticsearch:
  environment:
    - xpack.security.enabled=true          # ★ 总开关
    - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}  # 首次启动给 elastic 设密码
kibana:
  environment:
    - ELASTICSEARCH_USERNAME=kibana_system
    - ELASTICSEARCH_PASSWORD=${KIBANA_SYSTEM_PASSWORD}
    - XPACK_SECURITY_ENCRYPTIONKEY=${KIBANA_SECURITY_KEY}   # 不设=每次重启随机生成，会踢掉所有登录
logstash:
  environment:
    - ES_PWD=${LOGSTASH_INTERNAL_PASSWORD}                  # 管道里 ${ES_PWD} 引用
    - XPACK_MONITORING_ELASTICSEARCH_USERNAME=logstash_system
    - XPACK_MONITORING_ELASTICSEARCH_PASSWORD=${LOGSTASH_SYSTEM_PASSWORD}
```

```bash
# .env 的 6 把密钥（openssl rand -hex 16 / 32 生成；幂等重生成前先删同名行 —— 坑 15）
KIBANA_ENCRYPTION_KEY / ELASTIC_PASSWORD / KIBANA_SYSTEM_PASSWORD /
LOGSTASH_INTERNAL_PASSWORD / LOGSTASH_SYSTEM_PASSWORD / KIBANA_SECURITY_KEY
```

### 9.3 迁移顺序（**顺序不能乱，每步带验收门**）

```
0. 备份 compose / logstash.conf / .env
1. .env 写入 6 把密钥 → grep -c '^KEY=' 每个 = 1
2. docker compose config 静态验证（只看字段非空，不打印值）
   + 差集检查：compose 引用的变量 − .env 已有的键 = 空
3. 只起 ES：up -d elasticsearch
   门：不带密码 = 401，带密码 = 200；7 个数据索引条数不变
4. 建账号（用 elastic）：
   POST /_security/user/kibana_system/_password
   PUT  /_security/role/logstash_writer_elk   { cluster:[manage_index_templates,monitor,manage_ilm],
                                                indices:[{names:[ssh-auth-*,weblogs-*],
                                                          privileges:[create_index,write,create,index,manage]}]}
   POST /_security/user/logstash_internal     { roles:[logstash_writer_elk] }
   POST /_security/user/logstash_system/_password
   门：三个账号用 .env 的密码 _security/_authenticate 全部 200
5. up -d --force-recreate kibana（logstash 视密码是否变过）
   门：/api/status = 200；logstash 无 401
```

> ⚠️ **门没过就别往下走。** "跑完了"和"跑成了"差一个检查点 —— 第 3 阶段的正常运行依赖第 2 阶段的产物，跳过第 2 阶段的门，第 3 阶段就是在没打地基的地方盖楼（当天实测：自检门 3×401/404，Kibana 503 `unable to authenticate user [kibana_system]`）。

### 9.4 迁移后的新常态

- **所有 ES/Kibana 的 curl 都要带 `-u`**：

```bash
# 从 .env 读密码，不回显（验证 ≠ 把密钥打印出来）
cd ~/elk && EP=$(grep '^ELASTIC_PASSWORD=' .env | cut -d= -f2)
curl -s -u elastic:"$EP" 'localhost:9200/_cat/indices?h=index,docs.count&s=index'
curl -s -u elastic:"$EP" -H 'kbn-xsrf: true' 'localhost:5601/api/detection_engine/privileges'
```

- 隐藏索引要 `expand_wildcards=all` 才查得到（`.security`、`.alerts-*`）
- 手册里所有 API 示例（§5、§6、§8）同样要加 `-u`

### 9.5 检测规则（Threshold 型）四件套

| 配置 | 本项目实例 | 含义 |
| --- | --- | --- |
| **查询** | `http.response.status_code : 404` | 找什么（ECS 字段，管道用 ECS 兼容 grok 所以字段可直接用） |
| **阈值** | count > 100 | 多少算异常 |
| **窗口** | `from=now-360s, to=now` | **往回看多久**（规则不是时间机器，窗口才是） |
| **节奏** | `interval = 5m` | 多久跑一轮 |

> ⭐ **建完规则默认是禁用的** —— 记得 Enable。"建了不启用 = 以为在监控，实际在睡觉。"
> 规则执行状态查证：`GET /api/detection_engine/rules/_find` → `execution_summary.last_execution.{date,status,message}`

---

## 10. 检测规则排查三层法 ⭐（数据层 → 字段层 → 时间层）

> **来源**：Day 51 实战 —— 阈值规则 `succeeded` 但告警 0，用三层法定位为"时间层"。
> **口诀：先问"在哪一层"，再动手。** 三层从便宜到贵依次排查，**不要跳层**。

### 10.0 排查总览

```
规则没触发/告警为空
  ├─ 第①层 数据层：这批数据进索引了吗？           → _cat/indices + _count
  ├─ 第②层 字段层：数据进了，字段满足条件吗？       → _exists_ + terms agg + _source 对照
  └─ 第③层 时间层：字段全对，时间在规则窗口里吗？   → date_histogram vs 规则 from/to
```

### 10.1 第①层：数据层 —— "数据进来了吗"

```bash
EP=$(grep '^ELASTIC_PASSWORD=' .env | cut -d= -f2)
# 索引在不在、条数对不对（对照你造的数据量）
curl -s -u elastic:"$EP" 'localhost:9200/_cat/indices/weblogs-*?h=index,docs.count&s=index'
```

**当天实例**：新造 150 条攻击 → `weblogs-2026.10.07` 出现，150 条 ✓ —— **此层通过**。

> ⚠️ 两个新手坑：
> ① **索引名按 UTC 日期切**（`date` filter 转完 `@timestamp` 后定的）—— 北京 19:00 = UTC 11:00 还是同一天；但北京时间早上 8 点造的数据会进**昨天**的索引。别看到"新索引名"以为坏了。
> ② **Logstash 只读「进程启动后出现的文件」**（坑 10）—— 复制一份新文件名 = 新数据，不用动配置不用重灌。

### 10.2 第②层：字段层 —— "字段满足条件吗"

**核心认知：`_source` 里看得到的字段 ≠ mapping 里可搜索的字段。** 三个探针各查一件事：

```bash
# 探针 A：字段在 mapping 里存在吗（不看值）
curl -s -u elastic:"$EP" 'localhost:9200/<索引>/_count?q=_exists_:http.response.status_code'

# 探针 B：值查得到吗（走查询路径，和规则同一条路）
curl -s -u elastic:"$EP" 'localhost:9200/<索引>/_count?q=http.response.status_code:404'

# 探针 C：聚合走不通（阈值规则底层就是聚合）
curl -s -u elastic:"$EP" -H 'Content-Type: application/json' \
  'localhost:9200/<索引>/_search' -d '{"size":0,"aggs":{"c":{"terms":{"field":"http.response.status_code"}}}}'
```

**当天实例**：A=150、B=150、C=`{"key":404,"doc_count":150}` —— **此层通过**。

> ⭐ 探针 C 一度返回空桶，差点把排查带进"mapping 坏了"的死胡同 —— 重跑显式 `"field"` 路径后一切正常。
> **教训：一次可疑输出 ≠ 结论。换一种查询路径复核，再下判断**（见 §5.1 变更纪律同一思想）。

### 10.3 第③层：时间层 —— "时间在窗口里吗"

两个对照，一眼定位：

```bash
# 对照 1：数据的真实时间分布（按分钟）
curl -s -u elastic:"$EP" -H 'Content-Type: application/json' \
  'localhost:9200/<索引>/_search' -d '{
    "size":0,
    "aggs":{"per_minute":{"date_histogram":{"field":"@timestamp","fixed_interval":"1m"},
      "aggs":{"n404":{"filter":{"term":{"http.response.status_code":404}}}}}}
  }'

# 对照 2：规则的窗口配置
curl -s -u elastic:"$EP" -H 'kbn-xsrf: true' \
  'localhost:5601/api/detection_engine/rules/_find?per_page=20' | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('data',[]):
    print(r.get('name'),'| from=',r.get('from'),'| to=',r.get('to'),'| interval=',r.get('interval'))
"
```

**当天实例**：

```
数据：150 条全部落在 11:26:00 这一分钟（404 也 150）→ 单窗密度 150 > 100，本该触发
规则：from = now-360s, to = now, interval = 5m, 上次执行 11:33:17 → 查 [11:27,11:33]
数据在 11:26:06 → 差 66 秒，永远在窗口外 → 告警 0
```

**修法取舍**：

| 修法 | 做法 | 何时用 |
| --- | --- | --- |
| **改数据时间戳** ⭐ | `sed` 把弹药时间戳推到"现在"，复制成**新文件**（坑 10：新文件才会从头读） | **验证规则**时 —— 数据该配合验证，不改产品配置 |
| 改规则 look-back | UI → Edit → Additional look-back time → `15m` | 真实运营需要更长回看时 —— ⚠️ 代价：窗口重叠 → **重复告警**，每个告警都要分辨新旧 |

### 10.4 三层法背后的攻防含义

```
攻击者：把 N 次请求摊到多个窗口 → 每窗口 < 阈值 → 永不触发
         （= Day 49 的 198.51.100.99：每 40 秒 1 次，9 分钟 15 次，规则完全失明）
防守者：小窗口高频规则 + 长窗口低阈值规则 + 按来源分组（threshold field: source.address）+ ML 异常规则
```

> **阈值规则的"窗口 × 阈值"就是它的性格**：`5m > 100` 抓急躁攻击；抓"耐心型"要么加一条 `1h > 20`（按 IP 分组），要么上 ML。**没有一条规则能抓住所有攻击姿态** —— 检测矩阵的思想，报告 §6 已述，此处落地。

---

*本手册由 92 天安全运营自学计划的 Day 49（异常登录行为分析）、Day 50（平台优化）与 Day 51（开启认证与 SIEM 检测规则）实践沉淀而成。*

> **章节速览**：0 环境 · 1 compose · 2 管道 · 3 重灌 SOP · 4 字段映射 · 5 验收与变更纪律 · 6 排查速查 · 7 坑清单（22 条） · 8 日常速查 · 9 认证与 SIEM · 10 检测规则三层法
