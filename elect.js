const { app, BrowserWindow } = require('electron')

let win = null

function createWindow () {
    // Initialize the window to our specified dimensions
    win = new BrowserWindow(
        {
            maximizable: true,
            icon: './app/assets/img/icon.icns' // for AppImage
        }
    )

    isOnline(() => {
        win.maximize()

        // Specify entry point to default entry point of vue.js
        win.loadURL('https://master.testnet.tomochain.com')
    })

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

function isOnline (callback) {
    /**
     * Show a warning to the user.
     * You can retry in the dialog until a internet connection
     * is active.
     */
    var message = function () {
        const { dialog } = require('electron').remote

        return dialog.showMessageBox({
            title:"There's no internet",
            message:'No internet available, do you want to try again?',
            type:'warning',
            buttons:['Try again please","I don\'t want to work anyway'],
            defaultId: 0
        }, function (index) {
            // if clicked "Try again please"
            if (index === 0) {
                execute()
            }
        })
    }

    var execute = function () {
        if (navigator.onLine) {
            // Execute action if internet available.
            callback()
        } else {
            // Show warning to user
            // And "retry" to connect
            message()
        }
    }

    // Verify for first time
    execute()
}
