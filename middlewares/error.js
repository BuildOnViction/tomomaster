'use strict'
const _ = require('lodash')

module.exports = function (err, req, res, next) {
    if (err) {
        if (err === true) err = {}
        err.status = err.status || 406
        err.message = err.message || _.map(err, 'msg')[0] || 'Not Acceptable'

        if (parseInt(err.status) !== 401 && parseInt(err.status) !== 403) {
            console.trace(err)
            console.log(err)
        }

        return res.status(err.status).json({
            status: err.status,
            message: err.message
        })
    }
    return next()
}
