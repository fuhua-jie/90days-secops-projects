DVWA-Authorisation Bypass

- 定义

- Authorisation Bypass：认证绕过 / 授权绕过

- 这个模块在讲什么

- 页面是一个用户管理器，描述里写得明白：

"This page should only be accessible by the admin user. Your challenge is to gain access to the features using one of the other users, for example gordonb / abc123."

- 任务：

这个页面本该只要admin能用，挑战是用普通用户（gordonb/abc123）去用它的功能。

- 页面有两个后台API端点：

| 端点 | 作用 | 权限风险 |
|---|---|---|
| get_user_data.php | 返回所有用户列表（id、名字） | 谁都能看？ |
| change_user_details.php | 修改任意用户的资料 | 谁都能改？ |
| 前端authbypass.js通过fetch调用这两个端点，渲染用户表格，点击Update就能改资料。 | 前端authbypass.js通过fetch调用这两个端点，渲染用户表格，点击Update就能改资料。 | 前端authbypass.js通过fetch调用这两个端点，渲染用户表格，点击Update就能改资料。 |

- 核心问题：认证只保护了"门面"，没保护"API"

先看各级别主页面（index.php加载的source文件）：

- Low级：主页面什么都不检查

// low.php —— 什么都没有！

/*

Nothing to see here for this vulnerability, have a look

instead at the dvwaHtmlEcho function in dvwaPage.inc.php

*/

Low级的主页面只检查了authenticated（登录了就行），不检查是不是admin。任何登录用户都能直接访问这个页面，看到所有用户并修改任意人的资料。

漏洞根因：DVWA的菜单把Auth Bypass只显示给admin（if (dvwaCurrentUser() == "admin")），开发者可能认为"菜单只有admin能看到=页面只有admin能用"。但URL谁都能猜——直接访问/dvwa/vulnerabilities/authbypass/就进来了。

- Medium级：主页面加锁了，但API没加锁⭐

// medium.php —— 主页面检查 admin

if (dvwaCurrentUser() != "admin") {

print "Unauthorised";

http_response_code(403);

exit;

}

Medium级：主页面会返回403挡住非admin。看起来安全了？

但看get_user_data.php的权限检查条件：

// get_user_data.php

if ((dvwaSecurityLevelGet() == "high" || dvwaSecurityLevelGet() == "impossible")     && dvwaCurrentUser() != "admin") {

// 只有 high / impossible 才拦截，medium 不拦！

print json_encode (array ("result" => "fail", "error" => "Access denied"));

exit;

}

注意：high和impossible才拦截！Medium级不拦截！

也就是说：Medium级的主页面把攻击者挡在门外，但直接访问get_user_data.php这个API端点，照样能拿到所有用户数据——因为API端点的权限检查条件漏了Medium级。

这就是这个模块的灵魂：开发者只给主页面加了认证，忘了给API端点加。攻击者绕开页面，直接打API。

- High级：一个端点锁了，另一个还漏着⭐

// get_user_data.php 在 High 级会拦截非 admin 了

// 但 change_user_details.php 的检查条件是：

if (dvwaSecurityLevelGet() == "impossible" && dvwaCurrentUser() != "admin") {

// 只有 impossible 级才拦截！

}

High级：get_user_data.php（读数据）被保护了，但changer_user_detaails.php（改数据）只在impossible级才检查——High级下，你可以直接POST修改任意用户资料！

更严重的还有：这个模块的主页面medium.php/high.php都检查admin，但index.php在low/medium/high级都允许GET访问，而且get_user_data.php是GET请求、change_user_details.php是POST请求——权限检查的条件在各端点之间不一致，这就是漏洞缝隙。

- Impossible级：完整防护

// index.php：impossible 级改用 POST 提交（$method = 'POST'）

// get_user_data.php：high/impossible 都拦截非 admin

// change_user_details.php：impossible 拦截非 admin

Impossible级三个点全部检查admin：

- 主页面index.php检查admin

- get_user_data.php检查admin

- change_user_detaails.php检查admin

每层都有独立认证，没有一个端点漏网。

- 四级对照表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 主页面检查admin？ | ❌ | ✅403 | ✅403 | ✅403 |
| get_user_data.php检查admin？ | ❌ | ❌（条件漏了Medium） | ✅ | ✅ |
| change_user_details.php检查admin？ | ❌ | ❌ | ❌（条件漏了High） | ✅ |
| 能看所有用户？ | ✅ | ✅ | ❌ | ❌ |
| 能改任意用户？ | ✅ | ✅ | ✅ | ❌ |

漏洞演化很典型：

- Low：什么都没保护

- Medium：开发者想保护，但保护条件写错了（漏了medium分支）

- High：补上一个端点，但另一个端点又漏了（条件只认impossible）

- Impossible：三个点全保护，才真正安全

- 安全运营的核心收获

- 认证必须"每个端点独立"，不能只护住门面

这是最常见的开发错误：前端隐藏按钮/菜单 ≠ 后端权限控制。

| 错误做法 | 正确做法 |
|---|---|
| 菜单只对admin显示 | 后端API也要逐端点校验身份 |
| 页面403就以为安全了 | API端点（get/change）也要同样校验 |
| 前端JS里控制按钮显隐 | 服务端在每个handler里做授权检查 |

- 这类漏洞怎么检测（运营视角）

作为安全运营，在代码审查时重点找：

- 所有接收请求的端点（不只是页面，还有API）——逐一确认都有身份校验

- 权限检查条件是否有漏掉的等级/分支（向Medium漏了medium分支）

- 日志里：非admin用户访问admin端点的记录

- 总结

[URL能被猜到 = 任何人都能访问]。安全性不能建立在"别人不知道这个地址"上。必须建立在"服务端验证你是谁"上。

- 实操

核心实操：用gordonb（普通用户）登录，尝试访问admin功能。

- 准备工作

- 先退出admin登录

- 用gordonb / abc123登录

- Low级

- 直接访问：

http://localhost/dvwa/vulnerabilities/authbypass/

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_001.png)

结果：gordonb 也能看到完整的用户管理表格（所有用户都在列表里）——说明 low 级主页面没有身份检查。

- 随便改一个用户的名字试试：

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_002.png)

结果：会返回 "Save Successful"。

- Medium级

- 切到Medium，刷新页面：

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_003.png)

结果：主页面显示403 Unauthorised（因为 medium.php 检查 admin）。

- 但——直接访问数据API：

http://192.168.103.1/dvwa/vulnerabilities/authbypass/get_user_data.php

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_004.png)

结果：gordonb 也能拿到所有用户的 JSON 数据！因为 get_user_data.php 的检查条件漏了 medium 级。

- High级

- 切到High输入:

http://192.168.103.1/dvwa/vulnerabilities/authbypass/get_user_data.php

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_005.png)

结果：这次返回 {"result":"fail","error":"Access denied"}（High 级拦截了）。

- 但——直接POST修改用户资料（用await或curl）：

await fetch('/dvwa/vulnerabilities/authbypass/change_user_details.php', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({id: 1, first_name: 'hacked_by_gordonb', surname: 'pwned'})

}).then(r => r.json())

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_006.png)

- 结果：

返回了一个URL，并响应“Data too long for column ‘first_name’ at row 1”

- 这说明什么？

Data too long for column 'first_name' at row 1

这个报错说明：

✅ 请求到达了 change_user_details.php（没被身份检查拦住！）

✅ SQL 的 UPDATE 真的执行了（UPDATE users SET first_name='hacked_by_gordonb'...）

❌ 只是 hacked_by_gordonb 这个值太长（18 个字符），超过了 first_name 字段的长度限制（VARCHAR(15)）

gordonb 确实有权限改 admin 的资料——漏洞已坐实，只是数据长度撞了字段限制。

🎯 运营认知：这个报错还是信息泄露——它暴露了数据库字段名（first_name）和结构。攻击者能看到这种报错，说明 display_errors 开着、错误处理不规范。

3）修改一个短名字，输入真正的POST修改用户资料。

await fetch('/dvwa/vulnerabilities/authbypass/change_user_details.php', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({id: 1, first_name: 'h4ck', surname: 'pwn'})

}).then(r => r.json())

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_007.png)

结果：返回 {"result":"ok"}——gordonb 成功修改了 admin（id=1）的资料！因为 change_user_details.php 只在 impossible 级才检查。

- Impossible级（防御对照）

- 主页面

http://localhost/dvwa/vulnerabilities/authbypass/

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_008.png)

- 读数据API

http://localhost/dvwa/vulnerabilities/authbypass/get_user_data.php

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_009.png)

- 写数据API（关键对照！）

await fetch('/dvwa/vulnerabilities/authbypass/change_user_details.php', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({id: 2, first_name: 'test', surname: 'test'})

}).then(r => r.json())

![](images/16-DVWA-Auth-Bypass-认证绕过/16-DVWA-Auth-Bypass-认证绕过_010.png)

结果：返回 {"result":"fail","error":"Access denied"}——而 High 级同样代码返回的是 {"result":"ok"}。

- 对照表

| 测试 | High 级结果 | Impossible 级结果 |
|---|---|---|
| 主页面 | Unauthorised | Unauthorised |
| get_user_data | Access denied | Access denied |
| change_user_details | {"result":"ok"}（漏洞！） | {"result":"fail","error":"Access denied"} |

- 总结

1. 认证 vs 授权（两个不同概念）

- 认证（Authentication）：确认"你是谁"（登录）

- 授权（Authorisation）：确认"你能干什么"（权限）

- 这个模块的漏洞是授权问题：gordonb 认证成功了（登录了），但被错误地授予了 admin 的权限

2. 漏洞根因：API 端点认证缺失

- 开发者只保护了主页面（index.php → source 文件）

- 忘了保护 API 端点（get_user_data.php / change_user_details.php）

- 攻击者绕开页面，直接打 API

3. 开发者修 bug 的典型错误模式（安全运营会反复看到）

- Medium：权限检查条件漏了 medium 分支

- High：补上读数据，又漏了写数据

- 教训：权限检查条件要覆盖所有路径，且每个端点独立检查

安全运营的检查清单

| # | 检查项 |
|---|---|
| 1 | 应用里所有接受请求的端点（页面+API）是否都要授权检查？ |
| 2 | 授权检查条件是否覆盖了所有安全级别/分支？ |
| 3 | 是否存在"前端隐藏功能但后端无权限控制"？ |
| 4 | 日志里是否有低权限用户访问高权限端点的记录？ |
| 5 | HTTP状态码（403 vs 200）是否作为监控指标？ |

和 BAC 的联系

BAC：登录后 → 越权看别人的数据（水平越权）

Auth Bypass：用普通用户 → 直接用 admin 功能（垂直越权）

两者都是 OWASP A01:2021 Broken Access Control
