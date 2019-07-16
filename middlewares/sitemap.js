const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const _ = require('lodash')
const apicache = require('apicache')
const cache = apicache.middleware

router.get('/sitemap.xml', cache('1 day'), async (req, res) => {
    const domain = 'https://master.tomochain.com'
    let routes = (await db.Candidate.find()
        .sort({ capacityNumber: -1 })
        .limit(500).lean().exec()).map(c => {
        return `${domain}/candidate/${c.candidate}`
    })
    routes = _.concat(routes, (await db.Voter.find()
        .sort({ capacityNumber: -1 })
        .limit(2000).lean().exec()).map(v => {
        return `${domain}/voter/${v.voter}`
    }))
    const lastmod = (new Date()).toISOString()
    const list = routes
        .map(route => `<url><loc>${route}</loc><lastmod>${lastmod}</lastmod></url>`)
        .join('\r')

    routes = _.concat(routes, `${domain}`)

    res.header('Content-Type', 'application/xml')
    /* eslint-disable */
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${list}</urlset>`)
    /* eslint-enable no-alert */
})

module.exports = router
