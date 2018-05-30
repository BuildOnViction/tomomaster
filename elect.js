const { app, BrowserWindow } = require('electron')

let win = null

function createWindow () {
    // Initialize the window to our specified dimensions
    win = new BrowserWindow(
        {
            maximizable: true
        }
    )

    win.maximize()

    // Specify entry point to default entry point of vue.js
    win.loadURL('http://localhost:3000')

    // Remove window once app is closed
    win.on('closed', function () {
        win = null
    })
}

app.on('ready', createWindow)
// create the application window if the window variable is null
app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})
// quit the app once closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
