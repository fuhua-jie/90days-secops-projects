# Kibana 告警规则说明

> 配套项目：[基于 ELK 的日志安全分析与告警平台](../README.md)
> 环境：Kibana 8.11 · Stack Management → Alerts and Actions

---

## 规则一：大量 404 请求检测

| 项 | 配置 |
|---|---|
| **规则名称** | `大量404请求检测` |
| **规则类型** | Elasticsearch query |
| **数据视图 / 索引** | `weblogs-*` |
| **查询（KQL）** | `http.response.status_code: 404` |
| **阈值** | `> 100` |
| **时间窗口** | 5 分钟 |
| **检查频率** | 每 1 分钟 |
| **动作** | Index connector → `alerts-weblogs` |
| **Role visibility** | Stack Rules |

**设计意图**：Web 目录扫描的典型特征就是短时间内产生大量 404。

**触发验证**：用脚本生成 8 轮 × 30 路径的扫描流量后，规则在下一轮检查周期内触发。

---

## 规则二：畸形 User-Agent 检测

| 项 | 配置 |
|---|---|
| **规则名称** | `畸形UA检测` |
| **规则类型** | Elasticsearch query |
| **数据视图 / 索引** | `weblogs-*` |
| **查询（KQL）** | `user_agent.original.keyword: User-Agent*` |
| **阈值** | `> 0` |
| **时间窗口** | 5 分钟 |
| **检查频率** | 每 1 分钟 |
| **动作** | Index connector → `alerts-weblogs` |
| **Role visibility** | Stack Rules |

**设计意图**：真实日志里存在字面量为 `User-Agent\t…` 的畸形 UA（**71 处**）。
这种字段是**工具直接拼接请求头导致的**，**正常客户端绝不会产生** ——
因此这是一条**零误报的高置信度特征规则**，不需要依赖阈值。

---

## ⚠️ 配置时踩过的坑

| # | 坑 | 现象 | 解决 |
|---|---|---|---|
| 1 | **缺少加密密钥** | 创建 Connector 时 API 返回 **500**，UI 提示 "You must configure an encryption key to use Alerting" | 在 compose 的 kibana 服务加 `XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY`，然后 **`docker compose up -d kibana`** —— **只 `restart` 不会重载环境变量** |
| 2 | **规则 ID 必须是 UUID** | 用自定义 ID 创建规则报错 `Predefined IDs are not allowed for saved objects with encrypted attributes unless the ID is a UUID` | 交给 Kibana 自动生成 ID，或用标准 UUID |
| 3 | **Index Connector 不会自动加 `@timestamp`** | 告警文档写入后 ES 报 `No mapping found for [@timestamp] in order to sort on` | 在 Index connector 的文档模板里**显式添加 `@timestamp` 字段** |
| 4 | **Connector 变量语法** | 写成 `{{context.rule.name}}` 得到空字符串 | 官方语法是 `{{rule.id}}` / `{{rule.name}}` / `{{alert.id}}` / `{{context.message}}` |
| 5 | **告警长期不恢复** | 每次检查都命中旧数据 | 开启 `excludeHitsFromPreviousRun`（排除上一轮已统计的命中） |

---

## ⚠️ 阈值型规则的原理性盲区

**这是本项目最重要的认知之一。**

```
当前规则：404 响应 > 100 次 / 5 分钟

┌────────────────────────────┬──────────────────┐
│ 攻击方式                    │ 能否触发规则      │
├────────────────────────────┼──────────────────┤
│ 18 秒内 280 次（突发尖峰）   │ ✅ 能触发         │
│ 5 小时内 280 次（low-and-slow）│ ❌ 完全不触发  │
└────────────────────────────┴──────────────────┘
```

**根因**：阈值型规则统计的是「**次数**」—— **而"次数"永远和速率绑定，慢下来就能躲过。**

### 改进方向：换成「与速率无关的特征」

| 特征 | 为什么有效 |
|---|---|
| **路径种类数（去重）** | 5 分钟内请求了 **30 个不同路径** —— 不管多慢，这个特征都在 |
| **高置信度路径命中** | 命中 `.env` / `.git/config` / `wp-login.php` 等，**命中即是攻击，不需要阈值** |
| **响应码条件组合** | 全是 `404` = 未成功（低优先级）；出现 `200` + 敏感路径 = **可能已得手**（高优先级）|

> 🎯 **一句话**：
> **别只数"多少次"，要数"多少种"。**

---

## 相关分析报告

- [INC-20260925-001 大量 404 请求分析](../reports/INC-20260925-001-大量404请求.md)
