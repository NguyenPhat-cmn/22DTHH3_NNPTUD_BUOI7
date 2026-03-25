let jwt = require('jsonwebtoken');
let fs = require('fs');
let path = require('path');

const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, '../private.pem'), 'utf8');
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, '../public.pem'), 'utf8');

module.exports = {
    generateToken: function (payload) {
        return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '1d' });
    },

    // Middleware: kiểm tra đăng nhập (authentication)
    authentication: function (req, res, next) {
        try {
            let authHeader = req.headers['authorization'];
            if (!authHeader) return res.status(401).send({ message: 'Thiếu token' });

            let token = authHeader.split(' ')[1];
            let decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).send({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }
    },

    // Middleware: kiểm tra quyền (authorization) theo tên role
    authorization: function (...allowedRoles) {
        return function (req, res, next) {
            if (!req.user) return res.status(401).send({ message: 'Chưa xác thực' });
            if (!allowedRoles.includes(req.user.roleName)) {
                return res.status(403).send({ message: 'Không có quyền truy cập' });
            }
            next();
        };
    }
};
