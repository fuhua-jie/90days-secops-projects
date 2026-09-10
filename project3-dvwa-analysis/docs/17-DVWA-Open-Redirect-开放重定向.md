DVWA-Open HTTP Redirect

- 定义

页面有两个链接，指向黑客名言（电影Hackers的台词）。点击后，服务器通过header("location: ...")重定向到info.php显示名言。

正常流程：

用户点 "Quote 1"

↓

链接：source/low.php?redirect=info.php?id=1

↓

low.php 读取 redirect 参数 → header("location: info.php?id=1")

↓

浏览器跳转到 info.php?id=1 → 显示名言

漏洞：redirect参数是用户可控的。攻击者把它改成任意外部URL，用户就被跳转到恶意网站。

🎯 一句话：服务器拿到用户传的 URL，没验证就直接跳——这就是开放重定向。

- 为什么开放重定向危险（安全运营必懂）

- 钓鱼攻击的完美伪装

攻击者构造链接：

https://trusted-bank.com/redirect?url=https://evil-phishing-site.com

用户看到的：

- ✅ 域名是 trusted-bank.com（可信！）

- ✅ 链接来自"银行官网"

- ✅ 点击后跳转...到了钓鱼网站

用户被骗输入账号密码 → 攻击者窃取

关键：用户信任的是域名（trusted-bank.com），但重定向把他们送到了别处。

- SSO Token窃取

在OAuth单点登录流程中，授权码通过重定向URL传回。如果重定向URL可被篡改，攻击者可以截获授权码冒充用户登录。

这也是为什么Google、GitHub的OAuth都严格校验redirect_uri.

- 四级源码拆解

- Low级：零验证

if (array_key_exists("redirect", $_GET) && $_GET['redirect'] != "") {

header("location: " . $_GET['redirect']);   // ← 用户输入直接当跳转目标

exit;

}

漏洞：redirect参数没有任何校验，直接用作Location头。

正常：source/low.php?redirect=info.php?id=1     → 跳到名言页

攻击：source/low.php?redirect=https://baidu.com  → 跳到百度

- Medium级：检查了http://但能绕

if (preg_match("/http:\/\/|https:\/\//i", $_GET['redirect'])) {

// "Absolute URLs not allowed." → 拦截

} else {

header("location: " . $_GET['redirect']);   // 放行

}

改进：正则检查是否包含http://或https://，有就拒绝。

漏洞：正则太简单，只拦http://和https://。用协议相对URL绕过：

source/medium.php?redirect=//baidu.com

//baidu.com不含http://也不含https://，正则匹配不到 → 放行。但浏览器会自动补全当前协议（http://baidu.com），照样跳转到外部网站。

- High级：检查“包含”但不是"等于"

if (strpos($_GET['redirect'], "info.php") !== false) {

header("location: " . $_GET['redirect']);   // 包含 info.php 就放行

} else {

// "You can only redirect to the info page."

}

改进：要求redirect参数包含info.php

漏洞：strpos只检查"包含"，不检查"等于"。攻击者只要在恶意URL里塞个info.php就能绕过：

source/high.php?redirect=https://baidu.com?info.php

这个字符串包含info.php → strpos返回非false → 放行 → 浏览器跳到https://baidu.com?info,php →成功跳到百度。

- Impossible级：白名单映射

if (array_key_exists("redirect", $_GET) && is_numeric($_GET['redirect'])) {

switch (intval($_GET['redirect'])) {

case 1:

$target = "info.php?id=1";    // 固定目标

break;

case 2:

$target = "info.php?id=2";    // 固定目标

break;

case 99:

$target = "https://digi.ninja";  // 固定外部目标

break;

}

if ($target != "") {

header("location: " . $target);   // 只跳白名单里的目标

}

}

防御：

- 用户只能传数字（is_numeric），不能传URL

- 服务端用switch将数字映射到固定目标URL（白名单）

- 不直接用用户输入做重定向目标——用户传的是ID，不是URL

这就是正确的做法：用户永远不接触重定向目标本身，只传一个编号，服务端映射。

- 四级对照表

| 维度 | Low | Medium | High0 | Impossible |
|---|---|---|---|---|
| 验证方式 | 无 | 正则拦截http://\|https:// | strpos检查包含info.php | 白名单映射 |
| 绕过方式 | 直接传外部URL | //baidu.com（协议相对） | https://baidu.com?info.php | 无法绕过 |
| 根因 | 零验证 | 正则太简单 | "包含"≠"等于" | 用户不接触目标URL |
| 用户传什么 | 完整URL | 完整URL | 完整URL | 只传数字ID |

- 安全运营收获

- 代码审查重点

搜代码里所有header("location:或redirect的地方，逐一确认：

- 重定向目标是否来自用户输入？

- 如果是，是否做了白名单校验？

- 校验是"包含"还是"精确匹配"？（包含 = 可绕过）

- 日志检测规则

关注：重定向参数中包含外部域名

例如：redirect=https://evil.com  →  可疑！

例如：redirect=//evil.com        →  可疑！（协议相对 URL）

例如：redirect=https://evil.com?info.php  →  可疑！（绕过检查）

- 防御的正确姿势

| 错误做法 | 正确做法 |
|---|---|
| 直接用用户输入做重定向目标 | 白名单映射（用户传ID，服务器映射URL） |
| 正则拦截http:// | 白名单只允许已知目标 |
| strpos检查"包含" | 精准匹配或switch映射 |

- 实操任务

- Low级

DVWA 切到 Low，在浏览器地址栏访问：

http://localhost/dvwa/vulnerabilities/open_redirect/source/low.php?redirect=https://www.baidu.com

![](images/17-DVWA-Open-Redirect-开放重定向/17-DVWA-Open-Redirect-开放重定向_001.png)

结果：浏览器跳转到百度——成功把用户从DVWA（可信站点）重定向到了外部网站。

- Medium级

切到 Medium，先试直接 URL（会被拦），再用 // 绕过：

第 1 步：直接用外部 URL（会被拦）

http://localhost/dvwa/vulnerabilities/open_redirect/source/medium.php?redirect=https://www.baidu.com

![](images/17-DVWA-Open-Redirect-开放重定向/17-DVWA-Open-Redirect-开放重定向_002.png)

第 2 步：用 // 绕过 ⭐

http://localhost/dvwa/vulnerabilities/open_redirect/source/medium.php?redirect=//www.baidu.com

![](images/17-DVWA-Open-Redirect-开放重定向/17-DVWA-Open-Redirect-开放重定向_003.png)

🎉 两步完美验证了"拦截 → 绕过"：

| 步骤 | URL | 结果 | 原因 |
|---|---|---|---|
| 直接用 | redirect=https://www.baidu.com | ❌ 被拦 | 正则匹配到https:// |
| 绕过 | redirect=//www.baidu.com | ✅ 跳转 | //不含http://，正则匹配不到自动补全协议 |

核心教训：正则黑名单永远追不上攻击者的变体。拦截http:// → 用//绕；拦// → 用\\\绕......黑名单写不完。

- High级

切到 High，在恶意 URL 里塞 info.php 绕过：

http://localhost/dvwa/vulnerabilities/open_redirect/source/high.php?redirect=https://www.baidu.com?info.php

![](images/17-DVWA-Open-Redirect-开放重定向/17-DVWA-Open-Redirect-开放重定向_004.png)

结果：跳转到百度 ✅ — 因为 strpos 检查到字符串里有 info.php，放行了，但实际跳到的是https://www.baidu.com?info.php。

- 四级绕过手法

| 等级 | 防御方式 | 绕过手法 | 核心教训 |
|---|---|---|---|
| Low | 零验证 | 直接传外部URL | 用户输入不能直接当跳转目标 |
| Medium | 正则拦截http:// | //baidu.com（协议相对URL） | 正则黑名单追不上变体 |
| High | strpos检查包含info.php | baidu.com?info.php | "包含" ≠ "等于" |
| Impossible | 白名单映射 | 无法绕过 | 用户只传ID，服务端映射URL |

七、🎯 安全运营核心收获

开放重定向 = 钓鱼攻击的完美伪装。攻击者构造一个可信域名的链接，用户点击后被跳到恶意网站。作为安全运营要记住：

- 代码审查：搜所有header("location:的地方，确认重定向目标不是用户可控的

- 校验方式：白名单映射 > 精确匹配 > 正则黑名单 > 包含检查 > 无验证

- 日志检测：重定向参数里出现外部域名 = 可疑
