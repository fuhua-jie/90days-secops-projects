DVWA-XSS学习

- XSS的含义

定义：攻击者把恶意脚本注入到网页里，浏览器当成网页自己的代码执行了。

关键条件：浏览器分不清"这是我网站的代码"还是"这是攻击者塞进来的代码"。只要HTML里出现了 <script> 或 onerror 这类可执行标签，浏览器就无条件执行。

两个核心概念（贯穿今天的全部实验）：

| 概念 | Reflected（反射型） | Stored（存储型） |
|---|---|---|
| 攻击脚本藏在哪 | URL参数/搜索框 | 数据库（服务器端） |
| 触发方式 | 受害者点击链接 | 受害者打开网页 |
| 有效期 | 一次性，链接即毁 | 持久，每次访问都触发 |
| 危害 | 中（需要诱导点击） | 高（可批量收割） |
| DVWA对应页面 | XSS（Reflected） | XSS（Stored） |

记忆锚点：反射性="脚本在URL里/输入即输出"；存储型="脚本进了数据库/输出即执行"。

- Low级别实操

- Reflected XSS

1）尝试输入 1

![](images/2-DVWA-XSS/2-DVWA-XSS_001.png)

然后右键查看源码，

![](images/2-DVWA-XSS/2-DVWA-XSS_002.png)

发现Hello 1在 <pre> 标签里

2）输入 <script>alert('XSS')</script>

![](images/2-DVWA-XSS/2-DVWA-XSS_003.png)

<script>alert('内容|文件')</script>

成功原因：源码里 $name = $_GET['name']; 直接拼接进HTML, 没有任何过滤

原理拆解：你输入的内容原样输出到 <pre>Hello {你的输入}</pre> ,浏览器解析式把 <script> 当成了真正的标签。

- Stored XSS

- 输入随便内容

![](images/2-DVWA-XSS/2-DVWA-XSS_004.png)

会正常输出

- 输入 <script>alert('Stored XSS')</script>

![](images/2-DVWA-XSS/2-DVWA-XSS_005.png)

![](images/2-DVWA-XSS/2-DVWA-XSS_006.png)

代码：<script>alert('内容|文件')</script>

观察：1、就算刷新页面，弹窗还是会出现

2、重要的是：换台浏览器，或者刷新后重新访问，弹窗还是会出现--因为脚本已经写进数据库了，这就是“存储型”和“反射型”的本质区别

3、关键认知：反射型你要把恶意链接发给受害者；存储型只要有人打开了这个留言板页面，就自动中招--攻击者不需要受害者做任何操作

- Medium级别

- 先要看懂做了什么防护

反射型：

$name = str_replace( '<script>', '', $_GET[ 'name' ] );  // 只删 <script> 小写

读懂它：srt_replance('<script>','', ...) 的意思--把 <script> 替换成空字符串。注意：只删了 <script> 这一个词，大小写敏感。

存储型：

// Message 字段—— 三重防护 ❌

$message = strip_tags( $message );        // ① 删掉所有 <> 标签

$message = addslashes( $message );       // ② 转义引号

$message = htmlspecialchars( $message );  // ③ 转义 < > & " 为 HTML 实体

// Name 字段 —— 只防小写 script ⚠️

$name = str_replace( '<script>', '', $name );  // 只删 <script> 小写

读懂它：message里的 strip_tags() 把所有HTML标签直接剥光，不管 <img> 还是 <script> 全部删除，所有我的payload根本进不了数据库。

但是name字段却只过滤了小写 <script> ，大写 <SCRIPT> 直接绕过。

- 绕过思路A：大小写混淆

1）先尝试以下正常写 <script>alert('XSS')</script>

![](images/2-DVWA-XSS/2-DVWA-XSS_007.png)

正常输出出来了，并没有弹窗，失败了

2）因为过滤区分大小写，所以输入<SCRIPT>alert('XSS')</SCRIPT>

![](images/2-DVWA-XSS/2-DVWA-XSS_008.png)

3）存储型：

![](images/2-DVWA-XSS/2-DVWA-XSS_009.png)

首先要先F12（或者直接右键检查）找到name字段的代码，删掉maxlength="10" 的字段，因为name设定限制字段数量。

然后输入 <SCRIPT>alert(1)</SCRIPT>

![](images/2-DVWA-XSS/2-DVWA-XSS_010.png)

- 绕过思路B：用别的标签（更推荐，因为更通用）

既然它只封了 <script> ，那就用不需要 <script> 的标签：

<img src=x onerror=alert('XSS')>

1）反射型：

![](images/2-DVWA-XSS/2-DVWA-XSS_011.png)

2）存储型：

![](images/2-DVWA-XSS/2-DVWA-XSS_012.png)
![](images/2-DVWA-XSS/2-DVWA-XSS_013.png)

#每次刷新页面都会多出来，最底下那条消息

原理： src=x 加载一张不存在的图片 → 触发 onerror 事件 → 执行 alert('XSS') 。这是XSS里最常用的payload之一，几乎能绕过所有只封 <script> 的过滤。

- High级别

- 先看High级的过滤代码

反射型：

$name = preg_replace( '/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['name'] );

存储型：

//	Message字段

$message = strip_tags( addslashes( $message ) );   //删掉所有 <> 标签并且转义引号

$message = htmlspecialchars( $message );         //转义 < > & " 为 HTML 实体

效果：任何 HTM L标签都进不去，strip_tags() 直接全删 →  Message 不可注入，死路一条。

//	Name字段

$name = preg_replace( '/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['name'] );

正则拆解：

| 部分 | 含义 |
|---|---|
| < | 匹配左尖括号 |
| (.*)s | s 字母，中间任意字符 |
| (.*)c | c 字母，中间任意字符 |
| (.*)r | r 字母 ... |
| (.*)i | i 字母 |
| (.*)p | p 字母 |
| (.*)t | t 字母 |
| /i | **忽略大小写**（所以大写 SCRIPT 也删） |

防御对象：任何包含 s→c→r→i→p→t 六个字母（按顺序出现）的标签，不论大小写，不论中间插了什么字符。

绕过点：正则只匹配 script 这个词，不匹配其他标签。<img> 没有 script 字母 → 完全在正则的视野之外。

- 反射型

A：<img src=x onerror=alert('XSS')>

![](images/2-DVWA-XSS/2-DVWA-XSS_014.png)
![](images/2-DVWA-XSS/2-DVWA-XSS_015.png)

B：<svg onload=alert(1)>

![](images/2-DVWA-XSS/2-DVWA-XSS_016.png)
![](images/2-DVWA-XSS/2-DVWA-XSS_017.png)

- 存储型

因为要在name输入，所以需要F12删除 maxlength="10" 才能输入更多的字符

A：<img src=x onerror=alert('hello')>

![](images/2-DVWA-XSS/2-DVWA-XSS_018.png)

B：<svg onload=alert('no')>

![](images/2-DVWA-XSS/2-DVWA-XSS_019.png)
![](images/2-DVWA-XSS/2-DVWA-XSS_020.png)

为什么能过：这些标签里根本没有 script 字母，正则完全匹配不到，浏览器照样执行 onerror/onload 事件

- 问题

- 如果我改成 <img src=x onerror=alert(1)> 但没有引号，还能过吗？

能过，如果过滤字段加了 addslashes 的话，会转义引号，最好就不加引号

- 如果 alert 被过滤了，我能用什么替代？

可以用 confirm、prompt、location 等。

- 三级源码对比表

| 级别 | 过滤方式 | 绕过方法 | 防护强度 |
|---|---|---|---|
| Low | 无过滤，直接输出 | 直接<script> | ❌ 无防护 |
| Medium | str_replace('<script>','') | 大小写混淆 / <img onerror> | ⚠️ 弱（只堵一条路） |
| High | preg_replace 正则 +addslashes | <img onerror> / <svg onload> | 🔶 中（堵了 script 但没堵事件） |

核心规律：所有 XSS 绕过，本质都在找"过滤规则没覆盖到但浏览器能执行"的输入。搞懂过滤正则，就等于拿到了答案

- 防御总结

为什么不能靠"过滤"一劳永逸：黑名单永远有漏网之鱼，上面 High 级就是活例子。

正确防御（4 条）：

输出编码：htmlspecialchars() 把 < > " & 转义成实体，浏览器就不会当作标签——这是最根本的（DVWA 的 Impossible 级就是这么做的）

输入验证：白名单校验，只允许期望的字符（如数字、字母）

CSP（内容安全策略）：HTTP 响应头限制脚本来源，即使注入成功也执行不了

HttpOnly Cookie：让 JS 读不到 Cookie，XSS 盗 Cookie 就失效

- 日志查询

1、Apache/Nginx 日志格式（生产环境标配）

标准格式：

192.168.1.100 - - [10/Aug/2026:14:23:45 +0800] "GET /search?q=%3Cscript%3Ealert(1)%3C/script%3E HTTP/1.1" 200 1234 "https://www.example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

字段解析：

| 字段 | 示例 | 说明 |
|---|---|---|
| 客户端 IP | 192.168.1.100 | 攻击者来源 IP |
| 时间戳 | [10/Aug/2026:14:23:45 +0800] | 精确到秒 |
| 请求方法 | GET | POST/GET |
| 完整 URL | /search?q=%3Cscript%3Ealert(1)%3C/script%3E | 含参数，Payload 全在这 |
| 状态码 | 200` | 200=成功，404=不存在，500=服务器报错 |
| 响应大小 | 1234 | 字节数 |
| Referer | https://www.example.com/ | 从哪跳过来的 |
| User-Agent | Mozilla/5.0 ... | 浏览器/工具指纹 |

2、反射型XSS在日志长什么样

原始 Payload:    <script>alert('XSS')</script>

URL 编码后:      %3Cscript%3Ealert('XSS')%3C/script%3E

日志里实际记录的是编码后的：

192.168.1.100 - - [10/Aug/2026:14:23:45 +0800] "GET /vulnerabilities/xss_r/?name=%3Cscript%3Ealert('XSS')%3C/script%3E HTTP/1.1" 200 1234

3、SOC如何从日志抓XSS攻击

实时 grep 规则（Linux 生产环境）：

tail -f /var/log/apache2/access.log | grep -iE \  '<script|onerror=|onload=|onclick=|javascript:|alert\(|confirm\(|prompt\(''

SIEM 告警规则（Splunk / ELK 等）：

检测条件：

1. 请求 URI 包含：<script 或 onerror 或 onload

2. 且状态码 = 200（攻击成功）

3. 且 Referer 为空或异常（非本站内跳转）

触发动作：生成告警 → 封禁源 IP 24 小时

4、存储型XSS为什么日志抓不到

| 类型 | Payload 位置 | 标准日志能看见吗 | 怎么抓 |
|---|---|---|---|
| 反射型 GET | URL 参数 | ✅ 清晰可见 | grep access.log |
| 反射型 POST | POST Body | ❌ 看不见 | WAF / 应用层日志 |
| 存储型 | 数据库 | ❌ 看不见 | WAF / 数据库审计 / 应用层日志 |

存储型 XSS 的日志追踪链路：

攻击者 POST 提交 Payload 到留言板

↓

日志只记录: POST /guestbook.php 200 OK（看不到内容）

↓

Payload 存入数据库

↓

其他用户访问留言板 → 浏览器执行脚本

↓

日志只记录: GET /guestbook.php 200 OK（看不到执行了啥）

5、生产环境安全日志体系（完整图）

访问日志（Apache/Nginx）

├─ 反射型 XSS → ✅ 可检测

└─ 存储型 XSS → ❌ 不可见

WAF 日志（ModSecurity / Cloudflare / 云 WAF）

├─ 反射型 XSS → ✅ 检测 + 拦截 + 记录 Payload

└─ 存储型 XSS → ✅ 拦截 POST Body 中的恶意标签

数据库审计日志

└─ 存储型 XSS → ✅ 记录 INSERT 语句中的恶意内容

应用层日志（代码埋点）

└─ 所有类型 → ✅ 完全可控，最可靠

6、总结

反射型XSS的Payload在URL里 → 访问日志直接抓到 → 适合SOC自动化告警
存储型XSS的Payload在数据库里 → 标准日志抓不到 → 必须靠WAF或应用层审计
