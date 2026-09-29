#!/usr/bin/env bash
#
# gen-auth.sh —— 生成 SSH 认证日志测试样本
# 场景：模拟工单 INC-20260926-002「异常登录行为」
#
# 用法：
#   bash gen-auth.sh                     # 写入默认路径
#   LOG=/tmp/auth.log bash gen-auth.sh   # 写到别处
#
# 设计要点（见 README「踩过的坑」）：
#   1. 时间按「北京时间」描述，输出为 UTC —— 用 *不依赖时区库* 的数值偏移换算
#   2. 时间戳格式与真实 OpenSSH 日志一致（RFC3339 + 6 位微秒 + 显式时区）
#   3. 生成前先自检时区换算，**换算异常直接退出**（不让错误数据静默产生）
#   4. 一轮 SSH 尝试 = 一个源端口（Failed / Disconnected 共用同一个 port）
#   5. 最后按时间排序 —— RFC3339 的字典序等于时间序
#
set -euo pipefail

LOG="${LOG:-/home/hua/elk/logs/auth/auth.log}"
HOST="soc"
DAY="2026-09-27"          # 场景日期（下面所有时刻都按「北京时间」理解）

# ═══════════════ 工具函数 ═══════════════

# 「北京时间字符串」→ epoch 秒
# 注意：不使用 TZ=Asia/Shanghai —— 时区库不可用时会【静默回退到 UTC】
sec_bj() { date -u -d "$1 +0800" +%s; }

# 更好的随机数：$RANDOM 只有 15 位，两个拼起来才够 6 位数用
rand() { printf '%d' $(( (RANDOM * 32768 + RANDOM) % $1 )); }

# 6 位微秒（不用 %6N —— 部分 date 实现不支持宽度修饰符）
usec() { printf '%06d' "$(rand 1000000)"; }

# epoch 秒 → RFC3339 时间戳（UTC 视角，末尾硬编码 +00:00）
ts() { printf '%s.%s+00:00' "$(date -u -d "@$1" +'%Y-%m-%dT%H:%M:%S')" "$(usec)"; }

# 追加一条 sshd 日志行：emit <epoch秒> <pid> <消息> [程序名，默认 sshd-session]
#   程序名 sshd         = 主监听进程（Server listening / 退出）
#   程序名 sshd-session = 每条连接派生的会话进程（登录成功/失败都走它）
emit() { printf '%s %s %s[%s]: %s\n' "$(ts "$1")" "$HOST" "${4:-sshd-session}" "$2" "$3" >>"$LOG"; }

# 随机 pid / 端口
rpid()  { printf '%d' $(( 1000 + $(rand 40000) )); }
rport() { printf '%d' $(( 30000 + $(rand 35000) )); }

# ═══════════════ 开始生成 ═══════════════

# 自检：北京时间 12:00 必须换算成 UTC 04:00，否则时间会整体偏 8 小时
if [ "$(date -u -d "2026-01-01 12:00:00 +0800" +%H)" != "04" ]; then
  echo "❌ 时区换算异常，终止生成"; exit 1
fi

rm -f "$LOG"
echo "[*] 目标文件：$LOG"

# ─────── ③ 耐心型爆破：198.51.100.99，凌晨 02:10 起，每 40 秒 1 次，共 15 次 ───────
T0=$(sec_bj "$DAY 02:10:00")
USERS=(oracle postgres test)
for i in $(seq 0 14); do
  t=$(( T0 + i * 40 ))
  p=$(rpid); port=$(rport)
  u=${USERS[$(( i % 3 ))]}
  emit "$t" "$p" "Invalid user $u from 198.51.100.99 port $port"
  emit "$t" "$p" "Failed password for invalid user $u from 198.51.100.99 port $port ssh2"
  emit "$t" "$p" "Disconnected from invalid user $u 198.51.100.99 port $port [preauth]"
done

# ─────── ④ 唯一一次成功：203.0.113.150，凌晨 03:17（非工作时间）───────
T0=$(sec_bj "$DAY 03:17:00")
p=$(rpid); port=$(rport)
emit "$T0"             "$p" "Accepted password for hua from 203.0.113.150 port $port ssh2"
emit "$(( T0 + 1 ))"   "$p" "pam_unix(sshd:session): session opened for user hua(uid=1000) by hua(uid=0)"
emit "$(( T0 + 420 ))" "$p" "pam_unix(sshd:session): session closed for user hua"

# ─────── 服务启动日志（增加真实感）—— 注意：这两条是「主进程」写的 ───────
p=$(rpid)
emit "$(sec_bj "$DAY 08:00:00")" "$p" "Server listening on 0.0.0.0 port 22." sshd
emit "$(sec_bj "$DAY 08:00:00")" "$p" "Server listening on :: port 22."      sshd

# ─────── ① 正常流量：hua 白天多次登录 ───────
for h in 09 10 11 14 16 19 21; do
  t=$(( $(sec_bj "$DAY 00:00:00") + 10#$h * 3600 + $(rand 900) ))
  p=$(rpid); port=$(rport)
  emit "$t"             "$p" "Accepted password for hua from 192.168.103.1 port $port ssh2"
  emit "$(( t + 1 ))"   "$p" "pam_unix(sshd:session): session opened for user hua(uid=1000) by hua(uid=0)"
  emit "$(( t + 1200 + $(rand 3600) ))" "$p" "pam_unix(sshd:session): session closed for user hua"
done

# ─────── ② 急躁型爆破：203.0.113.88，白天 11:42，150 轮 ───────
T0=$(sec_bj "$DAY 11:42:00")
for i in $(seq 0 149); do
  t=$(( T0 + i / 6 ))            # 150 轮摊在约 25 秒内
  p=$(rpid); port=$(rport)       # ★ 一轮 = 一个端口
  if [ $(( i % 2 )) -eq 0 ]; then
    emit "$t" "$p" "Failed password for root from 203.0.113.88 port $port ssh2"
    emit "$t" "$p" "Disconnected from authenticating user root 203.0.113.88 port $port [preauth]"
  else
    emit "$t" "$p" "Invalid user admin from 203.0.113.88 port $port"
    emit "$t" "$p" "Failed password for invalid user admin from 203.0.113.88 port $port ssh2"
    emit "$t" "$p" "Disconnected from invalid user admin 203.0.113.88 port $port [preauth]"
  fi
done

# ═══════════════ 收尾：按时间排序 ═══════════════
# RFC3339 的优点：字典序 == 时间序，所以直接 sort 即可（LC_ALL=C 保证按字节比较）
LC_ALL=C sort -o "$LOG" "$LOG"

echo "[+] 完成：$(wc -l <"$LOG") 行"
