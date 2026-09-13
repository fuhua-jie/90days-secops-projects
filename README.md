# 90 天安全运营工程师自学项目

> **SOC Analyst Portfolio** | 自学周期：2026年7月 - 2026年10月
> 目标岗位：安全运营工程师 / SOC 分析师 / 驻场安全工程师

🔗 **在线学习平台**：[点击访问](https://fuhua-jie.github.io/90days-secops-projects/secops-academy/index.html)（GitHub Pages）

---

## 🌐 SecOps Academy · 安全运营学习平台

我开发了一个完整的**离线安全运营学习网站**（纯 Vanilla JS 零依赖），作为 92 天学习路线的核心产出之一。

| 内容 | 数量 |
|------|------|
| 课程模块 | 10 个（入门 → 初级 → 中级 → 高级） |
| 互动课程 | 125 节（含课内小测 + XP 系统） |
| 实战游戏 | 9 个（CTF 排位 / SOC 值班室 / 护网模拟器 / 告警研判训练场 等） |
| 攻击剧本 | 61 个（云安全 / 供应链 / 域攻击 / 邮件 / 反取证） |
| 题库 | 300 题（21 分类 · 3 级难度 · 错题本） |
| 术语速查 | 264 条（10 分类 · 人话解释 · 场景例子） |
| 案例复盘 | 12 个（改编自公开重大安全事件） |
| 操作手册 | 6 本（应急响应 / 告警研判 / 护网加固 · 可打印） |
| 模拟面试 | 5 轮 21 题（含参考答案与自评清单） |

**技术特点**：纯 Vanilla HTML/CSS/JS · 零框架零依赖 · 离线可用 · 4 级难度系统 · 进度本地保存

📁 [查看网站源码](./secops-academy/)

---

## 项目一：基于 ELK 的 Web 日志分析与监控平台

**技术栈**：Elasticsearch | Logstash | Kibana | Docker Compose | Grok

- 使用 Docker Compose 独立部署 ELK 日志分析平台
- 配置 Logstash Grok 解析规则，实现 Apache/Nginx 日志结构化提取
- 创建 Kibana Dashboard：状态码分布、Top 10 IP、访问趋势
- 配置告警规则：404 异常检测、可疑 IP 高频访问

📁 [查看项目文件](./project1-elk)

---

## 项目二：AI 辅助的日志异常检测工具

**技术栈**：Python 3 | 正则表达式 | argparse | HTML/CSS | LLM 辅助工作流

- 独立设计自动化日志分析脚本，支持命令行参数与 JSON 配置
- 实现多维度异常检测：暴力破解、SQL 注入、高频访问
- 支持文本与 HTML 双格式报告输出
- 设计 AI 辅助分析工作流：脚本初筛 + AI 深度分析

📁 [查看项目文件](./project2-ai-log-analyzer)

---

## 项目三：DVWA 漏洞复现与安全运营防御分析

**技术栈**：Kali Linux | DVWA | Burp Suite | SQLMap

- 独立搭建 LAMP 环境并部署 DVWA 靶场
- 复现 SQL 注入、XSS、文件上传、命令注入、CSRF、暴力破解
- 从安全运营防守方视角整理攻击特征库
- 撰写完整漏洞防御方案与检测方法

📁 [查看项目文件](./project3-dvwa-analysis)

---

## 项目四：邮件头分析与钓鱼邮件研判

**技术栈**：邮件头解析 | SPF/DKIM/DMARC | 威胁情报

- 提取并解析真实可疑邮件完整原始邮件头
- 分析 Authentication-Results，判定发件域名身份认证状态
- 追踪 Received 链定位原始发件 IP 及发件主机
- 撰写安全研判报告，包含威胁评估与处置建议

📁 [查看项目文件](./project4-email-analysis)

---

## 技能清单

- **Linux 与日志分析**：grep/awk/sed/rsyslog/logrotate
- **网络协议**：TCP/IP、HTTP/HTTPS、Wireshark 抓包
- **Web 安全**：OWASP Top 10、SQL 注入、XSS、CSRF
- **SIEM**：ELK Stack 搭建、Grok 解析、Dashboard、告警规则
- **安全自动化**：Python 日志分析脚本、正则表达式
- **容器化**：Docker、Docker Compose
- **安全工具**：Nmap、Burp Suite、SQLMap
- **AI 辅助**：ChatGPT/Claude 辅助安全事件分析

---

## 联系方式

- 邮箱：1458082419@qq.com
- 求职意向：安全运营工程师 / SOC 分析师
