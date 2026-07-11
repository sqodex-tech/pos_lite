const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
    req.id = req.header('X-Request-Id') || uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
};

module.exports = requestId;
