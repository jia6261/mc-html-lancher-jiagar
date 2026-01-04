name: UniLauncher CI/CD

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

# 设置权限以允许 GitHub Actions 部署到 GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  # 任务 1：测试后端启动逻辑
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'

    - name: Initialize Environment
      run: |
        # 如果不存在 package.json，则创建一个基础版防止 npm install 报错
        if [ ! -f package.json ]; then
          echo '{"name":"unilauncher-backend","version":"1.0.0","dependencies":{"express":"^4.18.2","cors":"^2.8.5","axios":"^1.4.0"}}' > package.json
        fi
        
    - name: Install dependencies
      run: npm install
      
    - name: Run Test Launch
      run: |
        # 启动后端并置于后台，记录日志
        node server.js > server.log 2>&1 & 
        
        # 优化：循环检查端口是否就绪 (最多等待 30 秒)
        echo "等待后端服务就绪..."
        for i in {1..30}; do
          if curl -s http://localhost:3000/versions > /dev/null; then
            echo "服务已启动!"
            break
          fi
          if [ $i -eq 30 ]; then
            echo "错误: 服务启动超时"
            cat server.log
            exit 1
          fi
          sleep 1
        done

        # 执行启动指令测试
        curl -X POST http://localhost:3000/launch \
          -H "Content-Type: application/json" \
          -d '{"version": "1.20.1", "username": "CI_Tester"}'
      env:
        GITHUB_ACTIONS: true
        GAME_DIR: ./test_mc_dir

  # 任务 2：部署前端到 GitHub Pages
  deploy-frontend:
    needs: test-backend # 只有后端测试通过后才执行部署
    if: github.ref == 'refs/heads/main' # 仅在推送到 main 分支时触发
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Pages
      uses: actions/configure-pages@v3

    - name: Upload artifact
      uses: actions/upload-pages-artifact@v2
      with:
        # 确保你的 HTML 文件（如 index.html）在此路径下
        path: '.'

    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v2

