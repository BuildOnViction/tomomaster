const { app, BrowserWindow, dialog } = require('electron')
const isOnline = require('is-online')

let win = null

async function createWindow () {
    // Initialize the window to our specified dimensions
    win = new BrowserWindow(
        {
            maximizable: true,
            icon: './app/assets/img/icon.icns' // for AppImage
        }
    )

    if (await isOnline()) {
        win.maximize()

        // Specify entry point to default entry point of vue.js
        win.loadURL('https://master.testnet.tomochain.com')
    } else {
        win.maximize()
        return dialog.showMessageBox({
            title:'No internet connection',
            message:'Check your internet connection and try again.',
            type:'warning',
            buttons:['OK']
        }, index => {
            if (index === 0) {
                win.close()
            }
        })
    }

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
