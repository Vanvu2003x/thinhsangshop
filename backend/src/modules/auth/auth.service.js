const bcrypt = require("bcrypt");
const { db } = require("../../configs/drizzle");
const { users } = require("../../db/schema");
const { eq } = require("drizzle-orm");
const { generateToken } = require("../../services/jwt.service");
const { sendOTP, sendOTPRePass, sendAdminBalanceOTP } = require("../../services/nodemailer.service");
const client = require("../../configs/redis.config");
const crypto = require("crypto");

const AuthService = {

    register: async (data) => {
        if (!data.name || !data.password || !data.email) {
            throw { status: 400, message: "Tên, Email và mật khẩu là bắt buộc." };
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, data.email));
        if (existingUser) {
            throw { status: 409, message: "Email đã tồn tại." };
        }

        const hash_password = await bcrypt.hash(data.password, 10);

        const allUsers = await db.select().from(users).limit(1);
        const isFirstUser = allUsers.length === 0;

        const newUser = {
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            hash_password: hash_password,
            role: isFirstUser ? "admin" : "user",
            level: isFirstUser ? 3 : 1,
            balance: isFirstUser ? 9999999 : 0
        };

        await db.insert(users).values(newUser);

        return { message: "Đăng ký thành công." };
    },

    login: async (email, password) => {
        if (!email || !password) {
            throw { status: 400, message: "Email và mật khẩu là bắt buộc." };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            throw { status: 401, message: "Email không tồn tại." };
        }

        if (user.status !== "active") {
            throw { status: 403, message: "Tài khoản của bạn đã bị khóa." };
        }

        const isMatch = await bcrypt.compare(password, user.hash_password);
        if (!isMatch) {
            throw { status: 401, message: "Mật khẩu không đúng." };
        }

        const token = generateToken(user);
        return {
            message: "Đăng nhập thành công.",
            token: token,
            name_user: user.name,
        };
    },

    checkEmail: async (email) => {
        const [existingUser] = await db.select().from(users).where(eq(users.email, email));

        const otp = crypto.randomInt(100000, 1000000);
        await client.set(`otp:${email}`, otp, { EX: 300 });
        await sendOTP(email, otp);

        if (!existingUser) {
            return { status: "ok", message: "Email chưa tồn tại" };
        } else {
            return { status: "fail", message: "Email đã tồn tại" };
        }
    },

    forgotPasswordSendOTP: async (email) => {
        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            throw { status: 404, message: "Email không tồn tại" };
        }

        const otp = crypto.randomInt(100000, 1000000);
        await client.set(`otp:forgot:${email}`, otp, { EX: 300 });
        await sendOTPRePass(email, otp);

        return { status: "ok", message: "Đã gửi OTP về email" };
    },

    resetPassword: async (email, otp, newPassword) => {
        if (!email || !otp || !newPassword) {
            throw { status: 400, message: "Email, OTP và mật khẩu mới là bắt buộc" };
        }

        const savedOTP = await client.get(`otp:forgot:${email}`);

        if (!savedOTP || savedOTP !== otp) {
            throw { status: 400, message: "OTP không đúng hoặc đã hết hạn" };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            throw { status: 404, message: "Email không tồn tại" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.update(users)
            .set({ hash_password: hashedPassword })
            .where(eq(users.id, user.id));

        await client.del(`otp:forgot:${email}`);

        return { status: "ok", message: "Đổi mật khẩu thành công" };
    },

    sendAdminOTP: async (userId) => {
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) {
            throw { status: 404, message: "User không tồn tại" };
        }

        if (user.role !== "admin") {
            throw { status: 403, message: "Bạn không có quyền thực hiện thao tác này" };
        }

        const email = user.email;
        const otp = crypto.randomInt(100000, 1000000);

        await client.set(`otp:admin:${email}`, otp, { EX: 300 });
        await sendAdminBalanceOTP(email, otp);

        return { status: "ok", message: "Đã gửi OTP xác thực đến email admin" };
    },

    verifyAdminOTP: async (userId, otp) => {
        if (!otp) {
            throw { status: 400, message: "OTP là bắt buộc" };
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            throw { status: 404, message: "User không tồn tại" };
        }

        const savedOTP = await client.get(`otp:admin:${user.email}`);

        if (!savedOTP || savedOTP !== otp) {
            throw { status: 400, message: "OTP không đúng hoặc đã hết hạn" };
        }

        await client.del(`otp:admin:${user.email}`);

        return { status: "ok", message: "Xác thực OTP thành công, có thể cộng/trừ tiền" };
    },

    sendRoleOTP: async (adminUserId, targetUserId, newRole) => {

        const [adminUser] = await db.select().from(users).where(eq(users.id, adminUserId));
        if (!adminUser) {
            throw { status: 404, message: "Admin không tồn tại" };
        }
        if (adminUser.role !== "admin") {
            throw { status: 403, message: "Bạn không có quyền thực hiện thao tác này" };
        }

        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
        if (!targetUser) {
            throw { status: 404, message: "Người dùng cần thăng cấp không tồn tại" };
        }
        if (targetUser.role === "admin") {
            throw { status: 403, message: "Không thể thay đổi role của admin khác" };
        }

        const validRoles = ["user", "agent", "admin"];
        if (!validRoles.includes(newRole)) {
            throw { status: 400, message: "Role không hợp lệ" };
        }

        const otp = crypto.randomInt(100000, 1000000);

        await client.set(`otp:role:${adminUser.email}`, JSON.stringify({
            otp: otp.toString(),
            targetUserId,
            newRole,
            targetEmail: targetUser.email
        }), { EX: 300 });

        const { sendRolePromotionOTP } = require("../../services/nodemailer.service");
        await sendRolePromotionOTP(adminUser.email, otp, targetUser.email, newRole);

        return { status: "ok", message: "Đã gửi OTP xác thực thăng cấp đến email admin" };
    },

    verifyRoleOTP: async (adminUserId, otp) => {
        if (!otp) {
            throw { status: 400, message: "OTP là bắt buộc" };
        }

        const [adminUser] = await db.select().from(users).where(eq(users.id, adminUserId));
        if (!adminUser) {
            throw { status: 404, message: "Admin không tồn tại" };
        }

        const savedData = await client.get(`otp:role:${adminUser.email}`);
        if (!savedData) {
            throw { status: 400, message: "OTP đã hết hạn hoặc không tồn tại" };
        }

        const { otp: savedOTP, targetUserId, newRole, targetEmail } = JSON.parse(savedData);

        if (savedOTP !== otp) {
            throw { status: 400, message: "OTP không đúng" };
        }

        await db.update(users)
            .set({ role: newRole })
            .where(eq(users.id, targetUserId));

        await client.del(`otp:role:${adminUser.email}`);

        return {
            status: "ok",
            message: `Đã thăng cấp ${targetEmail} lên ${newRole} thành công`,
            targetUserId,
            newRole
        };
    },

    getRole: async (userId) => {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) throw { status: 404, message: "User not found" };
        return { role: user.role };
    }
};

module.exports = AuthService;