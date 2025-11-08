// 游戏核心变量
let canvas, ctx;
let gameState = 'start'; // start, playing, gameOver
let score = 0;
let frames = 0;
let edgeAssistEnabled = true; // 空气边缘辅助开关状态
let currentDifficulty = 'normal'; // 当前难度
let currentUser = null;
let levelLoaded = false;

// 难度设置
const difficultySettings = {
    easy: {
        gravity: 0.3,
        obstacleFrequency: 130,
        name: "简单"
    },
    normal: {
        gravity: 0.3,
        obstacleFrequency: 125,
        name: "普通"
    },
    hard: {
        gravity: 0.4,
        obstacleFrequency: 115,
        name: "困难"
    }
};

// 最高分记录
let highScores = {
    easy: 0,
    normal: 0,
    hard: 0
};

// 游戏元素 - 修改小鸟尺寸为500x412，按比例缩小显示
let bird = {
    x: 50,
    y: 150,
    originalWidth: 500,    // 原始图片宽度
    originalHeight: 412,   // 原始图片高度
    displayWidth: 50,      // 显示宽度（按比例缩小）
    displayHeight: 41,     // 显示高度（按比例缩小）
    gravity: difficultySettings.normal.gravity,
    velocity: 0,
    jump: -6,              // 稍微增加跳跃力度以适应更大的小鸟
    rotation: 0
};

let obstacles = [];

// 默认皮肤URL - 您可以在这里替换为您自己的图片URL
const defaultSkinURLs = {
    bird: [
        { name: "夜翼", url: "http://47.117.158.197:1445/s/0g8owq" },
        { name: "红头罩", url: "http://47.117.158.197:1445/s/enahkt" },
        { name: "红罗宾", url: "http://47.117.158.197:1445/s/qcqitp" },
        { name: "罗宾", url: "http://47.117.158.197:1445/s/z7y2u9" },
        { name: "蝙蝠", url: "http://47.117.158.197:1445/s/8vp2jx" },
        { name: "超人", url: "http://47.117.158.197:1445/s/et4t1m" }
    ],
    obstacle: [
        { name: "高楼", url: "http://47.117.158.197:1445/s/wqi1nq" },
        { name: "蝙蝠的目光", url: "http://47.117.158.197:1445/s/nprzqj" },
        { name: "虎视眈眈的达米安", url: "http://47.117.158.197:1445/s/gw12mb" }
    ]
};

// 当前使用的皮肤
let currentSkins = {
    bird: null,
    background: null,
    obstacle: null
};

// 存储原始图片数据（用于即时切换边框）
let originalImages = {
    bird: [],
    obstacle: []
};

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 加载保存的数据
    loadGameData();

    // 创建默认皮肤
    createDefaultSkins();

    // 设置事件监听器
    setupEventListeners();

    // Handle window resizing
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 初始化UI
    updateUI();

    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 创建默认皮肤
function createDefaultSkins() {
    // 创建默认背景（上灰下蓝渐变）
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 360;
    bgCanvas.height = 640;
    const bgCtx = bgCanvas.getContext('2d', { willReadFrequently: false });

    // 绘制渐变背景 - 上灰下蓝
    const gradient = bgCtx.createLinearGradient(0, 0, 0, 640);
    gradient.addColorStop(0, '#4a5568');  // 灰色
    gradient.addColorStop(0.5, '#2d3748'); // 深灰色
    gradient.addColorStop(1, '#1a365d');   // 深蓝色
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, 360, 640);

    // 添加星星
    bgCtx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 360;
        const y = Math.random() * 640;
        const size = Math.random() * 2;
        bgCtx.beginPath();
        bgCtx.arc(x, y, size, 0, Math.PI * 2);
        bgCtx.fill();
    }

    currentSkins.background = bgCanvas;

    // 创建皮肤选择界面
    createSkinSelection();

    // 默认选择第一个皮肤
    selectSkin('bird', 0);
    selectSkin('obstacle', 0);
}

// 创建皮肤选择界面
function createSkinSelection() {
    const birdGrid = document.getElementById('birdGrid');
    const obstacleGrid = document.getElementById('obstacleGrid');

    // 创建小鸟皮肤选项
    defaultSkinURLs.bird.forEach((skin, index) => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        item.dataset.type = 'bird';
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = skin.url;
        img.alt = skin.name;

        const name = document.createElement('div');
        name.className = 'skin-name';
        name.textContent = skin.name;

        item.appendChild(img);
        item.appendChild(name);
        item.addEventListener('click', () => selectSkin('bird', index));

        birdGrid.appendChild(item);
    });

    // 创建障碍物皮肤选项
    defaultSkinURLs.obstacle.forEach((skin, index) => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        item.dataset.type = 'obstacle';
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = skin.url;
        img.alt = skin.name;

        const name = document.createElement('div');
        name.className = 'skin-name';
        name.textContent = skin.name;

        item.appendChild(img);
        item.appendChild(name);
        item.addEventListener('click', () => selectSkin('obstacle', index));

        obstacleGrid.appendChild(item);
    });
}

// 选择皮肤
function selectSkin(type, index) {
    const skin = defaultSkinURLs[type][index];

    if (skin.url) {
        // 使用提供的URL
        const img = new Image();
        img.crossOrigin = "Anonymous"; // 处理跨域图片
        img.onload = function () {
            // 保存原始图片数据
            originalImages[type][index] = img;

            // 创建带边框的canvas
            applyEdgeAssistToSkin(type, index);

            // 更新选中状态
            document.querySelectorAll(`.skin-item[data-type="${type}"]`).forEach(item => {
                item.style.background = '#222';
            });
            const selectedItem = document.querySelector(`.skin-item[data-type="${type}"][data-index="${index}"]`);
            if (selectedItem) {
                selectedItem.style.background = '#334';
            }
        };
        img.onerror = function () {
            console.error(`Failed to load image: ${skin.url}`);
            // 如果图片加载失败，使用默认颜色方块
            createFallbackSkin(type, index);

            // 更新选中状态即使失败
            document.querySelectorAll(`.skin-item[data-type="${type}"]`).forEach(item => {
                item.style.background = '#222';
            });
            const selectedItem = document.querySelector(`.skin-item[data-type="${type}"][data-index="${index}"]`);
            if (selectedItem) {
                selectedItem.style.background = '#334';
            }
        };
        img.src = skin.url;
    }
}

// 应用边缘辅助到皮肤
function applyEdgeAssistToSkin(type, index) {
    if (!originalImages[type] || !originalImages[type][index]) return;

    const img = originalImages[type][index];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (type === 'bird') {
        // 使用小鸟的显示尺寸
        canvas.width = bird.displayWidth;
        canvas.height = bird.displayHeight;

        // 根据空气边缘辅助开关状态绘制边框
        if (edgeAssistEnabled) {
            // 先绘制图片
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 然后绘制白色边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        } else {
            // 直接绘制图片（无边框）
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    } else if (type === 'obstacle') {
        canvas.width = 60;
        canvas.height = 400;

        // 根据空气边缘辅助开关状态绘制边框
        if (edgeAssistEnabled) {
            // 先绘制图片
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 然后绘制白色边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        } else {
            // 直接绘制图片（无边框）
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    currentSkins[type] = canvas;
}

// 创建备用皮肤（当图片加载失败时使用）
function createFallbackSkin(type, index) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (type === 'bird') {
        // 使用小鸟的显示尺寸
        canvas.width = bird.displayWidth;
        canvas.height = bird.displayHeight;

        // 绘制彩色方块作为备用
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 根据空气边缘辅助开关状态绘制边框
        if (edgeAssistEnabled) {
            // 绘制白色边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        }
    } else if (type === 'obstacle') {
        canvas.width = 60;
        canvas.height = 400;

        // 绘制彩色方块作为备用
        const colors = ['#333333', '#666666', '#999999'];
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 根据空气边缘辅助开关状态绘制边框
        if (edgeAssistEnabled) {
            // 绘制白色边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        }
    }

    currentSkins[type] = canvas;
}

// 切换空气边缘辅助
function toggleEdgeAssist() {
    edgeAssistEnabled = !edgeAssistEnabled;

    // 立即重新应用当前选中的皮肤
    // 找到所有已加载的皮肤并重新应用
    defaultSkinURLs.bird.forEach((skin, index) => {
        if (originalImages.bird[index]) {
            applyEdgeAssistToSkin('bird', index);
        }
    });

    defaultSkinURLs.obstacle.forEach((skin, index) => {
        if (originalImages.obstacle[index]) {
            applyEdgeAssistToSkin('obstacle', index);
        }
    });
}

// 选择难度
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;

    // 更新按钮状态
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('active');

    // 更新小鸟的重力设置
    bird.gravity = difficultySettings[difficulty].gravity;

    // 更新UI
    updateUI();
}

// 设置事件监听器
function setupEventListeners() {
    // 游戏控制
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault(); // Prevent default spacebar action (like scrolling)
            if (gameState === 'start') {
                startGame();
            } else if (gameState === 'playing') {
                handleJump();
            } else if (gameState === 'gameOver') {
                startGame();
            }
        }
    });

    canvas.addEventListener('click', handleJump);
    document.querySelector('.start-btn').addEventListener('click', startGame);
    document.querySelector('.restart-btn').addEventListener('click', startGame);
    document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', showStartScreen));
    document.getElementById('register-btn').addEventListener('click', register);
    document.querySelector('.leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('level-file-input').addEventListener('change', loadLevel);

    // 空气边缘辅助开关
    document.getElementById('edgeAssistToggle').addEventListener('change', toggleEdgeAssist);

    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            selectDifficulty(this.dataset.difficulty);
        });
    });
}

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    if (gameState !== 'playing') return;

    frames++;
    // Prevent frames from growing indefinitely
    if (frames > 1000000) {
        frames = 0;
    }

    // 更新小鸟
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // 旋转小鸟
    bird.rotation = bird.velocity * 0.1;
    if (bird.rotation > 0.5) bird.rotation = 0.5;
    if (bird.rotation < -0.5) bird.rotation = -0.5;

    // 根据当前难度生成障碍物
    // If a level is loaded, don't generate obstacles procedurally
    if (!levelLoaded) {
        const obstacleFrequency = difficultySettings[currentDifficulty].obstacleFrequency;
        if (frames % obstacleFrequency === 0) {
            generateObstacle();
        }
    }

    // 更新障碍物
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 2;

        // 检测碰撞 - 使用显示尺寸进行碰撞检测
        if (checkCollision(bird, obstacles[i])) {
            gameOver();
            return;
        }

        // 移除屏幕外的障碍物
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }

        // 计分
        if (!obstacles[i].counted && obstacles[i].x + obstacles[i].width < bird.x) {
            score++;
            obstacles[i].counted = true;
            updateScore();
        }
    }

    // 检测边界 - 使用显示尺寸进行边界检测
    if (bird.y < 0 || bird.y + bird.displayHeight > canvas.height) {
        gameOver();
    }
}

// 绘制游戏
function draw() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    if (currentSkins.background) {
        ctx.drawImage(currentSkins.background, 0, 0, canvas.width, canvas.height);
    }

    // 绘制障碍物
    for (let obstacle of obstacles) {
        if (currentSkins.obstacle) {
            // 绘制顶部障碍物
            ctx.save();
            ctx.translate(obstacle.x, 0);
            ctx.scale(1, -1);
            ctx.drawImage(
                currentSkins.obstacle,
                0,
                0,
                currentSkins.obstacle.width,
                obstacle.gapPosition,
                -currentSkins.obstacle.width / 2 + obstacle.width / 2,
                -obstacle.gapPosition,
                obstacle.width,
                obstacle.gapPosition
            );
            ctx.restore();

            // 绘制底部障碍物
            ctx.drawImage(
                currentSkins.obstacle,
                0,
                0,
                currentSkins.obstacle.width,
                canvas.height - obstacle.gapPosition - obstacle.gapSize,
                obstacle.x - currentSkins.obstacle.width / 2 + obstacle.width / 2,
                obstacle.gapPosition + obstacle.gapSize,
                obstacle.width,
                canvas.height - obstacle.gapPosition - obstacle.gapSize
            );
        }
    }

    // 绘制小鸟 - 使用显示尺寸
    if (currentSkins.bird) {
        ctx.save();
        ctx.translate(bird.x + bird.displayWidth / 2, bird.y + bird.displayHeight / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(currentSkins.bird, -bird.displayWidth / 2, -bird.displayHeight / 2, bird.displayWidth, bird.displayHeight);
        ctx.restore();
    }
}

// 生成障碍物
function generateObstacle() {
    const gapSize = 180; // 稍微增大空隙以适应更大的小鸟
    const gapPosition = Math.random() * (canvas.height - gapSize - 100) + 50;

    obstacles.push({
        x: canvas.width,
        width: 60,
        gapPosition: gapPosition,
        gapSize: gapSize,
        counted: false
    });
}

// 检测碰撞 - 使用显示尺寸进行碰撞检测
function checkCollision(bird, obstacle) {
    return bird.x < obstacle.x + obstacle.width &&
        bird.x + bird.displayWidth > obstacle.x &&
        (bird.y < obstacle.gapPosition || bird.y + bird.displayHeight > obstacle.gapPosition + obstacle.gapSize);
}

// 处理跳跃
function handleJump() {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
    }
}

// 开始游戏
function startGame() {
    gameState = 'playing';
    score = 0;
    frames = 0;
    obstacles = [];
    levelLoaded = false;
    bird.y = 150;
    bird.velocity = 0;

    // 应用当前难度的重力设置
    bird.gravity = difficultySettings[currentDifficulty].gravity;

    document.querySelector('.start-screen').style.display = 'none';
    document.querySelector('.game-over-screen').style.display = 'none';

    updateScore();
}

// 游戏结束
function gameOver() {
    gameState = 'gameOver';

    // 更新当前难度的最高分
    if (score > highScores[currentDifficulty]) {
        highScores[currentDifficulty] = score;
        localStorage.setItem('nightPatrolHighScores', JSON.stringify(highScores));
    }

    if (currentUser) {
        submitScore(score, currentDifficulty);
    }

    document.querySelector('.game-over-screen').style.display = 'flex';
    document.querySelector('.final-score').textContent = score;
    document.getElementById('currentDifficulty').textContent = `难度: ${difficultySettings[currentDifficulty].name}`;

    updateUI();
}

// 显示开始屏幕
function showStartScreen() {
    gameState = 'start';
    document.querySelector('.start-screen').style.display = 'flex';
    document.querySelector('.game-over-screen').style.display = 'none';
    document.querySelector('.leaderboard-screen').style.display = 'none';
}

// 更新分数显示
function updateScore() {
    document.querySelector('.score-display').textContent = score;
}

// 更新UI
function updateUI() {
    document.getElementById('highScoreDisplay').innerHTML =
        `最高分:<br>简单: ${highScores.easy}<br>普通: ${highScores.normal}<br>困难: ${highScores.hard}`;
}

// 加载游戏数据
function loadGameData() {
    const savedScores = localStorage.getItem('nightPatrolHighScores');
    if (savedScores) {
        highScores = JSON.parse(savedScores);
    }
    const savedUser = localStorage.getItem('nightPatrolUser');
    if (savedUser) {
        currentUser = savedUser;
        document.getElementById('registration-form').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('nickname-display').textContent = currentUser;
    }
}

// 初始化游戏
window.onload = init;

// API functions
async function register() {
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('请输入昵称');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname })
        });

        if (response.ok) { // Handles both 200 OK and 201 Created
            currentUser = nickname;
            localStorage.setItem('nightPatrolUser', nickname);
            document.getElementById('registration-form').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('nickname-display').textContent = currentUser;
        } else {
            const error = await response.text();
            alert(`注册/登录失败: ${error}`);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('注册时发生错误');
    }
}

async function showLeaderboard() {
    document.querySelector('.start-screen').style.display = 'none';
    const leaderboardScreen = document.querySelector('.leaderboard-screen');
    leaderboardScreen.style.display = 'flex';
    
    // 加载当前选中难度的排行榜
    await loadLeaderboard(currentDifficulty);
}

async function loadLeaderboard(difficulty) {
    const leaderboardContent = document.getElementById('leaderboard-content');
    const difficultyNames = { easy: '简单', normal: '普通', hard: '困难' };
    
    leaderboardContent.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const response = await fetch(`/api/leaderboard?difficulty=${difficulty}`);
        const scores = await response.json();
        
        let html = `<div class="leaderboard-header">
            <h3>${difficultyNames[difficulty]}难度排行榜</h3>
            <div class="difficulty-tabs">
                <button class="difficulty-tab ${difficulty === 'easy' ? 'active' : ''}" onclick="loadLeaderboard('easy')">简单</button>
                <button class="difficulty-tab ${difficulty === 'normal' ? 'active' : ''}" onclick="loadLeaderboard('normal')">普通</button>
                <button class="difficulty-tab ${difficulty === 'hard' ? 'active' : ''}" onclick="loadLeaderboard('hard')">困难</button>
            </div>
        </div>`;
        
        if (!scores || scores.length === 0) {
            html += '<div class="empty-leaderboard">暂无排名数据<br>开始游戏创建第一个记录吧！</div>';
        } else {
            html += '<div class="leaderboard-table-container"><table class="leaderboard-table">';
            html += '<thead><tr><th class="rank-col">排名</th><th class="name-col">玩家</th><th class="score-col">分数</th></tr></thead><tbody>';
            
            scores.slice(0, 10).forEach((entry, index) => {
                const isCurrentUser = currentUser && entry.nickname === currentUser;
                const rankClass = index < 3 ? `rank-${index + 1}` : '';
                const userClass = isCurrentUser ? 'current-user' : '';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                html += `<tr class="${rankClass} ${userClass}">
                    <td class="rank-col">${medal || (index + 1)}</td>
                    <td class="name-col">${entry.nickname}</td>
                    <td class="score-col">${entry.score}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        leaderboardContent.innerHTML = html;
        
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        leaderboardContent.innerHTML = '<div class="error-message">加载排行榜失败<br>请稍后重试</div>';
    }
}

// 将函数暴露到全局作用域，以便HTML onclick可以调用
window.loadLeaderboard = loadLeaderboard;

async function submitScore(score, difficulty) {
    if (!currentUser) return;

    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: currentUser, score, difficulty })
        });
        
        // 如果排行榜正在显示，刷新当前难度的排行榜数据
        const leaderboardScreen = document.querySelector('.leaderboard-screen');
        if (leaderboardScreen && leaderboardScreen.style.display === 'flex') {
            await loadLeaderboard(difficulty);
        }
    } catch (error) {
        console.error('Failed to submit score:', error);
    }
}

function loadLevel(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const levelData = JSON.parse(e.target.result);
            if (levelData && levelData.obstacles) {
                obstacles = levelData.obstacles;
                levelLoaded = true;
                // Reset frames to ensure obstacles appear correctly
                frames = 0;
            } else {
                alert('Invalid level file format.');
            }
        } catch (error) {
            alert('Error parsing level file.');
            console.error('Error parsing level file:', error);
        }
    };
    reader.readAsText(file);
}

function resizeCanvas() {
    const gameContainer = document.querySelector('.game-container');
    const aspectRatio = 9 / 16;
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;

    let newWidth, newHeight;

    if (containerWidth / containerHeight > aspectRatio) {
        // Wider than aspect ratio, so height is the limiting factor
        newHeight = containerHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        // Taller than aspect ratio, so width is the limiting factor
        newWidth = containerWidth;
        newHeight = newWidth / aspectRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}