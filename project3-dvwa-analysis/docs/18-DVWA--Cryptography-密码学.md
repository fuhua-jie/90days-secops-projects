DVWA-Cryptography（密码学）

- 定义

核心主题：使用了加密算法≠安全。如果加密模式选错、密钥硬编码、Ⅵ固定或可控，加密形同虚设。

四级分别用四种不同的加密方式保护token/消息，你要逐级攻破：

| 等级 | 加密方式 | 核心缺陷 |
|---|---|---|
| Low | XOR（固定密钥） | XOR不是加密，是编码 |
| Medium | AES-128-ECB | 相同明文块→相同密文块，可拼接篡改 |
| High | AES-128-CBC（固定IV） | IV随密文发给客户端，可篡改IV篡改明文 |
| Impossible | AES-256-GCM | 认证加密，有完整性校验，无法篡改 |

- 三个密码学概念（安全运营必懂）

- 分组密码的工作模式

AES是分组密码——每次加密固定16字节的"块"。但消息可能超过16字节，怎么处理多块？这就是"工作模式"：

| 模式 | 怎么工作 | 问题 |
|---|---|---|
| ECB | 每块独立加密 | 相同明文块→相同密文块，可拼接篡改 |
| CBC | 每块XOR上一块密文再加密 | IV固定/可控时可篡改明文 |
| GCM | CBC+认证标签 | 有完整性校验，篡改会失败✅ |

- IV（初始向量）

CBC模式加密第一块时需要一个"初始值"和明文	XOR后再加密。这个初始值就是IV。

关键规则：IV必须是随机的、不可预测的，但不需要保密。如果IV固定或攻击者可控，CBC的安全性就崩了。

- 认证加密（AEAD）

GCM模式不仅加密数据，还会生成一个认证标签（tag）——类似HMAC，验证密文没有被篡改。篡改任何一个字节，tag校验就失败。

🎯安全运营一句话：加密只保证"别人看不懂"，认证加密才保证"别人看不懂+改不了"

- 四级拆解

- Low级：XOR加密（固定密钥）

- 源码

$key = "wachtwoord";   // 密钥写死在源码里

function xor_this($cleartext, $key) {

for($i=0; $i<strlen($cleartext);) {

for($j=0; ($j<strlen($key) && $i<strlen($cleartext)); $j++,$i++) {

$outText .= $cleartext[$i] ^ $key[$j];  // 逐字符 XOR

}

}

}

- 漏洞：

- XOR不是加密——它是一种编码运算，不是密码学算法

- 密钥硬编码在源码里（wachtwoord）

- 已知明文攻击：如果你知道任何一段明文，就能XOR出密钥

页面给了一个截获消息（Base64编码的XOR密文），解密并找到密码：

截获消息：Lg4WGlQZChhSFBYSEB8bBQtPGxdNQSwEHREOAQY=

密钥：wachtwoord

解密结果：Your new password is: Olifant

密码就是 Olifant。

- Medium级：AES-128-ECB（电子密码本模式）

- 源码

$key = "ik ben een aardbei";   // 16字节密钥，硬编码

$e = openssl_decrypt($ciphertext, 'aes-128-ecb', $key, OPENSSL_PKCS1_PADDING);

ECB 模式的致命缺陷：相同的 16 字节明文块永远加密成相同的 16 字节密文块。

页面给了 3 个 token（hex 格式）：

Sooty (admin, 过期)   → ...b85bb230876912bf3c66e50758b222d0...（admin 块）

Sweep (user, 过期)    → ...b85bb230876912bf3c66e50758b222d0...（相同块！）

Soo (user, 有效)      → ...174d4b2659239bbc50646e14a70becef...（不同块）

攻击思路：ECB下每个块独立加密，攻击者可以把admin token的level:"admin"块替换到Sweep的token里，造出一个"Sweep + admin"的伪造token。

这叫ECB块交换攻击。

- High级：AES-128-CBC（固定IV+IV可控）

- 源码

define("KEY", "rainbowclimbinghigh");

define("ALGO", "aes-128-cbc");

define("IV", "1234567812345678");    // 固定 IV！

function create_token() {

$token = "userid:2";            // 明文：userid:2（Bungle, user）

$e = encrypt($token, IV);

$data = array(

"token" => base64_encode($e),

"iv" => base64_encode(IV)    // IV 随 token 一起发给客户端！

);

return json_encode($data);

}

- 两个致命缺陷：

- IV固定（1234567812345678）——相同的明文永远产生相同的密文

- IV随密文一起发给客户端——check_token从用户提交的JSON里读IV！

用户列表：userid:1 =  Geoffery (admin)，userid:2 = Bungle (user)。

当前token解密后是userid:2，要把它改成userid:1。

- CBC IV翻转攻击：

CBC 解密：plaintext = AES_decrypt(ciphertext) XOR IV

明文第 9 个字符是 '2'（0x32），想改成 '1'（0x31）

↓

只需要改 IV 的第 9 个字符：

new_IV[8] = old_IV[8] XOR (0x32 XOR 0x31) = 0x31 XOR 0x03 = 0x32 = '2'

↓

原 IV: 12345678 1 2345678

新 IV: 12345678 2 2345678

↑ 只改了这一个字符

解密结果从userid:2变成userid:1 → Geoffery（admin）！

- Impossible级：AES-256-GCM（认证加密）

define("KEY", "rainbowclimbinghigh");

define("ALGO", "aes-256-gcm");     // GCM = 认证加密

function create_token() {

$token = "userid:2";

$iv = openssl_random_pseudo_bytes(12);  // 随机 IV，每次不同！

$e = encrypt($token, $iv);

// ...

}

function encrypt($plaintext, $iv) {

$e = openssl_encrypt($plaintext, ALGO, KEY, OPENSSL_RAW_DATA, $iv, $tag);

// 生成认证标签

return $e . $tag;   // 密文 + tag 一起返回

}

function decrypt($ciphertext, $iv) {

$tag = substr($ciphertext, -16);   // 取出 tag

$text = substr($ciphertext, 0, -16);  // 取出密文

$e = openssl_decrypt($text, ALGO, KEY, OPENSSL_RAW_DATA, $iv, $tag);  // 验证 tag

// 篡改任何一个字节 → tag 校验失败 → 抛异常

}

1）三处关键修复：

| 修复 | 说明 |
|---|---|
| AES-256-GCM | 认证加密，密文+完整性校验，篡改即失败 |
| 随机IV | openssl_random_pseudo_bytes(12)，每次不同 |
| 认证标签（tag） | 16字节tag附在密文末尾，验证密文完整性 |

- 安全运营的收获

- 代码审查Checklist

| # | 检查项 | 危险信号 |
|---|---|---|
| 1 | 用了什么加密算法？ | XOR=编码不是加密；DES=过时；RC4=已破 |
| 2 | AES用了什么模式？ | ECB=①不安全；CBC+固定IV=②不安全 |
| 3 | 密钥从哪来？ | 硬编码=可从源码提取 |
| 4 | IV怎么生成？ | 固定值=③不安全；mt_rand()=④不安全 |
| 5 | IV/密文发给客户端？ | 客户端可控+无认证=可篡改 |
| 6 | 有没有认证标签？ | 无tag=之加密不认证=可篡改 |

- 正确的加密姿势

密钥：服务端安全存储（环境变量/密钥管理服务），不硬编码

算法：AES-256-GCM（或 ChaCha20-Poly1305）

IV：每次随机生成（openssl_random_pseudo_bytes）

认证：必须用 AEAD 模式（GCM/CCM/Poly1305）

- 核心认知

| 常见误区 | 真相 |
|---|---|
| "我用了AES，很安全" | ECB模式的AES不安全 |
| "密文看不懂就行" | 攻击者不改密文，改IV就能改明文 |
| "加密=防篡改" | 加密只防偷看，认证才防篡改 |
| "XOR也是加密" | XOR是编码，不是加密 |

- 实操

- Low级：XOR编码（固定密钥）

DVWA 切到 Low，页面上有一个消息编解码器和一个登录框。

![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_001.png)
![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_002.png)

第 1 步：解密截获的消息

页面上有一段截获的密文：

Lg4WGlQZChhSFBYSEB8bBQtPGxdNQSwEHREOAQY=

在页面的消息框里粘贴这段密文，选择 Decode，点 Submit。

结果：显示解密后的明文 → "Your new password is: Olifant"

第 2 步：用密码登录

在页面下方的 Password 框里输入 Olifant，点 Login。

结果：
![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_003.png)

核心教训：XOR 是编码不是加密，密钥硬编码 = 源码泄露 = 加密失效。

- Medium级：AES-ECB块交换

这一级的密钥 "ik ben een aardbei" 硬编码在源码里——攻击者拿到源码就能伪造任意 token。

用密钥加密了一个 sweep + admin + 未过期 的伪造 token：

3061837c4f9debaf19d4539bfa0074c1174d4b2659239bbc50646e14a70becef837d1e6b16bfae07b776feb7afe57630f950edda1fda24d2f7ffdf17b0d4da31

验证：解密后 {"user":"sweep","ex":1823620672,"level":"admin","bio":"hacked"}，ex未过期 ✅

- 实操步骤：

在 Token 输入框里粘贴上面那串 hex

点 Submit

结果：
![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_004.png)

- 💡 安全运营视角——这一级展示了两个问题

- AES-ECB 模式本身不安全（相同明文块产生相同密文块，可做块交换攻击）；

- 密钥硬编码在源码里是致命的——攻击者拿到源码（比如通过 LFI/文件包含漏洞），就能伪造任意身份的 token。这也是为什么密钥必须放环境变量/密钥管理服务，不能写死在代码里。

- 安全运营要做的事情

| 需要做的 | 具体技能 |
|---|---|
| 代码审查发现硬编码密钥 | 搜代码里的密钥常量：define("KEY"、$key = 等 |
| 要求开发改 | 密钥放环境变量/密钥管理服务，不进代码仓库 |
| 理解加密模式的安全性 | ECB 不安全、CBC 固定 IV 不安全、GCM 安全 |
| 看到"我们用了 AES 所以很安全"要警惕 | 用了 AES 但模式错 = 不安全 |

不需要你自己写加密代码。就像你学 BAC 时不需要自己写越权攻击脚本，但你需要知道"Cookie 可被篡改 = 身份验证不可靠"。

- High级：CBC IV翻转攻击

DVWA 切到 High，页面会显示一个 token（JSON 格式，包含 token 和 iv）。

- 攻击原理：

CBC 解密：plaintext = AES_decrypt(ciphertext) XOR IV

明文 userid:2 → 想要 userid:1

↑           ↑

只改第8个字符     只改IV第8个字符

'2'(0x32)→'1'(0x31)

↑

IV[7]: '8'(0x38) → ';'(0x3B)

（0x38 XOR (0x32 XOR 0x31) = 0x38 XOR 0x03 = 0x3B）

只改 IV 的一个字符，密文不动，解密结果就从 userid:2 变成 userid:1（admin）！

- 在浏览器Console执行这个脚本：

let tokenJson = JSON.parse(document.getElementById('token').value);

let ivStr = atob(tokenJson.iv);

// 翻转 IV[7]：'8'(0x38) XOR 0x03 = ';'(0x3B)

ivStr = ivStr.substring(0, 7) + String.fromCharCode(ivStr.charCodeAt(7) ^ 0x03) + ivStr.substring(8);

tokenJson.iv = btoa(ivStr);

document.getElementById('token').value = JSON.stringify(tokenJson);

console.log("原 IV: 1234567812345678");

console.log("新 IV: " + ivStr);

console.log("攻击 token 已填入，现在点击 Submit");

然后点页面的 Submit 按钮。

结果：

![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_005.png)

![](images/18-DVWA--Cryptography-密码学/18-DVWA--Cryptography-密码学_006.png)

- 总结

| 等级 | 加密方式 | 攻击方式 | 核心教训 |
|---|---|---|---|
| Low | XOR（固定加密） | 解密截获消息→拿到密码 | XOR是编码不是加密 |
| Medium | AES-128-ECB | 密钥硬编码→伪造任意token | 密钥不能写死在源码里 |
| High | AES-128-CBC | IV翻转→userid:2变userid:1 | IV随密文给客户端=可篡改明文 |
| Impossible | AES-256-GCM | 无法攻击 | 认证加密+随机IV=安全 |

- 安全运营核心收获

| 代码审查时看到 | 危险等级 | 正确做法 |
|---|---|---|
| XOR 用作加密 | 🔴 极危 | 用 AES |
| define("KEY", "硬编码字符串") | 🔴 极危 | 密钥放环境变量/密钥管理服务 |
| aes-128-ecb | 🟠 高危 | 用 GCM 模式 |
| aes-128-cbc + 固定 IV | 🟠 高危 | IV 每次随机生成 |
| IV/密文发给客户端、无认证 | 🟡 中危 | 用 GCM（有 tag 验证完整性） |
| aes-256-gcm + openssl_random_pseudo_bytes | 🟢 安全 | 这就对了 |

一句话：加密 ≠ 安全。用了 AES 但模式错（ECB）、或 IV 固定/可控、或密钥硬编码，加密形同虚设。只有 AES-GCM + 随机 IV + 密钥安全存储，才是真正的密码学安全。
