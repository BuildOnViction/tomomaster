const fs = require('fs')
const path = require('path')

const targetFile = path.resolve(__dirname, '../node_modules/@ledgerhq/hw-transport-webusb/lib-es/TransportWebUSB.js')

const originalContent = fs.readFileSync(targetFile, 'utf-8')

const patchedContent = originalContent.replace(
    `import hidFraming from "@ledgerhq/devices/hid-framing";`,
    `import hidFraming from "@ledgerhq/devices/lib/hid-framing";`
)

fs.writeFileSync(targetFile, patchedContent)
