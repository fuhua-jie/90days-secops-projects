# 项目一：基于 ELK 的 Web 日志分析与监控平台

> 状态：搭建中（Docker Compose 部署 ELK 8.11）

## 规划文件
- docker-compose.yml（ES / Kibana / Logstash 三件套）
- logstash/pipeline/logstash.conf（Grok 解析 Apache 日志）
- gen_attack.py（混合攻击流量生成器）
- 可视化：状态码分布 / IP Top10 / 访问趋势 Dashboard
- 告警：404 突增检测（基线阈值法）、可疑 IP 高频访问

完成后本目录将包含全部配置文件与截图。
