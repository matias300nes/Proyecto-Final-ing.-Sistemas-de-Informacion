const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const authMiddleware = (req, res, next) => {
    const authHeader = req.get('Authorization')
    req.id = uuidv4();
    if (!authHeader) {
        req.error = "No authentication header found."
        req.isAuth = false
        return next()
    }

    let decoded

    try {
        const token = authHeader
        decoded = jwt.verify(token, process.env.JWT_KEY)
    } catch (error) {
        req.isAuth = false
        req.error = error.message
        return next()
    }

    if (!decoded) {
        req.isAuth = false
        req.error = "Unable to decode jwt"
        return next()
    }

    req.isAuth = true
    req.user = decoded.user
    req.error = null
    next()
}

module.exports = authMiddleware