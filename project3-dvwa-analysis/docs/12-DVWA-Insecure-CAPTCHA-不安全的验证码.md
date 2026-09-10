DVWA-Insecure CAPTCHA

- 定义

Insecure CAPTCHA：不安全的验证码

这是一个修改密码页面。正常流程是：

输入新密码 → 通过CAPTCHA验证 → 确认密码 → 密码更新

CAPTCHA（验证码）的目的是确认操作者是真人，不是自动化脚本。但这个模块的四个级别展示了CAPTCHA验证可以被各种方式绕过。

- 四级源码对照（核心漏洞）

- Low级

两步验证，第二步无验证

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_001.png)

- 漏洞：Step 2安全没验证CAPTCHA。攻击者可以直接POST step=2&paaword_new=abc&password_conf=abc跳过验证码改密码

- 运营分析：

攻击者是怎么绕过low级的？

正常用户操作流程（会留下两条日志）：

请求①：POST step=1 + CAPTCHA验证码  →  服务端验证通过，返回 Step 2 表单

请求②：POST step=2 + 新密码          →  密码修改成功

攻击者绕过流程（只留一条日志）：

请求①：POST step=2 + 新密码          →  密码修改成功（根本没有走 step 1

| 日志特征 | 可能意味着 |
|---|---|
| 同一个IP只有step=2，没有step=1 | 有人在绕过CAPTCHA |
| 短时间内大量step=2请求 | 自动化脚本在批量改密码 |
| step=2 请求中的参数值异常（如SQL注入特征） | 攻击者在尝试注入 |

简单解释：正常用户一定会先走step1（过验证码），再走step2.如果日志里有人直接跳到step2，那就是在绕过验证码。

- Medium级

加了个客户端参数，但服务器信了客户端

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_002.png)

看着好像修了？但看Step1的表单：

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_003.png)

漏洞：passed_captcha是浏览器端（客户端）传过来的值，攻击者直接POST时带上passed_captcha=true就绕过了。服务器信任了客户端说【我通过验证码了】这句话——这是经典安全设计错误。

- High级

开发留了个后门

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_004.png)

漏洞：只要传g-recaptcha-response=hidd3n_valu3 + 改User-Agent为reCAPTCHA，就能直接绕过CAPTCHA。

更离谱的是，这个后门凭证就写在页面的HTML注释里（第75行）：

<!-- **DEV NOTE**   Response: 'hidd3n_valu3'   &&   User-Agent: 'reCAPTCHA'   **/DEV NOTE** -->

运营分析：

- 代码审查时发现硬编码的绕过逻辑 → 这是高危

- 生产环境HTML源码里出现开发注释泄露凭证 → 信息泄露

- 日志中出现User-Agent为reCAPTCHA的请求 → 可能有人再利用后门

- Impossible级

真正的防御

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_005.png)

三重防御：

| 防御 | 作用 |
|---|---|
| CAPTCHA真实验证 | 防自动化脚本 |
| 当前密码校验 | 防已登录会话被他人利用 |
| CSRF Token | 防跨站请求伪造 |
| PDO预处理 | 防SQL注入 |

- 四级防御演进对照表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| Step2有CAPTCHA? | ❌ 无 | ❌ 无(靠客户端参数) | ✅ 但被后门绕过 | ✅ 真正验证 |
| 绕过方式 | 直接POST step=2 | 加passed_captcha=true | 用hidd3n_valu3+改UA | 无法绕过 |
| CSRF防御 | ❌ 无 | ❌ 无 | ✅ Token | ✅ Token |
| 当前密码验证 | ❌ 无 | ❌ 无 | ❌ 无 | ✅ 需要 |
| SQL防御 | 字符串拼接 | 字符串拼接 | 字符串拼接 | ✅ PDO 预处理 |
| 核心问题 | 两步验证不完整 | 信任客户端参数 | 开发后门未删除 | 无 |

- 实操

- Low级：直接跳过Step1

用 curl 或浏览器 Console 直接发 Step 2 请求：

// 在页面 Console 执行

fetch('/dvwa/vulnerabilities/captcha/', {

method: 'POST',

credentials: 'include',

headers: {'Content-Type': 'application/x-www-form-urlencoded'},

body: 'step=2&password_new=test123&password_conf=test123&Change=Change'

}).then(r => r.text()).then(html => {

console.log(html.includes('Password Changed') ? '✅ 绕过了！' : '❌ 失败');

});

- Medium级：加passed_captcha参数

// 同上，多加一个参数

body: 'step=2&passed_captcha=true&password_new=test123&password_conf=test123&Change=Change'

3、High 级：用后门凭证

curl -X POST "http://192.168.103.1/dvwa/vulnerabilities/captcha/" \                 -b "PHPSESSID=s8lcrhe61vr5s2bse5dd0r77mp; security=high"  -d "password_new=test123&password_conf=test123&user_token=xxx&Change=Change" -H "User-Agent: reCAPTCHA"  -d "g-recaptcha-response=hidd3n_valu3"

需要先 GET 页面拿到 user_token（CSRF token），然后才能发 POST。这个和之前 Brute Force High 级的流程一样。

- 安全运营的收获

| 漏洞类型 | 学到了什么 | 怎么检测/防御 |
|---|---|---|
| 两步验证不完整 | 多步骤操作每一步都要验证权限 | 审计所有多步骤流程，确保每步都校验 |
| 信任客户端参数 | 永远不要相信客户端传的[我已通过验证]标记 | 服务端自行维护状态，不依赖客户端传参 |
| 开发后门未删除 | 调试代码/后门不能留在生产环境 | 代码审查+扫描硬编码凭证+敏感信息泄露检测 |
| HTML注释泄漏 | 开发注释可能泄漏敏感信息 | 生产环境压缩/混淆HTML，移除注释 |

- 与CSRF的对比

| 维度 | CSRF（跨站请求伪造） | CAPTCHA（验证码） |
|---|---|---|
| 防什么 | 防跨站请求——攻击者诱导受害者在你已登录状态下发请求 | 防自动化脚本——确认操作者是真人，不是机器 |
| 攻击者是谁 | 另一个网站的用户（受害者被诱导点击链接） | 跑脚本的机器/程序（直接 POST 请求） |
| 防御手段 | CSRF Token（服务端生成的随机 token，每次请求校验） | 验证码挑战（识别图片/勾选复选框） |
| 能不能被脚本绕过？ | ✅ 能——脚本可以先 GET 页面拿到 token，再 POST 带 token 的请求 | ❌ 不能——真正的 CAPTCHA 需要真人识别 |
| 能不能被 CSRF 绕过？ | — | ✅ 能——如果受害者亲自通过了 CAPTCHA，攻击者可以用 CSRF 利用这个"已通过"的状态 |

（1）关键认知：它们解决的是不同的问题

![](images/12-DVWA-Insecure-CAPTCHA-不安全的验证码/12-DVWA-Insecure-CAPTCHA-不安全的验证码_006.png)

（2）用一个场景理解

假设你是一个安全运营，要保护一个修改密码的接口：

| 攻击场景 | 只配 CSRF Token | 只配 CAPTCHA | 两个都配 |
|---|---|---|---|
| 攻击者写脚本批量改密码 | ❌ 脚本能 GET token 后 POST，防不住 | ✅ CAPTCHA 拦住脚本 | ✅ 安全 |
| 攻击者诱导你点链接改密码 | ✅ Token 校验不通过，防住了 | ❌ 你本人过了 CAPTCHA，链接利用你的会话，防不住 | ✅ 安全 |
| 攻击者同时用脚本+诱导 | ❌ | ❌ | ✅ 安全 |

一句话总结：CSRF Token 防的是跨站，CAPTCHA 防的是自动化。它们是正交的防御层，不是替代关系。这也就是为什么 Impossible 级两个都用了。
