DVWA-CSP Bypass

- 含义

- CSP全称：Content Security Policy（内容安全策略）

- CSP是什么

CSP是一个HTTP响应头，用来告诉浏览器：“这个页面只允许加载那些来源的资源”。

Content-Security-Policy: script-src 'self'

这行字的意思是：JavaScript只允许来自本站（self），其他一律拒绝。

- 为什么CSP重要

回顾学过的XSS：攻击者在页面里注入<script>偷token</script>,浏览器就执行了。CSP就是给XSS加的第二道防线——即使攻击者成功注入脚本，CSP也能让浏览器拒绝执行它。

🎯关键认知（安全运营视角）：

- XSS是漏洞本身，CSP是缓解措施（mitigation）

- CSP不能“修复”XSS漏洞，但能让XSS打不出来

- 作为运营，你要审查并配置CSP，同时确保它没配错

- 四个级别的CSP配置

| 等级 | CSP配置 | 漏洞本质 |
|---|---|---|
| Low | script-src 'self' + 一堆白名单域名 | 白名单里混进了"能托管任意JS"的CDN |
| Medium | script-src 'self' 'unsafe-inline' nonce-xxx | 'unsafe-inline'直接放行内联脚本 |
| High | script-src 'self' | 看起来严格，但'self'内有个漏洞JSONP端点 |
| Impossible | script-src 'self' + 安全JSONP | 回调硬编码+数据JSON编码，无注入点 |

- 逐级拆解

- Low级：白名单里混进了危险CDN

- 源码

$headerCSP = "Content-Security-Policy: script-src 'self' https://pastebin.com hastebin.com

www.toptal.com example.com code.jquery.com https://ssl.google-analytics.com

unpkg.com cdn.jsdelivr.net digi.ninja ;";

header($headerCSP);

// 用户输入的 URL 直接塞进 <script src>

$page[ 'body' ] .= "<script src='" . $_POST['include'] . "'></script>";

- 漏洞分析：

白名单里有unpkg.com和cdn.jsdelivr.net——这俩是npm包的公共CDN，任何人都能把任意JS上传成npm包，然后通过它们托管加载。

- 攻击者的思路：

- 写一个alert(1)的JS，发布到npm或GitHub

- 通过unpkg.com / jsdelivr的URL加载它

- 因为这个域名在白名单里，CSP放行 → 脚本执行

- DVWA源码注释里直接给了两个现成的：

https://cdn.jsdelivr.net/gh/digininja/csp_bypass/alert.js

https://unpkg.com/@digininja/csp_bypass@1.0.0/index.js

- 运营认知

配置CSP白名单时，混入可托管任意内容的CDN=没有配置。unpkg、jsdelivr、GitHub Pages、pastebin这类"人人可上传"的平台，都不能进script-src白名单

- Medium级：'unsafe-inline'形同虚设

1）源码

$headerCSP = "Content-Security-Policy: script-src 'self' 'unsafe-inline' 'nonce-TmV2ZXIgZ29pbmcgdG8gZ2l2ZSB5b3UgdXA=';";

header ("X-XSS-Protection: 0");  // 还关掉了浏览器自带的 XSS 防护

// 用户输入直接原样插入页面

$page[ 'body' ] .= $_POST['include'];

2）漏洞分析：

关键规则：当 script-src 里同时出现 nonce 和 'unsafe-inline' 时，现代浏览器会忽略 'unsafe-inline'，只认 nonce。

所以：

- <script>alert(1)</script> → 没有 nonce → ❌ 被浏览器拦截

- <script nonce="...">alert(1)</script> → 带正确 nonce → ✅ 放行

源码注释里也写了答案：

<script nonce="TmV2ZXIgZ29pbmcgdG8gZ2l2ZSB5b3UgdXA=">alert(1)</script>

3）🎯运营认知

'unsafe-inline'是CSP里最著名的坑——加上它，script-src对内敛脚本的防御基本失效。真正安全的内敛脚本应该用nonce（一次性随机数）+去掉'unsafe-inline'.

- High级：'self'里藏了个漏洞JSONP

- 源码

$headerCSP = "Content-Security-Policy: script-src 'self';";  // 严格！只允许本站

header($headerCSP);

// 但用户输入还是原样插入

$page[ 'body' ] .= $_POST['include'];

// 页面还加载了一个 JSONP 端点

<script src="source/high.js"></script>

而 jsonp.php 长这样：

<?php

header("Content-Type: application/json; charset=UTF-8");

echo "alert(1)";   // ← 直接输出 alert(1)！

?>

- 漏洞分析：

CSP是script-src 'self'，所以攻击者不能加载外部脚本，也不能写内联脚本。但注意——‘self’允许加载本站的脚本！

于是攻击者提交：

<script src="source/jsonp,php"></script>

这个source/jsonp.php是本站路径，符合'self' → CSP放行 → jsonp.php输出alert(1) → 被当作JS执行 → 弹窗。

- 🎯运营认知：

‘self’看起来很严格，但前提是本站所有端点都安全。如果站内存在一个能输出任意JS的JSONP端点（或上传了一个恶意JS文件），'self‘反而成了帮凶。JSONP回调参数是经典攻击面。

- Impossible级：修复了JSONP漏洞

// jsonp_impossible.php —— 对比 jsonp.php

$outp = array ("answer" => "15");

echo "solveSum (".json_encode($outp).")"; // ← 回调函数名硬编码，数据 JSON 编码

三处关键修复：

| 对比 | High（jsonp.php） | Impossible（jsonp_impossible.php） |
|---|---|---|
| 输出内容 | alert(1)（裸JS） | solveSum({"answer":"15"}) |
| 回调函数 | 无（任何JS可执行） | 硬编码solveSum |
| 数据 | 裸文本 | json_encode()编码，无法注入 |

运营认知：JSONP要安全，必须回调函数名硬编码（不接受用户传callback）+数据JSON编码。这才能堵住"把JSONP当JS执行器"的滥用。

- 安全运营的CSP检查清单

审查线上系统，看到 CSP 头，按这张表逐项检查：

| # | 检查项 | 危险信号 | 安全做法 |
|---|---|---|---|
| 1 | script-src有没有'unsafe-inline'? | ✅ 有=内联脚本防线失效 | 用nonce/hash，去掉unsafe-inline |
| 2 | 白名单域名是否“人人可上传"？ | unpkg/jsdelivr/pastebin/GitHub Pages | 只放自己可控的域名 |
| 3 | 站内有没有JSONP端点？ | callback参数可被用户控制 | 回调硬编码+json_encode |
| 4 | 有没有'self'但站内可上传JS？ | 上传目录+'self' | 上传文件用独立域名/CDN |
| 5 | 是否还配了object-src base-uri等? | 只配script-src不够 | 至少加object-src 'none' |
| 6 | nonce是不是真随机、一次性? | 写死nonce（Medium就是） | 每次请求重新生成 |

- 实操

- Low级

在输入框里粘贴这个 URL，点 Include：

https://unpkg.com/@digininja/csp_bypass@1.0.0/index.js

结果：
![](images/14-DVWA-CSP-Bypass-内容安全策略绕过/14-DVWA-CSP-Bypass-内容安全策略绕过_001.png)

原理：	CSP 白名单里允许 unpkg.com

↓

你提交 unpkg.com 上的恶意 JS 链接

↓

CSP 一看：unpkg.com 在白名单里 → 放行

↓

浏览器加载并执行了那个 JS → 弹窗

这就是 Low 级的核心教训：白名单混进"人人可上传"的 CDN = 没配置。攻击者只要把恶意 JS 发到 npm/GitHub，就能通过 unpkg/jsdelivr 加载，CSP 完全拦不住。

- Medium级

输入框里输入：

<script nonce="TmV2ZXIgZ29pbmcgdG8gZ2l2ZSB5b3UgdXA=">alert(1)</script>

结果：
![](images/14-DVWA-CSP-Bypass-内容安全策略绕过/14-DVWA-CSP-Bypass-内容安全策略绕过_002.png)

- High级

这一级 CSP 变成了最严格的 script-src 'self'（只允许本站脚本），所以外部脚本、内联脚本都不行了。

但注意：页面里藏了一个漏洞端点 jsonp.php，它直接输出 alert(1)。

- 只要点击Solve the sum就会自动加载jsonp.php

结果：
![](images/14-DVWA-CSP-Bypass-内容安全策略绕过/14-DVWA-CSP-Bypass-内容安全策略绕过_003.png)

- 所有我们做个正式攻击（手动POST）

用浏览器 Console 直接发 POST，把注入的脚本送进去：

fetch("/dvwa/vulnerabilities/csp/", {

method: "POST",

credentials: "include",

headers: {"Content-Type": "application/x-www-form-urlencoded"},

body: "include=" + encodeURIComponent('<script src="source/jsonp.php"></script>')

}).then(r => r.text()).then(t => {

console.log("已提交，页面已重新渲染");

document.write(t);  // 用返回的 HTML 重新渲染，触发脚本执行

});

⚠️ document.write 会覆盖当前页面，属于攻击演示手段（真实攻击者用 curl 发请求 + 浏览器访问响应）。

结果：
![](images/14-DVWA-CSP-Bypass-内容安全策略绕过/14-DVWA-CSP-Bypass-内容安全策略绕过_004.png)

💡 这一步的意义：攻击者不需要页面给你输入框。只要后端还在处理 include 参数，就能用工具（fetch/curl/Burp）直接构造请求打进去。这和你昨天 JavaScript Attacks 的"方法 B"是同一个道理——页面只是壳，服务端处理逻辑才是攻击面。

- 总结

| 等级 | CSP配置 | 绕过方式 | 核心教训 |
|---|---|---|---|
| Low | 'self' + 白名单 CDN | 用 unpkg.com 托管恶意 JS | 白名单混入可上传平台=没防御 |
| Medium | 'unsafe-inline' + 写死的 nonce | 用写死的 nonce 绕过 | nonce必须随机，写死=形同虚设 |
| High | script-src 'self'（严格） | 手动POST+利用站内JSONP漏洞 | 'self'只保证来源，不保证安全 |

- 对安全运营的价值

CSP 是你学过的第一个"防御配置"型模块——前面全是"怎么攻"，这个是"怎么防、防错了会怎样"。安全运营的日常就是审查和配置这类防御头。

记住这 4 条红线：

❌ script-src 里别加 'unsafe-inline'（除非配了真随机 nonce）

❌ 白名单里别放 unpkg / jsdelivr / pastebin / GitHub Pages 这类"人人可传"的域名

❌ nonce 别写死，必须每次请求随机生成

❌ 站内有 JSONP 端点时，回调函数必须硬编码 + 数据 json_encode

CSP 和 XSS 的关系一句话：XSS 是漏洞，CSP 是缓解。CSP 不能修复 XSS，但配置正确的 CSP 能让 XSS 打不出来；配置错误的 CSP 等于白配。
