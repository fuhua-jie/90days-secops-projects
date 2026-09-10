DVWA-Weak Session IDs（弱会话ID）

- 定义

Session ID（会话ID）是服务器在用户登录后分配的唯一标识符，通过 Cookie 发送给浏览器。后续每次请求，浏览器都会带上这个 Cookie，服务器据此识别用户身份。

"弱"会话ID是指可预测的会话ID——攻击者可以猜测、推算或暴力枚举出其他用户的会话ID，从而冒充该用户（会话劫持）。

一个安全的会话ID必须满足：足够长、完全随机（不可预测）、使用 CSPRNG（密码学安全随机数生成器）生成。

核心认知：会话ID 就是用户的"通行证"，谁能猜到别人的 ID，谁就能冒充别人。

- 四级源码分析

- Low级：递增整数

$_SESSION['last_session_id']++;

$cookie_value = $_SESSION['last_session_id'];

setcookie("dvwaSession", $cookie_value);

// setcookie 只传了 name 和 value，没有设置 HttpOnly、Secure、Path、expires

- 漏洞分析：

- 会话ID是递增整数（1, 2, 3...），完全可预测

- 攻击者从 1 开始递增尝试，就能劫持其他用户的会话

- Cookie 没有设置 HttpOnly（JS 可读取）和 Secure（HTTP 明文传输）

- 实操：

点击 Generate 按钮，在浏览器存储（Storage）→ Cookie 中观察：

第1次点击：dvwaSession=1

第2次点击：dvwaSession=2

第3次点击：dvwaSession=3

// Cookie 属性：HttpOnly=false, Secure=false

攻击者只需从 1 开始递增尝试，就能劫持其他用户的会话。

- Medium级：时间戳

$cookie_value = time();

setcookie("dvwaSession", $cookie_value);

// time() 返回当前 Unix 时间戳（秒），仍然是可预测的

- 漏洞分析：

- 会话ID是当前时间戳，攻击者知道大概时间就可以推算

- 时间戳精度只到秒，同一秒内生成的 ID 相同

- 仍然没有设置 HttpOnly 和 Secure

- 实操：

点击 Generate 按钮，用 Kali 验证时间戳：

# Kali 终端

date +%s    # 获取当前时间戳

# 对比 Cookie 中的 dvwaSession 值

// 实测结果：dvwaSession=1787489050，Kali date +%s=1787489077，差 27 秒（时间戳确认）

时间戳看似"随机"，实际完全可推算——攻击者只要知道大致时间窗口就能暴力枚举。

- High级：MD5哈希

$_SESSION['last_session_id_high']++;

$cookie_value = md5($_SESSION['last_session_id_high']);

setcookie("dvwaSession", $cookie_value, time()+3600, "/vulnerabilities/weak_id/", $_SERVER['HTTP_HOST'], false, false);

// setcookie 参数：name, value, expires(1小时), path, domain, secure=false, httponly=false

1）改进：

- 用了 md5() 哈希，看起来像随机字符串

- 设置了 expires（1小时后过期）、path、domain

- 但 Secure=false、HttpOnly=false

2）漏洞分析：

哈希 ≠ 随机！md5(递增整数) 的输入仍然可预测。

3）攻击者验证方法：

# 假设你点击了 4 次，last_session_id_high = 4

echo -n 4 | md5sum

# 输出：a87ff679a2f3e71d9181a67b7542122c

# 对比 Cookie 中的 dvwaSession，完全匹配！

// 实测结果：点击 4 次后 dvwaSession=a87ff679a2f3e71d9181a67b7542122c，和 echo -n 4 | md5sum 完全一致

md5 只是把可预测的输入"包装"成看起来随机的样子，输入不变，输出就不变。攻击者只要知道点击次数就能算出会话ID。

- Impossible级：CSPRNG

$cookie_value = bin2hex(random_bytes(20));

setcookie("dvwaSession", $cookie_value, time()+3600, "/vulnerabilities/weak_id/", $_SERVER['HTTP_HOST'], true, true);

// setcookie 参数：name, value, expires(1小时), path, domain, secure=true, httponly=true

1）防御分析：

- random_bytes(20) 使用 CSPRNG（密码学安全随机数生成器）生成 20 字节随机数

- bin2hex() 转成 40 位十六进制字符串

- Secure=true：只通过 HTTPS 传输 Cookie

- HttpOnly=true：JavaScript 无法读取 Cookie（防 XSS 窃取）

2）实操：

点击 Generate 按钮，观察 Cookie：

第1次：dvwaSession=39b5ef56ade4976474bdb892669d48c378712b9c

第2次：dvwaSession=2cbbdd871d75f14766910898716f61faa45a52eb

// 每次都是完全不同的 40 位随机字符串，HttpOnly=true, Secure=true

random_bytes() 是 PHP 的密码学安全随机函数，底层调用操作系统的 /dev/urandom（Linux）或 CryptGenRandom（Windows），生成的随机数不可预测。

- 四级递进全景对比表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 生成方式 | 递增整数 | 时间戳 time() | md5(递增整数) | random_bytes(20) |
| 可预测？ | 完全可预测 | 可推算 | 可反推 | 不可预测 |
| HttpOnly | false | false | false | true |
| Secure | false | false | false | true |
| expires | 无 | 无 | 1小时 | 1小时 |
| Path | 无 | 无 | 有 | 有 |
| 随机源 | 无 | 系统时间 | 哈希函数 | CSPRNG |
| 安全等级 | 极低 | 低 | 中 | 高 |

- 安全运营的收获

- Cookie 安全属性检查清单

作为安全运营，检查应用的 Cookie 是否设置了以下属性：

- HttpOnly：防止 JavaScript 读取 Cookie（防 XSS 窃取）

- Secure：只通过 HTTPS 传输 Cookie（防中间人窃听）

- Path：限制 Cookie 的作用路径

- SameSite：防止 CSRF（跨站请求伪造）

- expires/max-age：设置合理的过期时间

缺少 HttpOnly + Secure 的 Cookie = 高危

- "哈希 ≠ 随机" 的认知

这是安全运营必须理解的概念：

// md5(1) = c4ca4238a0b923820dcc509a6f75849b（固定值）

// md5(2) = c81e728d9d4c2f636f067f89cc14862c（固定值）

哈希函数是确定性的——相同输入永远产生相同输出。只要攻击者知道输入（递增整数、时间戳），就能算出输出（"随机"的会话ID）。真正的随机必须使用 CSPRNG。

- 会话劫持检测（日志层面）

作为安全运营，在日志中关注以下异常：

- 同一会话ID从不同IP地址访问（会话被劫持）

- 短时间内大量不同的会话ID来自同一IP（枚举攻击）

- 会话ID呈现递增或时间戳模式（弱ID特征）

检测规则：如果 Cookie 值是纯数字（1,2,3...）或时间戳格式，说明应用使用了弱会话ID生成方式。

- Cookie 属性验证命令

# 用 curl 检查响应头的 Set-Cookie

curl -v http://目标地址/ 2>&1 | grep -i "set-cookie"

# 检查是否包含 HttpOnly 和 Secure 标记

- 总结

一句话总结：安全的会话ID = CSPRNG生成 + HttpOnly + Secure + 合理过期时间。可预测的ID（递增、时间戳、md5(递增)）都能被攻击者推算出来，哈希 ≠ 随机。
