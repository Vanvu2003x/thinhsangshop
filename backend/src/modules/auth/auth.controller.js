const AuthService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");

const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const isSecureRequest = (req) => {
    const forwardedProtoHeader = req.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
        ? forwardedProtoHeader[0]
        : forwardedProtoHeader?.split(",")[0]?.trim();

    return req.secure || forwardedProto === "https";
};

const getTokenCookieOptions = (req) => ({
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE
});

const getTokenClearCookieOptions = (req) => ({
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/"
});

const AuthController = {
    register: asyncHandler(async (req, res) => {
        const result = await AuthService.register(req.body);

        const { email, password } = req.body;
        const loginResult = await AuthService.login(email, password);

        res.cookie('token', loginResult.token, getTokenCookieOptions(req));

        return res.status(201).json({
            ...result,
            ...loginResult
        });
    }),

    logout: (req, res) => {
        res.clearCookie('token', getTokenClearCookieOptions(req));
        return res.status(200).json({ message: "Đăng xuất thành công" });
    },

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);

        res.cookie('token', result.token, getTokenCookieOptions(req));

        return res.status(200).json(result);
    }),

    checkmail: asyncHandler(async (req, res) => {
        const result = await AuthService.checkEmail(req.body.email);
        return res.json(result);
    }),

    forgotPasswordSendOTP: asyncHandler(async (req, res) => {
        const result = await AuthService.forgotPasswordSendOTP(req.body.email);
        return res.json(result);
    }),

    resetPassword: asyncHandler(async (req, res) => {
        const { email, otp, newPassword } = req.body;
        const result = await AuthService.resetPassword(email, otp, newPassword);
        return res.json(result);
    }),

    sendAdminOTP: asyncHandler(async (req, res) => {
        const result = await AuthService.sendAdminOTP(req.user.id);
        return res.json(result);
    }),

    verifyAdminOTP: asyncHandler(async (req, res) => {
        const result = await AuthService.verifyAdminOTP(req.user.id, req.body.otp);
        return res.json(result);
    }),

    getRole: asyncHandler(async (req, res) => {
        const result = await AuthService.getRole(req.user.id);
        return res.json(result);
    }),

    sendRoleOTP: asyncHandler(async (req, res) => {
        const { targetUserId, newRole } = req.body;
        const result = await AuthService.sendRoleOTP(req.user.id, targetUserId, newRole);
        return res.json(result);
    }),

    verifyRoleOTP: asyncHandler(async (req, res) => {
        const result = await AuthService.verifyRoleOTP(req.user.id, req.body.otp);
        return res.json(result);
    })
};

module.exports = AuthController;
