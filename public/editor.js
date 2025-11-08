let canvas, ctx;
let obstacles = [];

function init() {
    canvas = document.getElementById('editor-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addObstacle(x, y);
    });

    document.getElementById('save-level-btn').addEventListener('click', saveLevel);

    draw();
}

function addObstacle(x, y) {
    // For simplicity, we'll add a default obstacle at the clicked x position
    // The y position will determine the gap's center
    const gapSize = 180;
    const gapPosition = y - (gapSize / 2);

    obstacles.push({
        x: x,
        width: 60,
        gapPosition: gapPosition,
        gapSize: gapSize,
    });
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach(obs => {
        ctx.fillStyle = 'green';
        // Top part
        ctx.fillRect(obs.x, 0, obs.width, obs.gapPosition);
        // Bottom part
        ctx.fillRect(obs.x, obs.gapPosition + obs.gapSize, obs.width, canvas.height - (obs.gapPosition + obs.gapSize));
    });
}

function saveLevel() {
    const levelData = {
        obstacles: obstacles
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(levelData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "level.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

window.onload = init;