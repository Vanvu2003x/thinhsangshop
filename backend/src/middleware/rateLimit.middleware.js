const rateLimit = require('express-rate-limit');

const getClientIP = (req) => {
    return req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
        req.ip;
};

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: {
        status: false,
        message: "Quá nhiều request, vui lòng thử lại sau 15 phút"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIP,
    validate: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: false,
        message: "Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: getClientIP,
    validate: false,
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: {
        status: false,
        message: "Quá nhiều yêu cầu gửi OTP, vui lòng thử lại sau 5 phút"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIP,
    validate: false,
});

const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        status: false,
        message: "Quá nhiều đơn hàng, vui lòng chờ 1 phút"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIP,
    validate: false,
});

const callbackLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        status: false,
        message: "Too many callback requests"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIP,
    validate: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    otpLimiter,
    orderLimiter,
    callbackLimiter,
    getClientIP
};