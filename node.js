/**
 * UniLauncher Backend - 重制版启动核心
 * 需要安装依赖: npm install express cors axios
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 模拟 PCL2 的游戏路径管理
const GAME_DIR = path.join(process.env.APPDATA || process.env.HOME, '.unilauncher');

// 确保目录存在
if (!fs.existsSync(GAME_DIR)) {
    fs.mkdirSync(GAME_DIR, { recursive: true });
}

/**
 * 启动游戏接口
 * 此接口通过子进程拉起 Minecraft
 */
app.post('/launch', async (req, res) => {
    const { version, username, javaPath } = req.body;

    console.log(`[Launch] 收到启动请求: ${version} 用户: ${username}`);

    // 这里是模拟的启动参数。
    // 在真实场景中，我们需要解析 versions/${version}/${version}.json 
    // 来动态生成 classpath 和所有依赖项。
    const args = [
        "-Xmx2G",
        "-XX:+UseG1GC",
        "-Djava.library.path=" + path.join(GAME_DIR, "natives"),
        "-cp", path.join(GAME_DIR, `versions/${version}/${version}.jar`),
        "net.minecraft.client.main.Main",
        "--username", username,
        "--version", version,
        "--gameDir", GAME_DIR,
        "--assetsDir", path.join(GAME_DIR, "assets"),
        "--assetIndex", version,
        "--uuid", "0",
        "--accessToken", "0",
        "--userType", "legacy"
    ];

    try {
        // 实际上你会在这里检查 Java 是否存在
        const child = spawn(javaPath || 'java', args, {
            cwd: GAME_DIR,
            detached: true,
            stdio: 'inherit'
        });

        child.on('error', (err) => {
            console.error("启动失败:", err);
        });

        res.json({ success: true, message: "进程已创建" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 获取下载源 API (中转 BMCLAPI)
 */
app.get('/versions', async (req, res) => {
    try {
        const response = await axios.get('https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json');
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: "无法连接到下载源" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 UniLauncher Backend 运行在端口: ${PORT}`);
    console.log(`📂 游戏根目录: ${GAME_DIR}`);
    console.log(`-----------------------------------------`);
});
