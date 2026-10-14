# ELK 阶段复习笔记（Day 44–52）· 大白话版

> 写法说明：每个专业名词都带【字面意思 + 大白话 + 我们环境里的真实例子】。
> 英语不好没关系——每个英文词我都先告诉你它原意是什么，你就记住那个画面。
> 用法：每天开工扫一遍「三、主线」；卡住时查「二、名词词典」和「四、坑速查」；忘了命令看「五」。

---

## 一、全局图：一套系统三个角色 + 一条数据流水线

**ELK = Elasticsearch + Logstash + Kibana**（三个词首字母，E-L-K 排不成顺子所以官方叫 Elastic Stack）。

| 角色 | 一句话人设 | 类比 |
| --- | --- | --- |
| Elasticsearch（简称 ES） | 存数据 + 查数据的引擎 | 一座图书馆：索引=书柜，文档=书，mapping=书架上的目录规则 |
| Logstash | 把乱七八糟的原始日志洗干净再送进图书馆的分拣中心 | 快递分拣站：收货→扫码识别→贴标签→上架 |
| Kibana | 图书馆的阅览室 + 检索台 + 公告栏 | 你看到的一切图表、控制台、告警页面都是它 |

**数据一条道走到黑**（记住这条线，90% 的排错都是在这条线上找断点）：

```
日志文件(VM 的 ~/elk/logs/*.log)
   ↓ Logstash file input（sincedb=书签，记读到哪了）
   ↓ filter（grok 拆解 → date 修时间 → mutate 贴/撕标签）
   ↓ output（带账号密码写进 ES）
ES 索引（weblogs-日期 / ssh-auth-日期；mapping 决定每个字段是什么类型）
   ↓
Kibana 数据视图(data view) → 图表/仪表盘
   ↓
Elastic Security 检测规则（每 5 分钟去 ES 问一次"有没有异常"）
   ↓ 命中
告警(alert) 写进隐藏索引 .internal.alerts-*
   ↓ 规则上挂了 Action
连接器(connector) 把通知送到指定地方（我们送到 ES 自己的工单索引 soc-notifications）
```

---

## 二、名词词典（按组，全部带大白话）

### A 组：ES 的骨架

| 名词 | 字面意思 | 大白话 | 我们环境里的例子 |
| --- | --- | --- | --- |
| index（索引） | 目录 | 一类日志的"书柜"，名字通常带日期 | `weblogs-2026.10.07`、`ssh-auth-2026.09.27` |
| document（文档） | 文件 | 一条日志 = 一本书；ES 里最小的存储单位 | 一行 apache 访问日志洗完后就是一个文档 |
| `_id` | — | 每本书的馆藏编号，索引内唯一 | 坑：reindex 会原样保留它，重灌(logstash 从头读)会换随机值——这就是"证据链断不断"的分水岭 |
| mapping（映射） | 对照表 | 书架目录：规定每个字段是什么类型 | 坑：mapping 是索引**出生时的快照**，改模板救不了已存在的索引 |
| field type（字段类型） | — | 字段是"文本"还是"精确值"还是"IP" | 见下一行 text/keyword/ip |
| text vs keyword | 正文 vs 关键词 | text=被切碎供搜索（不能分组/排序）；keyword=整串原样存（group by 用它） | 规则 group by 用 `source.address.keyword` 就是这个原因 |
| ip 类型 | — | 专门存 IP，能用网段查 | `source.address:"10.0.0.0/24"`（CIDR 写法）只有 ip 类型支持 |
| dynamic mapping | 动态目录 | 你没规定过的字段，ES 自作主张猜类型（字符串一律猜 text） | weblogs 之前所有字段全是 text 就是它干的 |
| index template（索引模板） | 模板 | 给"以后出生的索引"预设目录规则 | `weblogs-template`：source.address→ip + keyword 子字段 |
| shard / replica（分片/副本） | 碎片/复制品 | 书柜太大拆成格子=分片；每个格子再复印一份=副本 | 我们单节点，副本无处安放 → 集群永远 yellow，10 个 unassigned 是结构性的不是故障 |
| reindex（重索引） | 重新上架 | 把 A 索引的书整柜搬到 B，`_id` 不变 | 今天 37056 条文档 1:1 搬进 `-ecs` 索引 |
| ingest pipeline（服务端管道） | 进料流水线 | ES 自己在"入库瞬间"加工文档的地方（跟 Logstash 无关） | `weblogs-ecs-upgrade`：补 event.category/kind/action |
| `_search` / `_count` / `_cat` | — | 查内容 / 数个数 / 看清单 | `GET _cat/indices?v` 是"现在仓库里有啥" |
| `.security` 等点开头的索引 | — | 系统自用索引，默认藏起来 | 账号、告警(`.internal.alerts-*`)都藏在点索引里 |

### B 组：Logstash 管道

| 名词                          | 字面意思                      | 大白话                                        | 例子/坑                                                                  |
| --------------------------- | ------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| input / filter / output     | 进/洗/出                     | 管道的三段式                                     | 一切排错按"进→洗→出"顺序查                                                       |
| file input                  | 文件输入                      | 盯着某个目录的文件读                                 | `path => "/logs/*.log"` 是通配符，**不递归子目录**                               |
| sincedb                     | since-database，"读到哪了"的小本本 | 书签。删了它=从头重读=数据翻倍                           | 坑8/今天的 2017 索引 2×：文件换了 inode（被 sed/mv/vim 重写），sincedb 认不出来当新文件重读      |
| start_position => beginning | 起点=开头                     | 第一次见这个文件从第 1 行读                            | 配合 sincedb 才是"只从头读一次"                                                 |
| grok                        | "dissect grok"，正则的积木      | 用 `%{模式名:字段名}` 把一行日志拆成字段                   | `%{COMBINEDAPACHELOG}` 一个积木拆出十几个字段                                    |
| pattern（模式）                 | 模具                        | grok 的预制模具                                 | 8.x 的 COMBINEDAPACHELOG **自带 ECS 字段名**（source.address 等），别再手工加前缀（坑21） |
| mutate                      | 改变                        | 贴标签(add_field)/抄字段(copy)/撕标签(remove_field) | 嵌套字段必须方括号 `[event][category]`；引号点写法是字面带点的键（坑20）                       |
| date 过滤器                    | 日期修正                      | 把日志里的时间字符串搬进 @timestamp                    | 不装它，@timestamp=logstash 读到的时刻，不是案发时刻                                  |
| tags（标签）                    | —                         | 给事件挂牌子，用来走分支                               | `if "weblog" in [tags]`                                               |
| `${ES_PWD}` 环境变量替换          | —                         | 密码不写死在配置里，从容器环境读                           | Logstash 8.11 默认支持；键丢了会静默变空串（坑15 同族）                                  |
| pipeline 目录加载**所有文件**       | —                         | 备份文件放这个目录=配置被合并双份                          | **坑26**：`.bak` 害得管道起不来，备份必须挪出去                                        |

### C 组：Kibana 门面

| 名词 | 字面意思 | 大白话 | 例子/坑 |
| --- | --- | --- | --- |
| Dev Tools Console | 开发者工具台 | 直接对 ES 喊话的命令行 | **只对 ES(9200) 说话**；Kibana 自己的 API 打进去=400（坑16） |
| data view（数据视图，旧名 index pattern） | 数据视图 | 告诉 Kibana"哪些索引是一家人" | `weblogs-*`；字段列表不刷新时先点这里 |
| dashboard / Lens | 仪表盘 / 镜头 | 图表拼盘 / 拖拽式做图工具 | SSH 登录异常分析仪表盘 7 个 lens 面板 |
| saved objects（保存对象） | 保存的对象 | 仪表盘/数据视图/告警等"配置"都算对象 | Management→Saved Objects 可导出 ndjson |
| ndjson | 每行一个 JSON | Kibana 配置的导出格式 | Day 50 导出+还原验证 |
| Spaces（空间） | 房间 | Kibana 分房间隔离内容 | `restore-test` 是还原验证用的临时房间 |
| KQL | Kibana 查询语言 | 搜索框那种：`字段:值`，**不写引号吃通配符** | `source.address:10.0.0.0/24` 在 KQL 里直接能用 |
| query_string / Lucene | — | 老式语法，功能多但标点要命 | 斜杠会被分词：CIDR 要加引号 `"10.0.0.0/24"`（今天实测） |
| aggregation / terms / group by | 聚合/分桶/分组 | 按字段值分堆数个数 | 规则里 group by = 每个 IP 单独计数 |
| cardinality | 基数 | "去重后有多少个" | 用它识破 2× 重复灌入 |

### D 组：安全检测（Day 51–52 新大陆）

| 名词 | 字面意思 | 大白话 | 例子/坑 |
| --- | --- | --- | --- |
| SIEM | Security Information & Event Management | 安全信息与事件管理=日志集中+找坏人 | Elastic Security 就是开源栈里的一间 SIEM 办公室 |
| detection rule（检测规则） | 检测规则 | 定时执行的"如果…就报警" | 我们的「大量404请求检测」：每 5 分钟，404 按 IP 分组 ≥100 就告警 |
| rule type: threshold | 阈值型 | 数事件数，超线报警 | 盲区：只看次数不看状态（Day48/49 两天同一个缺陷） |
| custom query | 自定义查询 | 规则的过滤条件 | `http.response.status_code : 404` |
| severity / risk score | 严重度/风险分 | 告警的"多急"标签 | high / 73 |
| alert（告警） | — | 规则命中后生成的"案件记录" | 存在隐藏索引 `.internal.alerts-security.alerts-default-000001` |
| findings | 发现 | 逐条命中事件列表（跟 alert 两个 tab） | 我们的规则是聚合型，findings 为空正常 |
| ancestors（祖先） | 祖宗 | 告警文档里记"证据是哪几条原始日志" | 存的是 `_id`+索引模式 → reindex 保 id 则证据链存活 |
| Connector（连接器） | 连接器 | 通知的"邮差"：往哪送、怎么送 | `soc-ticket`（Index 型，免费）；Server log 型 UI 不显示（坑23） |
| Action（动作） | — | 挂在规则上的"报警后做点什么" | 不挂 Action=告警只躺在库里，"谁也不通知，不算"响应 |
| mustache `{{}}` | 小胡子模板 | 通知文案里的变量占位符 | `{{alert.id}}`；**未定义变量静默渲染空串**（坑24，最难查） |
| Available variables | 可用变量表 | 编辑器右上图标点开=权威清单 | 8.11 命名空间：`alert.*`/`rule.*`/`context.rule.*`/`date`/`kibanaBaseUrl`；`context.threshold_result` 这类**根本不存在** |
| deprecated | 被弃用的 | 旧写法还认但提示别用 | `alertId→rule.id`、`alertInstanceId→alert.id` |
| publicBaseUrl | 公开基础地址 | Kibana 告诉别人"从哪个地址访问我" | 不设=通知里的链接和 `{{kibanaBaseUrl}}` 全空；设了要重启生效 |
| frequency（Action frequency） | 频率 | 通知的聚合度+节奏 | Summary of alerts(一轮一波) vs For each alert；Per rule run / Custom frequency；默认配置=不刷屏（验收题1） |

### E 组：认证与运维

| 名词 | 字面意思 | 大白话 | 例子/坑 |
| --- | --- | --- | --- |
| xpack.security.enabled | — | ES 的"要不要查门票"开关 | 我们 Day 51 打开；开了以后所有 curl 必须 `-u elastic:$EP` |
| Basic 认证 | — | 每次请求带"账号:密码" | `EP=$(grep '^ELASTIC_PASSWORD=' .env \| cut -d= -f2)` 不回显密钥 |
| 内置账号 | — | elastic=超管；kibana_system=Kibana 的工牌；logstash_system=监控上报；logstash_internal=我们自建的数据写入工牌 | 监控走集群级 bulk，logstash_system **没有**索引权限→写数据要单独建角色（Day 51 实测） |
| RBAC（role/权限） | 基于角色的访问控制 | 工牌能开哪些门 | `logstash_writer_elk` 角色只管 `ssh-auth-*`/`weblogs-*` 的写 |
| encryptionKey | 加密密钥 | Kibana 加密自己保存的东西（含连接器密码） | 换 key=已存密钥全废 |
| .env | 环境文件 | 密码集中放这，compose 自动读；**别提交 git** | 键名重复/带尖括号会静默降级（坑15） |
| docker compose | 编排工具 | 一条命令管三个容器的起停 | `up -d` / `stop 名字` / `restart 名字` / `ps` / `logs 名字 --since 10m` |
| restart: unless-stopped | 除非手动停否则一直拉 | 容器挂了/VM 重启后自动复活 | Day 52 早实测救场 |
| crash loop | 崩溃循环 | 配置错→起不来→docker 拉起→再崩 | 看 `docker logs` 里反复出现的 JVM flags 段=在循环 |
| 开机竞态 | — | 全家一起开机，logstash 比 ES 早到 6 秒吃 401 | 先看时间戳再定罪，别急着改配置 |
| depends_on | 依赖于 | compose 只管"先后"不管"就绪" | ES 说"我还没准备好"时 logstash 已经到门口了 |

### F 组：数据建模

| 名词 | 字面意思 | 大白话 | 例子/坑 |
| --- | --- | --- | --- |
| ECS | Elastic Common Schema，弹性通用字段规范 | 全行业统一的"字段该叫什么名、长什么样" | `source.address`/`event.kind` 都是 ECS 规定的名字 |
| event.kind / category / action | 事件大类/中类/动作 | kind=event 是"一条真实事件"；category=network 网络类；action=GET | 8.x grok 模式已给一半，今天补齐另一半 |
| 字段覆盖率 | — | 多少条文档带某字段 | ssh_ip 从 263/446 → 428/446（补 disconnect grok 后） |
| fingerprint / document_id / 幂等键 | 指纹/文档id | 用内容算编号：内容相同=同一个编号=互相覆盖 | **坑8：看起来防重，实际毁证**（150 行合并成 2 条） |
| 保真纪律 | — | 索引条数必须=文件行数，一条不多一条不少 | 今天终态 19721=19721 ✓ |

---

## 三、九天主线（每天一行，串成故事）

| Day | 干了什么 | 留下的核心资产 |
| --- | --- | --- |
| 44 | ELK 三件套 docker 拉起 | `~/elk/docker-compose.yml` |
| 45 | apache 日志进 ES，Kibana 看到第一条数据 | file input + sincedb |
| 46 | grok 拆字段，date 修时间 | COMBINEDAPACHELOG |
| 47 | 仪表盘：时间线/Top IP/状态码分布 | SSH登录异常分析 + weblogs 图 |
| 48 | 第一次完整事件报告 INC-001（280 次 404） | reports/ + 报告方法论 |
| 49 | SSH 日志双层 grok + 四维分析 INC-002 | gen-auth.sh + ssh-auth-* |
| 50 | 建模补课：sincedb 保真、index template、ssh_ip→ip、密钥入 .env、642 行手册、仪表盘导出还原 | docs/ELK搭建手册.md |
| 51 | 全栈开认证（三阶段迁移+门）+ Elastic Security 第一条规则 | 手册 §9 + 规则「大量404」 |
| 52 | 通知闭环（Connector+Action+mustache 探针考古）+ weblogs ECS 迁移 | soc-ticket 工单索引 + weblogs-*-ecs |

**一句话版本**：44-47 把数据"装进来、看得见"；48-49 把数据"讲成故事"；50 把地基"补成正规"；51-52 把系统"从玩具变成能报警的岗哨"。

---

## 四、坑速查表（现象 → 一句话教训）

| # | 现象 | 教训 |
| --- | --- | --- |
| 8 | 索引条数远小于文件行数 | 内容指纹当 `_id`=重复行互相毁证；书签只信 sincedb |
| 15 | 容器起来了但行为诡异 | .env 键名重复/值带尖括号=静默降级；每个键 `grep -c` 必须=1 |
| 16 | Console 里调 Kibana API 报 no handler | Dev Tools 只对 ES(9200) 说话；Kibana API 要带 `kbn-xsrf: true` 走 5601 |
| 20 | 查询端看着正常，管道内条件不生效 | Logstash 里 `"a.b"` 是字面带点的键，嵌套必须 `[a][b]` |
| 21 | 加了 grok 前缀后全部 _grokparsefailure | 8.x COMBINEDAPACHELOG 自带 source.address，别画蛇添足 |
| 22 | 告警里 terms[].field 显示的字段在告警索引查不到 | 那只是"从源索引抄来的聚合路径标签"；且 `GET _doc/` 不支持通配符索引名 |
| 23 | API 给规则挂 server-log 成功，UI 一开就崩 | API 挂得上≠UI 能渲染；验收必须"回 UI 重开编辑器"；备份文件别放 pipeline 目录（见 26） |
| 24 | 通知送达但内容全空 | mustache 未定义变量静默空串；变量名以编辑器 Available variables 为准 |
| 25 | 以为 documentId 会去重 | Index 连接器的 documentId 只是普通字段，不是 `_id`，每次都是随机新文档 |
| 26 | logstash 反复重启，日志 401+Pipeline error | pipeline 目录**所有文件**都会被合并加载——`.bak` 备份放里面=双份配置打架；备份放 `~/elk/backups/` |
| — | 2017 索引条数一夜翻倍 | 文件被 sed/mv/vim 重写→inode 变→sincedb 认不出→从头重读；对质方法：`wc -l` vs `_count`，`cardinality` 识破 |
| — | 告警的 ancestors id 在索引里查不到 | 旧告警的证据链在 Day50 洗数据时就断了（重灌换 id）；迁移必须用 reindex（保 id） |
| — | query_string 里 CIDR 报 Failed to parse | 斜杠被分词；写 `source.address:"10.0.0.0/24"` 加引号 |

（完整编号坑列表以手册 §10 为准，Day 52 的坑 23–26 待回填手册。）

---

## 四点五、任务 B 三问 · 标准答案（"两全方案"完整推导）

> 题目：mapping 不能原地改（①），重灌会断告警证据链（②），那有没有做法**既让新索引吃到 ip mapping，又让 ancestors 的 (index, id) 二元组继续查得到**？（③）

**拆条件**：告警的 ancestors = `{"id":"3f1dc220-...","index":"weblogs-*"}`。"查得到"要同时满足：
- **A · id 存活**：那个 `_id` 得还在 —— 任何"重新写入"（含重灌）都换随机 id → 断
- **B · 名字匹配模式**：装着它的索引名字得还落在 `weblogs-*` 里 —— 注意 ancestors 存的是**模式不是全名**，这是题眼

**方案对比**：

| 路 | A | B | 判决 |
| --- | --- | --- | --- |
| 删掉重灌 | ✗ 全体换随机 `_id` | ✓ | 半死（Day50 旧告警 uuid5 孤儿=实锤，那批链已断） |
| 原地改 mapping | — | — | 根本做不到（出生快照，①） |
| **reindex → 模式内新名（`-ecs` 后缀）+ dest 挂 pipeline 补字段** | ✓ `_id` 1:1 | ✓ 新名仍被 `weblogs-*` 罩住 | **两全，Day52 已执行** |

**SOP 五步**：①先建模板（只管新生儿）→ ②reindex 保 `_id`（新名以 `weblogs-` 开头）→ ③对质：条数相等 + mapping=ip + `GET weblogs-2026.10.07-ecs/_doc/4J9_FqEBe_TKU3KFkKzp` → found:true → ④删旧索引（不删=聚合 2× 双计）→ ⑤数据视图/规则用的都是模式 → 零改动。

**别名（alias）今天为什么没出场**：B 存的是模式，新名字天然被罩住，不需要"名字伪装"。别名出场的时机是**有人拿精确旧名当钥匙**（ancestors/报表/查询写死了 `weblogs-2026.10.07`，或想做"对外一个名字、对内随时换物理索引"）——那时建同名别名指向新索引即可。一句话：**reindex 保 id 解决 A，模式内改名解决 B，别名是"精确旧名"场景的备用钥匙。**

**验证小坑**：`GET weblogs-*/_doc/<id>` 不支持通配符（unrecognized parameter expand_wildcards）；跨模式按 id 查要用 `_search` + `{"query":{"ids":{"values":[...]}}}`。

---

## 五、日常运维命令小抄（开认证后版）

```bash
cd ~/elk
EP=$(grep '^ELASTIC_PASSWORD=' .env | cut -d= -f2)   # 取密码不回显

# —— 晨检三连 ——
docker compose ps                                     # 三个 Up (healthy)
curl -s -u elastic:$EP 'localhost:9200/_cat/indices?v&h=index,docs.count&s=index'   # 条数保真
curl -s -u elastic:$EP 'localhost:9200/_cluster/health?pretty' | grep status        # yellow=单节点正常

# —— 管道健康 ——
docker logs logstash --since 10m 2>&1 | grep -iE 'error|401|grok' | tail   # 空=好消息

# —— 告警/工单 ——
curl -s -u elastic:$EP 'localhost:9200/.internal.alerts-security.alerts-default-000001/_search' \
  -H 'content-type: application/json' -d '{"size":3,"sort":[{"@timestamp":"desc"}],
  "_source":["kibana.alert.rule.name","kibana.alert.status","@timestamp"]}' | python3 -m json.tool
curl -s -u elastic:$EP 'localhost:9200/soc-notifications/_search?size=2' | python3 -m json.tool | tail -20

# —— 打弹药（时间戳刷成现在，新文件名=新文件） ——
NOW=$(date -u '+%d/%b/%Y:%H:%M:%S +0000')
sed -E "s|\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}:[0-9:]+ \+0000\]|[${NOW}]|" \
    logs/attack-redteam-1007.log > logs/attack-用途-$(date -u +%m%d-%H%M).log
```

---

## 六、自测 10 题（先答再看）

1. 为什么规则 group by 要用 `source.address.keyword` 而不是 `source.address`？
2. 改了 index template 之后，为什么老索引没变？正确姿势是什么？
3. logstash 重启后数据突然翻倍，第一个该看的文件是什么？
4. 通知送达了但内容空白，最可能的原因？怎么查权威变量名？
5. 重灌(re-ingest)和重索引(reindex)对告警证据链的影响有什么区别？
6. Kibana Dev Tools 里为什么 `GET /api/status` 报错？去哪执行才对？
7. 集群 yellow、10 个 unassigned shards，要不要慌？为什么？
8. 给规则挂 Action 之后，为什么必须回 UI 重开一次编辑器？
9. CIDR 查询在 KQL 和 query_string 里写法差别是什么？为什么？
10. "检测发生了但组织级≈没发生"说的是什么？一条告警要经过哪几环才算闭环？

<details> 
<summary>答案：</summary>
1. text 被切碎不能精确分组，keyword 整串存。<br>
2. mapping 是出生快照，模板只管新索引；老索引要 reindex。<br>
3. sincedb（书签）+ wc -l 对质 _count。<br>
4. mustache 未定义变量静默空串；编辑器右上 Available variables。<br>
5. 重灌换随机 `_id` 断证据链；reindex 保 _id 链存活。<br>
6. Dev Tools 只对 ES 说话；Kibana API 走 5601 带 kbn-xsrf。<br>
7. 不慌，单节点副本无处安放是结构性的。<br>
8. API 挂得上≠UI 渲染得了（server-log 教训）。<br>
9. query_string 要加引号——斜杠被分词；KQL 原生支持。<br>
10. 链条=检测→通知→响应→复盘，缺通知=断第二环。<br>
</details>
---

*成稿：Day 52（2026-10-09）· 迁移终态：weblogs 全部 7 索引 ECS 化，总条数 19721 = 源文件行数，证据链 id 逐一存活*
