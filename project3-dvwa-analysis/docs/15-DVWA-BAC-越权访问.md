DVWA-BAC学习

- DVWA-BAC模块设计分析

- 模块概述

BAC（Broken Access Control，越权访问）模块模拟了一个"用户资料查看"系统。页面有一个输入框，输入user_id就能查看对应用户的资料（姓名、头像）。页面还展示了访问日志（Access Log），记录了所有访问尝试。

这是 OWASP Top 10 2021的第1名漏洞。

- 四级分析

- Low级：几乎无访问控制

- 源码做了输入验证（preg_match确保是数字），但访问控制形同虚设

- 关键点：检查的是Cookie里的user_id,而不是服务端session里的用户身份

- 漏洞：Cookie可被用户任意篡改！改user_id Cookie为别人的ID，就能看见别人的资料

- 这是经典的IDOR（Insecure Direct Object Reference，不安全的直接对象引用）

- 注释里直接提示了：<!-- Hint: Cookies can be modified by users... -->

- 还有个user_role Cookie也可被篡改（第89-95行）

- Medium级：token检查可被绕过

- 访问控制改成检查$_GET['token'] == 'user_token'

- 漏洞1：token是硬编码的user_token，源码注释里直接写了答案

- 漏洞2：token只检查"有没有"，不检查"谁的"——拿到token就能看任意用户

- 漏洞3：SQL注入仍然存在（$id 直接拼到查询里，没有预处理）

- 这说明：加了一个"门"（token），但门钥匙人人一样，等于没门

- High级：用Session但有会话固定风险

- 改用$_SESSION['user_id']（服务端session）而非Cookie

- 用了预处理语句（prepared statement）防SQL注入

- 用了htmlspecialchars防XSS

- 漏洞：$_SESSION['user_id']在第一次访问时被设置为当前用户ID（第107-109行），但如果攻击者能操控session（会话固定攻击），仍可能绕过

- 另外，权限检查只验证$id == $session_id（只能看自己的），没有admin角色的越权管理功能（所以High级实际上是"只允许看自己"的正确实现，注释提到"vulnerable to session fixation"但这个绕过难度较高）

- Impossible级：多层防御

- 输入验证：preg_match确保数字

- 预处理语句：所以SQL查询都用prepared statement

- 真正的访问控制：$current_user_id === $id （只能看自己的）

- 速率限制：5分钟内超过10次请求就被限流

- 安全日志：记录所有访问尝试（成功/失败./不存在用户）

- 异常检测：1小时内5次未授权访问就触发suspicious_activity告警

- 输出编码：htmlspecialchars防XSS

这对安全运营来说特别有价值——Impossible级展示的就是一个完整的访问控制+安全监控体系。

- 重点：

什么是越权访问（水平越权 vs 垂直越权）

IDOR 是什么

Cookie/Token/Session 三种身份验证方式的安全性差异

安全运营怎么检测越权（日志、异常检测）

Impossible 级的安全监控体系

- 关键概念

- 水平越权：同级别用户之间互相看数据（A用户看B用户的资料）

- 垂直越权：低权限用户访问高权限功能（普通用户访问admin）

- IDOR：通过修改URL参数中的对象ID（如user_id）来访问不属于自己

- Broken Access Control（越权访问）正式学习

- 先搞懂两个核心概念

- 什么是越权访问

正常流程：你登录后，查看自己的资料（user_id=1）

→ 服务器确认"你是 user_id=1" → 给你看

越权攻击：你登录后，把 user_id 改成 2

→ 如果服务器没验证"你是不是 user_id=2" → 你看到了别人的资料

越权分两种：

| 类型 | 含义 | 例子 |
|---|---|---|
| 水平越权 | 同级别用户之间互相看数据 | 普通用户A查看普通用户B的订单 |
| 垂直越权 | 低权限用户访问高权限功能 | 普通用户访问admin后台 |

🎯作为安全运营：越权是代码审计和渗透测试中最常发现的漏洞。

- IDOR（不安全的直接对象引用）

这个模块的核心漏洞类型叫IDOR：UPL里的user_id=1直接对应数据库里的用户，改个数字就能访问别人的数据。

- 四级源码对照

- Low级：用Cookie做身份验证 → 可被篡改

// 检查 Cookie 里的 user_id

if (isset($_COOKIE['user_id'])) {

$cookie_id = intval($_COOKIE['user_id']);

if ($id == $cookie_id) {   // ← 信任 Cookie！

// 放行，显示用户资料

}

}

漏洞：Cookie存在用户浏览器里，用户可以随便改。把user_id Cookie改成别人的ID，就能通过检查。

// user_role 也来自 Cookie，可篡改

$role = isset($_COOKIE['user_role']) ? $_COOKIE['user_role'] : 'regular_user';

源码注释直接提示了：<!-- Hint: Cookies can be modified by users... -->

- Medium 级：加了 token，但 token 写死且人人一样

if (isset($_GET['token']) && $_GET['token'] == 'user_token') {

// 放行，显示任意 user_id 的资料

}

漏洞：

- token是硬编码的user_token,源码注释里直接写了：<!-- Try using token=user_token -->

- token只检查"有没有正确的钥匙"，不检查"这把钥匙是谁的"——拿到token就能看所有人

- High 级：改用 Session + 预处理语句

// 身份来自服务端 Session，不在 Cookie，也不在 URL

if (isset($_SESSION['user_id'])) {

$session_id = intval($_SESSION['user_id']);

if ($id == $session_id) {   // 必须 URL 的 user_id == Session 里的真实身份

// 放行

} else {

$html .= "<p>Access denied. You can only view your own profile.</p>";

}}

改进：

- $_SESSION存在服务端，用户改不了  身份验证靠谱了

- 用了预处理语句（prepared statement） SQL注入堵住了

- 用了htmlspecialchars  XSS堵住了

- 只能看自己的资料（$id == $session_id）

剩余风险：注释提到"vulnerable to session fixation"——如果攻击者能操纵 session（比如通过会话固定攻击），理论上还能绕过。但这个难度已经很高了。

- Impossible 级：完整的安全监控体系 ⭐

这是安全运营最该研究的部分—它不只修了漏洞，还建了一套检测+告警+限流体系：

// 1. 输入验证

if (!preg_match('/^\d+$/', $_GET['user_id'])) { /* 拒绝非数字 */ }

// 2. 预处理语句（防 SQL 注入）

$stmt = mysqli_prepare(...);

// 3. 真正的访问控制：只能看自己

if ($current_user_id === $id) { $can_access = true; }

// 4. 速率限制：5 分钟内超过 10 次请求就限流

if (isRateLimitExceeded($current_user_id)) { /* 拦截 */ }

// 5. 安全日志：记录每次访问（成功/失败/不存在用户）

logAccessAttempt($current_user_id, $id, 'view_profile_success');

// 6. 异常检测：1 小时内 5 次未授权访问 → 触发告警

checkForSuspiciousActivity($current_user_id, $id);

// → logSecurityEvent('suspicious_activity', ...)

// 7. 输出编码防 XSS

htmlspecialchars($row['first_name'], ENT_QUOTES, 'UTF-8');

- 四级防御演进对照表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 身份验证来源 | Cookie（可篡改） | token（硬编码） | Session（服务端） | Session（服务端） |
| 能看别人资料? | ✅改Cookie即可 | ✅加token=user_token | ❌只能看自己 | ❌只能看自己 |
| SQL注入 | ❌字符串拼接 | ❌字符串拼接 | ✅预处理 | ✅预处理 |
| XSS防御 | ❌无 | ❌无 | ✅htmlspecialchars | ✅ htmlspecialchars |
| 速率限制 | ❌ | ❌ | ❌ | ✅5分钟10次 |
| 安全日志 | 只记录访问 | 只记录访问 | 只记录访问 | ✅成功/失败/异常 |
| 异常检测 | ❌ | ❌ | ❌ | ✅1小时5次未授权告警 |

- 安全运营的收获

- 身份验证的三个层次（越来越安全）

| 层次 | 存在哪 | 能被篡改？ | 安全性 |
|---|---|---|---|
| Cookie | 用户浏览器 | ✅随便改 | ❌不能做安全决策 |
| Token | URL参数 | ✅可截获/硬编码 | ⚠️必须绑定用户身份 |
| Session | 服务端 | ❌用户改不了 | ✅正确做法 |

核心认知：安全决策必须基于服务端数据（Session），不能基于客户端可控数据（Cookie/URL参数）。这和CSP模块学的"客户端不可信"是同一个道理。

- Impossible级的安全监控蓝图

这个模块的 Impossible 级展示了一套完整的安全运营监控体系，可以直接参考：

访问请求进来

↓

输入验证（是不是合法格式？）

↓

身份获取（从 Session 拿当前用户）

↓

速率限制检查（5分钟内请求超过10次？→ 拦截）

↓

权限检查（当前用户能访问目标资源吗？）

├── 能 → 放行 + 记录成功日志

└── 不能 → 拒绝 + 记录未授权日志

↓

异常检测（1小时内5次未授权？→ 触发 suspicious_activity 告警）

🎯 这就是你以后做安全运营时的检测规则原型：不光要拦攻击，还要记录、统计、告警。

- 越权检测：你在日志里看什么

页面下方的Access Log表就是检测面板：

| 日志特征 | 可能意味着 |
|---|---|
| 同一个user_id短时间内访问大量不同target_id | 可能在枚举所有用户资料 |
| 出现unauthorized_access记录 | 有人尝试越权 |
| 1小时内5次unauthorized_access | 触发suspicious_activity告警 |
| 出现non_existent_user_access | 有人探测不存在的用户ID（信息收集） |

- 实操

- Low级：篡改Cookie越权

- 先在 F12 → Storage → Cookie 里手动添加一个 user_id=1 的 Cookie

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_001.png)

- 先用默认 user_id=1点View Profile

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_002.png)

- 该输入框为user_id=2点View Profile

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_003.png)

- 篡改Cookie：F12  存储（Storage） Cookie  找到user_id  把值改为2

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_004.png)

- 再用user_id=2点View Profile

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_005.png)

- Medium级：加token绕过

- 用user_id=2点View Profile

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_006.png)

- 在URL后面加&token=user_token,变成：

/dvwa/vulnerabilities/bac/?action=View+Profile&user_id=2&token=user_token

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_007.png)

- High级：尝试越权

- 用 user_id=2 点 View Profile

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_008.png)

- 试试改 Cookie、加 token——都不管用了（因为用的是 Session）

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_009.png)

- 这一级用正常手段越不了权，理解原理即可

- Inpossible级：测试

1）Access Log 表：把你 Low/Medium 越权时留下的记录翻出来看——每一行都记着谁（Accessor）、访问了谁（Target）、IP、时间

（1）页面为什么不显示 Access Log？—— 一个变量覆盖 bug

看 index.php 和 low.php 的执行顺序：

// index.php 第 47-81 行：先生成 Access Log 的 HTML

$html .= "<div class='log-container'>...Access Log 表格...</div>"; // $html 里有日志表

// index.php 第 101 行：加载 low.php

require_once "...low.php";

// 但 low.php 第 14 行：把 $html 直接重置了！

$html = "";   // ← 覆盖！Access Log 表被清空

low.php 用 $html = ""（赋值）而不是 $html .= ""（追加），把 index.php 辛辛苦苦生成的 Access Log 表清空了。所以页面只显示 low.php 的内容，日志表消失了。这是 DVWA 这个模块的 bug。

（2）数据是完整的！在数据库里查到了越权记录

这正是安全运营的核心价值——界面看不到的，数据库里有！ 直接查 bac_log 表，27 条记录全在：

id  user_id  target_id  ip      action     timestamp

17  1       2         127.0.0.1 (null)     21:38:50  ← 越权访问 target_id=2

16  1       2         127.0.0.1 (null)     21:37:07  ← 越权访问

15  1       2         127.0.0.1 (null)     21:36:21  ← 越权访问

14  1       2         127.0.0.1 (null)     21:35:45  ← 越权访问

...

8   1       0         127.0.0.1 (null)     21:17:46  ← 探测过不存在的用户 (target=0)

（3）🎯 安全运营视角：这份日志说明了什么

| 日志证据 | 攻击者行为 | 运营判断 |
|---|---|---|
| user_id=1 多次访问 target_id=2 | 水平越权尝试（看别人的资料） | 🚨 越权行为 |
| target_id=0（不存在用户） | 枚举/探测用户 ID | 🚨 信息收集 |
| 短时间多次记录 | 自动化/手动枚举 | 🚨 可疑活动 |
| 大量 view_profile_success（21:43 连续 9 条） | 可能是在 Impossible 级测试速率限制 | 正常测试痕迹 |

这就是做安全运营时的样子：攻击者的每一步（越权、探测、枚举）都会留下日志。你要做的就是从日志里还原攻击者的行为链，判断是否有人正在攻击。

2）速率限制：试着快速连续点 10 次 View Profile，看会不会被 "Too many requests" 拦截

![](images/15-DVWA-BAC-越权访问/15-DVWA-BAC-越权访问_010.png)
