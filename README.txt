摄影作品在线投票网站
====================

【这是什么】
一个公网可访问的在线投票网站，51 件作品，每人限投 2 票，
同一作品限 1 票，票数实时刷新。

【怎么部署上线】
详细图文步骤见：手机下载目录里的《投票网站-手机部署教程.txt》
简述：
1. 把这些文件上传到 GitHub 仓库（Public）
2. 用 GitHub 登录 vercel.com，Import 该仓库，Deploy
3. 在 Vercel 的 Storage 里创建 Upstash Redis（免费）并连接项目
4. 重新部署，得到公网网址，完事

【文件说明】
index.html            前端页面（投票界面）
works.json            51 个作品的 序号-名称 对应表
api/vote.js           投票后端接口（Serverless Function）
package.json          项目配置
vercel.json           部署配置
images/1.jpg ~ 51.jpg 作品图片，共 51 张

【想改规则】
· 每人票数：改 index.html 里的 MAX_TICKETS = 2
· 作品名称：改 works.json 里对应 id 的 name

【本地预览（可选）】
本项目设计为部署在 Vercel，本地node环境执行 vercel dev 可预览。
