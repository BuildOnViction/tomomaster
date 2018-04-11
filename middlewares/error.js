'use strict';

module.exports = function(err, req, res, next) {
    if (err) {
        if (err === true) err = {};
        err.status = err.status || 406;
        err.message = err.message ||  _.map(err, 'msg')[0] || 'Not Acceptable';
        console.error(err);
        return res.status(err.status).json({
            status: err.status,
            message: err.message
        });
    }
    return next();
};
