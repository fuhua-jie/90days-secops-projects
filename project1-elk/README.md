# 项目一：基于 ELK 的 Web / SSH 日志安全分析与告警平台

> 用 Docker Compose 单机部署 ELK 8.11，建成一条
> **日志采集 → 解析入库 → 可视化 → 告警 → 告警分析 → 报告输出** 的完整安全运营流水线。

## 项目概览

| 项 | 内容 |
|---|---|
| **技术栈** | Docker Compose · Elasticsearch 8.11 · Kibana 8.11（Lens / Alerting / Dev Tools）· Logstash 8.11 · Grok · ECS |
| **数据源** | Apache Combined（Web 访问日志）· Linux sshd（认证日志）|
| **数据规模** | 公开真实数据集 **17,335 行** + 自建认证日志 **446 行** |
| **产出** | 仪表盘 **2 个**（共 9 面板）· 告警规则 **2 条** · 告警分析报告 **1 份** |

---

## 数据流

```
┌──────────────────────── 宿主机 ./logs ────────────────────────┐
│   *.log（Web 访问日志）          auth/*.log（SSH 认证日志）      │
└──────────┬──────────────────────────────┬────────────────────┘
           │ file input                   │ file input
           │ tags=["weblog"]              │ tags=["ssh"]
           ▼                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    Logstash 8.11                         │
   │  filter:                                                 │
   │    if "weblog" in [tags]                                 │
   │      └─ grok %{COMBINEDAPACHELOG}  →  date（时区）        │
   │    if "ssh" in [tags]                                    │
   │      └─ grok 信封层 → grok 正文层 → mutate 标注 → date    │
   │  output:                                                 │
   │    if "weblog" in [tags]  → index weblogs-%{+YYYY.MM.dd}  │
   │    if "ssh"    in [tags]  → index ssh-auth-%{+YYYY.MM.dd} │
   └───────────────────────────┬──────────────────────────────┘
                               ▼
                 ┌───────────────────────────┐
                 │    Elasticsearch 8.11     │
                 └─────────────┬─────────────┘
                               ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    Kibana 8.11                           │
   │  Discover 排查 · Lens 出图 · Alerting 告警 · Dev Tools    │
   └──────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
project1-elk/
├─ docker-compose.yml               # ELK 三件套编排
├─ logstash/
│  └─ pipeline/logstash.conf        # 日志解析管道（多源分流 + 两层 Grok）
├─ kibana/
│  └─ alert-rules.md                # 告警规则说明（含阈值盲区分析）
├─ scripts/
│  └─ gen-auth.sh                   # 测试数据生成脚本（可复现）
└─ reports/
   └─ INC-20260925-001-大量404请求.md  # 告警分析报告
```

> **密钥不落盘**：`KIBANA_ENCRYPTION_KEY` 通过 `.env` 注入（见「快速开始」），
> `.env` 已被 `.gitignore` 忽略，**不会进入版本库**。

---

## 快速开始

```bash
# 1. 生成密钥并写入 .env（.env 已被 .gitignore 忽略，不会进版本库）
echo "KIBANA_ENCRYPTION_KEY=$(openssl rand -hex 32)" > .env

# 2. 启动（ES / Kibana 冷启动约 1~2 分钟）
docker compose up -d

# 3. 验证
curl localhost:9200/_cat/indices?v
#   Kibana: http://localhost:5601
```

> ⚠️ **`XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY` 是必须的** ——
> 缺少它时 Kibana Alerting 的 Connector 会报 500。
> **改完 `.env` 后必须 `docker compose up -d kibana`**（只 `restart` 不会重载环境变量）。

---

## 关键技术点

### 1. 多源日志分流：`tags` + `if`

一个 Logstash 管道同时处理两类日志时，**filter 会作用在所有事件上**。
因此必须先在 input 层用 `tags` 给事件贴身份标签，再用 `if` 分流：

```ruby
input {
  file { path => "/logs/*.log"      tags => ["weblog"] }
  file { path => "/logs/auth/*.log" tags => ["ssh"]    }
}

filter {
  if "weblog" in [tags] { ... }
  if "ssh"    in [tags] { ... }
}

output {
  if "weblog" in [tags] { elasticsearch { index => "weblogs-%{+YYYY.MM.dd}"   } }
  if "ssh"    in [tags] { elasticsearch { index => "ssh-auth-%{+YYYY.MM.dd}"  } }
}
```

> **注意**：`tags` 是**数组**，必须用 `in` 判断。
> 写成 `[tags] == "ssh"`（数组比字符串）**永远是 false** —— 而且**不报错，只是静默丢弃所有数据**。

### 2. 两层 Grok：把「信封」和「正文」分开

sshd 日志的结构是「**格式统一的信封**」+「**形态多变的正文**」：

```
2026-09-27T02:10:00.382928+00:00 soc sshd-session[11485]: Failed password for invalid user oracle from 198.51.100.29 port 39667 ssh2
└────────────── 信封（每条都一样）──────────────┘  └──────────── 正文（好几种形态）────────────┘
```

- **第一层**拆信封 → `log_timestamp` / `host_name` / `process` / `pid` / `ssh_message`
- **第二层**拆正文 → 从 `ssh_message` 提取 `ssh_name` / `ssh_ip`

| 好处 | 说明 |
|---|---|
| 正文形态变多 | **只改第二层** |
| 信封格式变化 | **只改第一层** |
| 可读性 | 一层写完会非常长且难维护 |

### 3. 把日志归一化成「客观事件类型」

解析层**只记录"发生了什么"**（客观），"是不是攻击"留给分析层（主观判断）：

| `ssh_event` | 含义 |
|---|---|
| `login_success` | 登录成功 |
| `login_failed` | 登录失败 |
| `invalid_user` | 无效用户探测 |
| `disconnect` | 连接断开 |
| `pam_unix` | 会话事件 |
| `service_event` | 服务事件 |
| **`other`** | **兜底**（出现即说明日志格式变了）|

> 🎯 **`else` 兜底是关键设计**：
> 它**既消除空值**（聚合时不会出现 `-` 长条），**又是一个"日志格式变化探测器"** ——
> 新形态会全部落进 `other`，趋势图上一眼可见。

### 4. 时间必须显式处理

`@timestamp` 默认是 **Logstash 读到日志的时间**，而不是日志里的时间。
必须用 `date` 过滤器转换，**格式的选择取决于源字符串是否自带时区**：

```ruby
# auth.log 自带 +00:00 → ISO8601 直接可用，不需要 timezone
date { match => [ "log_timestamp", "ISO8601" ]  target => "@timestamp" }

# Apache Combined 不自带 → 必须手写格式（Z 表示从字符串里读时区）
date { match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ] }
```

> ⚠️ **`date` 过滤器的两个静默陷阱**：
> ① 源字段**不存在** ② 格式**对不上** —— **都不报错**，
> `@timestamp` 会保持"读取时间"，导致**所有历史事件挤在"刚刚"**。
>
> **验证方法**：在 Kibana 里对比 `@timestamp` ↔ `message` 里的原始时间。
>
> 💡 **索引名 `%{+YYYY.MM.dd}` 也取自 `@timestamp`** ——
> 所以时间错了索引名会跟着错，**这反而成了最好的验证信号**。

---

## 踩过的坑（★ 真实调试记录，也是本项目最有价值的部分）

| # | 坑 | 现象 | 根因与解决 |
|---|---|---|---|
| 1 | **Grok 模式多了一个 `}`** | 446 条日志 **100% 解析失败**，但 Logstash **完全不报错** | 字符串里每个 `%{…}` 只贡献一个 `}`。多写的那个让模式末尾要求一个**不存在的 `}`** —— 正则回溯也找不到，整条失败。**只能靠 `_grokparsefailure` 标签发现** |
| 2 | **`TZ=Asia/Shanghai` 静默失效** | 生成的数据时间偏 8 小时，"凌晨登录"变成上午 | 时区库不可用时会**静默回退到 UTC**。改用**不依赖时区库**的数值偏移：`date -u -d "$1 +0800"` |
| 3 | **备份文件留在 pipeline 目录** | 解析**成功**的事件也全被打上 `_grokparsefailure` | Logstash 会读取目录下**所有文件**并**合并成同一个管道**（不是只读 `*.conf`）。`.bak` 里的旧配置与新配置**同时在跑**，各干各的 |
| 4 | **`rm -f` 换 inode 不可靠** | 重建文件后重灌，只有零星几条新数据进入 | 文件系统会**复用 inode**，而 sincedb 按 inode 记进度 → 以为"已读过"，**只读文件尾部**。改用 `sincedb_path => "/dev/null"` 让每次重启都全量重读 |
| 5 | **数据卷路径笔误 `/user/share`** | 改回 `/usr/share` 并重建容器后，**索引全部消失**（**实测**）| 应为 `/usr/share`。Docker 对不存在的挂载路径**不报错**，静默创建空目录 → ES 数据实际一直写在**容器可写层**里，容器一重建就全丢。<br>**恢复**：因已配置 `sincedb_path => "/dev/null"`，重启 Logstash 即**自动全量重灌** —— 实测 5 个索引的文档数与原始**完全一致**（`weblogs-2017.01.10` 5280 / `weblogs-2017.01.11` 12055 / `weblogs-2026.09.14` 6 / `weblogs-2026.09.25` 280 / `ssh-auth-*` 48+398），**全程零手工操作** |
| 6 | **阈值规则抓不住低速攻击** | 10 分钟只打 15 次的爆破**完全无告警** | `>100 次 / 5 分钟` 只能抓"快"的。攻击者把 280 次摊到 5 小时即可绕过。需改用**与速率无关的特征**，如**路径种类数（去重）** |

> 🎯 **这 6 条全部属于「静默失败」** —— 不报错、日志干净、但结果是错的。
>
> **排查它们的共同方法**：
> **不要问"我写的是什么"，要问"运行中的到底是什么"** ——
> ```bash
> docker compose exec logstash ls -la /usr/share/logstash/pipeline/
> docker compose exec logstash cat /usr/share/logstash/pipeline/logstash.conf
> ```

---

## 告警分析报告

| 报告 | 场景 | 结论 |
|---|---|---|
| [INC-20260925-001](reports/INC-20260925-001-大量404请求.md) | 大量 404 请求 | 定位 2 个攻击源：**字典化目录枚举**（30 个高价值路径 × 8 轮循环）+ **单点认证爆破**（同一路径 40 次）；依据全部 404 判定 **均未成功** |

**分析方法**：沉淀「**时间 → 来源 → 目标 → 结果**」四维告警分析法。

---

## 关联文件

- [告警规则说明（kibana/alert-rules.md）](kibana/alert-rules.md) —— 两条规则的完整配置与**阈值盲区分析**
