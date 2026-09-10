DVWA-JavaScript Attacks（JavaScript 攻击）

- 定义

- 核心主题：客户端校验不可信。

这个模块的流程：页面让你提交单词"success"来过关。但表单里有个隐藏的token，是浏览器的JavaScript算好再提交的。服务端会校验phrase和token是否匹配。

- 漏洞本质：校验逻辑（token算法）写死在客户端JS里，攻击者打开源码就能看到算法，自己算出token，直接构造请求。

- 一句话解释：只要安全决策发生在客户端，就一定能被绕过。这就是为什么这个模块没有Impossible级——index.php里写的很直白：

"You can never trust anything that comes from the user or prevent them from messing with it and so there is no impossible level." （你永远不能信任来自用户的任何东西，也无法阻止他们篡改，所以不存在不可能的等级。）

- 四级核心：

token算法在客户端vs校验在服务端

先看服务端校验逻辑（index.php第40-62行）：

![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_001.png)

再看客户端怎么生成token：

| 等级 | 客户端JS生成token的方式 | 服务端校验的token |
|---|---|---|
| Low | md5(rot13(phrase)) | md5(rot13("success")) |
| Medium | strrev("XX" + phrase + "XX") | strrev("XXsuccessXX") |
| High | 混淆JS，实际是双重sha256 | sha256(sha256("XX"+"sseccus")+"ZZ") |

关键发现：客户端算法和服务端校验用的是同一逻辑**！ **也就是说，JS源码把答案写在了题目旁边。攻击者随便都能算出来。

- 三个等级的手工解题

- Low级

- 客户端在页面加载时执行generate_token()：

var phrase = document.getElementById("phrase").value;  // 初始值 "ChangeMe"

document.getElementById("token").value = md5(rot13(phrase));

- 坑：generate_token()只在页面加载时跑一次。你把输入框改成success时，token不会自动重算——所以直接提交会得到Incalid token。

- 攻击者解法——自己算：

rot13("success") = "fhpprff"

md5("fhpprff") = 38581812b435834ebf84ebcc2c6424d6

所以直接POST：

phrase=success&token=38581812b435834ebf84ebcc2c6424d6

或者在浏览器Console直接调用页面的函数：

// 算 token（页面已加载 md5 和 rot13 函数）

document.getElementById("token").value = md5(rot13("success"));

document.getElementById("phrase").value = "success";

// 然后点 Submit

- Medium级

- 客户端medium.js：

![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_002.png)

- 攻击者解法：

strrev("XXsuccessXX") = "XXsseccusXX"

POST:

phrase=success&token=XXsseccusXX

- High级

客户端high.js说混淆过的（一万多字节），但DVWA贴心地在source/目录放了high_unobfuscated,js（未混淆版）——这本身就是个教学点：混淆不是加密，只是增加阅读难度，更记者花时间总能解开。

实际算法：

strrev("success") = "sseccus"

sha256("XX" + "sseccus") = sha256("XXsseccus") = 7f1bfaaf829f785ba5801d5bf68c1ecaf95ce04545462c8b8f311dfc9014068a

再拼 "ZZ" 再 sha256：

sha256("7f1bfaaf...4068a" + "ZZ") = ec7ef8687050b6fe803867ea696734c67b541dfafb286a0b1239f42ac5b0aa84

POST：

phrase=success&token=ec7ef8687050b6fe803867ea696734c67b541dfafb286a0b1239f42ac5b0aa84

- 安全运营视角学习

- 发现这类漏洞（代码审查时）

看到以下特征就警惕：

| 危险信号 | 例子 |
|---|---|
| 客户端JS里藏校验逻辑 | if (password == "secret") |
| 隐藏字段做"安全"标记 | <input type="hidden" value="true"> |
| token/签名在客户端生成 | token = md5(phrase) |
| 混淆JS传递"安全性" | 写满混淆代码的main.js |
| 前端限制输入范围 | <select>下拉、maxlength、disabled按钮 |

核心判断标准：安全决策是否依赖客户端？如果是→一定可以绕过。前端限制只能当UX（用户体验优化），不能当安全边界。

- 防御的正确姿势

| 错误（本模块） | 正确 |
|---|---|
| 校验逻辑写在JS里 | 校验逻辑只放服务端 |
| 客户端算token | 服务端生成并校验token/签名（如CSRF token） |
| 前端限制就算安全 | 前端限制只是体验；服务端必须重新校验一切 |
| 混淆JS防破解 | 混淆只是拖延，真正的安全不依赖代码保密 |

- 检测这类攻击（日子层面）

作为运营，在日志里看什么：

- 异常成功的请求：正常用户提交的phrase可能五花八门，但攻击者一定会提交success——如果短时间内大量phrase=success请求，可能是自动化利用

- token值异常：正常token由页面JS生成，攻击者手算的token也一样——所以光看token看不出差异，要靠WAF/风控结合其他特征（频率、来源、行为）

- 对客户端校验的依赖本身就是漏洞：等攻击者绕过后在检测是被动的；主动的做法是代码审查时消灭客户端安全决策
![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_003.png)

- 实操

- Low级

- 浏览器Console法：

// 页面加载后执行（DVWA 切到 low）

document.getElementById("phrase").value = "success";

document.getElementById("token").value = md5(rot13("success"));

// 然后手动点 Submit 按钮

- 在Console里把token填回表单，然后点Submit：

// 1. 把 phrase 改成 success

document.getElementById("phrase").value = "success";

// 2. 把你算出的 token 填进隐藏字段

document.getElementById("token").value = "38581812b435834ebf84ebcc2c6424d6";

- Medium级：

在 Console 执行：

document.getElementById("phrase").value = "success";

document.getElementById("token").value = "XXsseccusXX";

![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_004.png)

点Submit：

![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_005.png)

- High级：

这一级的 JS 是混淆过的（high.js 一万多字节，所有变量都是单字母），但算法拆开：

1. strrev("success")            = "sseccus"

2. "XX" + "sseccus"             = "XXsseccus"

3. sha256("XXsseccus")          = 7f1bfaaf829f785ba5801d5bf68c1ecaf95ce04545462c8b8f311dfc9014068a

4. 上一步结果 + "ZZ"            = "7f1bfaaf...4068aZZ"     ⬆填写这个

5. sha256(第4步)                = ec7ef8687050b6fe803867ea696734c67b541dfafb286a0b1239f42ac5b0aa84

1）直接用算好的值：

document.getElementById("phrase").value = "success";

document.getElementById("token").value = "7f1bfaaf829f785ba5801d5bf68c1ecaf95ce04545462c8b8f311dfc9014068a";

![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_006.png)
![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_007.png)

2）也可以用Kali的Python自己算，加深理解：

import hashlib

# Low

print(hashlib.md5(b"fhpprff").hexdigest())

# High

h1 = hashlib.sha256(b"XXsseccus").hexdigest()

print(hashlib.sha256((h1 + "ZZ").encode()).hexdigest())

- 直接fetch POST，绕过页面JS（推荐）

这才是真实攻击者的做法——根本不碰页面 JS，直接构造请求发最终值：

fetch("/dvwa/vulnerabilities/javascript/", {

method: "POST",

credentials: "include",

headers: {"Content-Type": "application/x-www-form-urlencoded"},

body: "phrase=success&token=ec7ef8687050b6fe803867ea696734c67b541dfafb286a0b1239f42ac5b0aa84&send=Submit"

}).then(r => r.text()).then(t => console.log(t.includes("Well done") ? "✅ 成功！" : t.match(/<p[^>]*>(.*?)<\/p>/g)));

学习意义：在 Low/Medium 用"改表单值"过关，其实还在页面 JS 的规则里玩；方法 B 是直接脱离页面，用最终 token 构造请求——这才是安全运营需要理解的：攻击者根本不关心你的 JS 写了什么，只关心服务端校验什么。

结果：
![](images/13-DVWA-JavaScript-Attacks-JavaScript-攻击/13-DVWA-JavaScript-Attacks-JavaScript-攻击_008.png)

- 总结

回顾学过的所有 DVWA 模块，会发现一条主线：

| 模块 | 共同点 |
|---|---|
| SQL Injection | 服务端没做输入校验 |
| Brute Force | 服务端没做频率限制 |
| Weak Session IDs | 服务端生成了可预测的ID |
| Insecure CAPTCHA | 服务端信任了客户端传来的“已通过”标记 |
| JavaScript Attacks | 服务端把校验逻辑交给了客户端 |

所有这些漏洞的根源只有一个：服务端没有承担起它该承担的安全责任。作为安全运营，审查代码时只需问一句："这个安全判断发生在哪一端？"——只要答案里有“客户端”，它就有问题。
