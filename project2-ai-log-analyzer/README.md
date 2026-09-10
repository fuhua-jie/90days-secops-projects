# 项目二：AI 辅助的日志异常检测工具（LogSentinel）

> 状态：开发中（五层流水线：解析 → 特征 → 规则 → AI 研判 → 报告）

## 规划文件
- parser.py（正则解析 Apache 日志）
- features.py（滑动时间窗口频率统计）
- rules.py（5 条检测规则：SQLi/爆破/扫描/XSS/WebShell）
- ai_judge.py（GLM 大模型结构化研判，环境变量管理 Key）
- report.py（终端 + HTML 双格式报告）
- 评估：混淆矩阵（检测率 / 误报率）

完成后本目录将包含全部源码与实测数据。
