const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')

router.get('/sitemap.xml', async (req, res) => {
    const domain = 'https://master.tomochain.com'
    const routes = (await db.Candidate.find()).map(c => {
        return `${domain}/candidate/${c.candidate}`
    })
    const list = routes
        .map(route => `<url><loc>${route}</loc></url>`)
        .join('\r\n')
    return res.send(`<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    ${list}
    </urlset>`)
})

module.exports = router
