const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false
        }
    });

    win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {

    // levantar backend
    backendProcess = spawn('node', ['backend/src/app.js'], {
        shell: true
    });

    backendProcess.stdout.on('data', data => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', data => {
        console.error(`Backend Error: ${data}`);
    });

    createWindow();
});

app.on('window-all-closed', () => {

    if (backendProcess) {
        backendProcess.kill();
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});