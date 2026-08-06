# 90days-secops-projects
90天安全运营工程师自学项目 | SOC Analyst Portfolio
# 90天安全运营工程师自学项目

&gt; 自学周期：2026年7月 - 2026年10月  
&gt; 目标岗位：安全运营工程师 / SOC分析师 / 驻场安全工程师

---

## 项目一：基于ELK的Web日志分析与监控平台

**技术栈**：Elasticsearch | Logstash | Kibana | Docker Compose | Grok

- 使用 Docker Compose 独立部署 ELK 日志分析平台
- 配置 Logstash Grok 解析规则，实现 Apache/Nginx 日志结构化提取
- 创建 Kibana Dashboard：状态码分布、Top 10 IP、访问趋势
- 配置告警规则：404异常检测、可疑IP高频访问

📁 [查看项目文件](./project1-elk)

---

## 项目二：AI辅助的日志异常检测工具

**技术栈**：Python 3 | 正则表达式 | argparse | HTML/CSS | LLM辅助工作流

- 独立设计自动化日志分析脚本，支持命令行参数与JSON配置
- 实现多维度异常检测：暴力破解、SQL注入、高频访问
- 支持文本与HTML双格式报告输出
- 设计AI辅助分析工作流：脚本初筛 + AI深度分析

📁 [查看项目文件](./project2-ai-log-analyzer)

---

## 项目三：DVWA漏洞复现与安全运营防御分析

**技术栈**：Kali Linux | DVWA | Burp Suite | SQLMap

- 独立搭建LAMP环境并部署DVWA靶场
- 复现SQL注入、XSS、文件上传、命令注入、CSRF、暴力破解
- 从安全运营防守方视角整理攻击特征库
- 撰写完整漏洞防御方案与检测方法

📁 [查看项目文件](./project3-dvwa-analysis)

---

## 项目四：邮件头分析与钓鱼邮件研判

**技术栈**：邮件头解析 | SPF/DKIM/DMARC | 威胁情报

- 提取并解析真实可疑邮件完整原始邮件头
- 分析Authentication-Results，判定发件域名身份认证状态
- 追踪Received链定位原始发件IP及发件主机
- 撰写安全研判报告，包含威胁评估与处置建议

📁 [查看项目文件](./project4-email-analysis)

---

## 技能清单

- **Linux与日志分析**：grep/awk/sed/rsyslog/logrotate
- **网络协议**：TCP/IP、HTTP/HTTPS、Wireshark抓包
- **Web安全**：OWASP Top 10、SQL注入、XSS、CSRF
- **SIEM**：ELK Stack搭建、Grok解析、Dashboard、告警规则
- **安全自动化**：Python日志分析脚本、正则表达式
- **容器化**：Docker、Docker Compose
- **安全工具**：Nmap、Burp Suite、SQLMap
- **AI辅助**：ChatGPT/Claude辅助安全事件分析

---

## 联系方式

- 邮箱：1458082419@qq.com
- 求职意向：安全运营工程师 / SOC分析师
