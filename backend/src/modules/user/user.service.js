const { db } = require("../../configs/drizzle");
const { users, orders, walletLogs, balanceHistory } = require("../../db/schema");
const { eq, sql } = require("drizzle-orm");

const getAffectedRows = (result) => {
    if (!result) return 0;
    if (typeof result.affectedRows === "number") return result.affectedRows;
    if (Array.isArray(result)) {
        if (typeof result[0]?.affectedRows === "number") return result[0].affectedRows;
        if (typeof result[0]?.rowsAffected === "number") return result[0].rowsAffected;
    }
    return 0;
};

const UserService = {
    getInfo: async (userId) => {
        if (!userId) {
            throw { status: 401, message: "ChÆ°a xÃ¡c thá»±c ngÆ°á»i dÃ¹ng" };
        }

        const [userInfo] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            balance: users.balance,
            role: users.role,
            level: users.level,
            created_at: users.created_at
        }).from(users).where(eq(users.id, userId));

        if (!userInfo) {
            throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" };
        }

        return { user: userInfo };
    },

    getAllUser: async (role) => {
        let query = db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            level: users.level,
            balance: users.balance,
            status: users.status,
            created_at: users.created_at,
            updated_at: users.updated_at,
            so_don_order: sql`COALESCE((SELECT COUNT(*) FROM orders WHERE orders.user_id = ${users.id} AND orders.status = 'success'), 0)`,
            so_don_da_nap: sql`COALESCE((SELECT COUNT(*) FROM topup_wallet_logs WHERE topup_wallet_logs.user_id = ${users.id} AND topup_wallet_logs.status = 'ThÃ nh CÃ´ng'), 0)`,
            tong_amount: sql`COALESCE((SELECT SUM(amount) FROM topup_wallet_logs WHERE topup_wallet_logs.user_id = ${users.id} AND topup_wallet_logs.status = 'ThÃ nh CÃ´ng'), 0)`
        }).from(users);

        if (role) {
            query = query.where(eq(users.role, role));
        }

        const result = await query;

        return {
            status: true,
            data: result,
            totalUser: result.length
        };
    },

    updateUserRole: async (targetUserId, newRole) => {
        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));

        if (!targetUser) throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng cáº§n cáº­p nháº­t" };
        if (targetUser.role === "admin") throw { status: 403, message: "KhÃ´ng thá»ƒ thay Ä‘á»•i role cá»§a admin" };

        await db.update(users)
            .set({ role: newRole })
            .where(eq(users.id, targetUserId));

        const [updatedUser] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            level: users.level,
            balance: users.balance,
            created_at: users.created_at
        }).from(users).where(eq(users.id, targetUserId));

        return { message: "Cáº­p nháº­t role thÃ nh cÃ´ng", user: updatedUser };
    },

    getUserById: async (userId) => {
        if (!userId) {
            throw { status: 400, message: "Thiáº¿u tham sá»‘ user_id" };
        }

        const [userInfo] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            balance: users.balance,
            role: users.role,
            level: users.level,
            created_at: users.created_at
        }).from(users).where(eq(users.id, userId));

        if (!userInfo) {
            throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" };
        }

        return userInfo;
    },

    updateBalance: async (userId, amount, type, description = "") => {
        if (!userId || !amount || !type) {
            throw { status: 400, message: "Thiáº¿u tham sá»‘ báº¯t buá»™c" };
        }

        const normalizedAmount = Number(amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw { status: 400, message: "Amount pháº£i lÃ  sá»‘ dÆ°Æ¡ng" };
        }

        if (!["credit", "debit"].includes(type)) {
            throw { status: 400, message: "Type pháº£i lÃ  'credit' hoáº·c 'debit'" };
        }

        const adjustedAmount = type === "credit" ? normalizedAmount : -normalizedAmount;
        let newBalance = null;
        let balanceBefore = null;

        const success = await db.transaction(async (tx) => {
            let updateResult;

            if (type === "credit") {
                updateResult = await tx.execute(sql`
                    UPDATE users
                    SET balance = balance + ${normalizedAmount}
                    WHERE id = ${userId}
                `);
            } else {
                updateResult = await tx.execute(sql`
                    UPDATE users
                    SET balance = balance - ${normalizedAmount}
                    WHERE id = ${userId} AND balance >= ${normalizedAmount}
                `);
            }

            if (getAffectedRows(updateResult) === 0) {
                const [existingUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId));
                if (!existingUser) return false;

                if (type === "debit") {
                    const currentBalance = Number(existingUser.balance || 0);
                    const missing = normalizedAmount - currentBalance;
                    throw {
                        status: 400,
                        message: `Sá»‘ dÆ° khÃ´ng Ä‘á»§! Hiá»‡n cÃ³: ${currentBalance.toLocaleString('vi-VN')}Ä‘. Cáº§n: ${normalizedAmount.toLocaleString('vi-VN')}Ä‘. Thiáº¿u: ${missing.toLocaleString('vi-VN')}Ä‘. Vui lÃ²ng náº¡p thÃªm!`
                    };
                }

                return false;
            }

            const [updatedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId));
            if (!updatedUser) return false;

            newBalance = Number(updatedUser.balance || 0);
            balanceBefore = newBalance - adjustedAmount;

            await tx.insert(balanceHistory).values({
                user_id: userId,
                amount: adjustedAmount,
                balance_before: balanceBefore,
                balance_after: newBalance,
                type,
                description: description || (type === "credit" ? "Náº¡p vÃ­" : "Trá»« tiá»n")
            });

            return true;
        });

        if (!success) {
            throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y user hoáº·c cáº­p nháº­t tháº¥t báº¡i" };
        }

        const { emitToUser } = require("../../sockets/websocket");
        emitToUser(userId, "balance_update", newBalance);
        emitToUser(userId, "payment_success", {
            redirect: true,
            url: "/",
            message: "Thanh toÃ¡n thÃ nh cÃ´ng!",
            balance: newBalance,
        });

        return { message: "Cáº­p nháº­t sá»‘ dÆ° thÃ nh cÃ´ng" };
    },

    searchUser: async (role, keyword) => {
        let querySql;

        if (role && keyword) {
            querySql = sql`
                SELECT
                    u.id, u.name, u.email, u.role, u.level, u.balance, u.status, u.created_at, u.updated_at,
                    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'success'), 0) as so_don_order,
                    COALESCE((SELECT COUNT(*) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as so_don_da_nap,
                    COALESCE((SELECT SUM(amount) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as tong_amount
                FROM users u
                WHERE u.role = ${role} AND (u.name LIKE ${`%${keyword}%`} OR u.email LIKE ${`%${keyword}%`})
            `;
        } else if (role) {
            querySql = sql`
                SELECT
                    u.id, u.name, u.email, u.role, u.level, u.balance, u.status, u.created_at, u.updated_at,
                    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'success'), 0) as so_don_order,
                    COALESCE((SELECT COUNT(*) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as so_don_da_nap,
                    COALESCE((SELECT SUM(amount) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as tong_amount
                FROM users u
                WHERE u.role = ${role}
            `;
        } else if (keyword) {
            querySql = sql`
                SELECT
                    u.id, u.name, u.email, u.role, u.level, u.balance, u.status, u.created_at, u.updated_at,
                    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'success'), 0) as so_don_order,
                    COALESCE((SELECT COUNT(*) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as so_don_da_nap,
                    COALESCE((SELECT SUM(amount) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as tong_amount
                FROM users u
                WHERE (u.name LIKE ${`%${keyword}%`} OR u.email LIKE ${`%${keyword}%`})
            `;
        } else {
            querySql = sql`
                SELECT
                    u.id, u.name, u.email, u.role, u.level, u.balance, u.status, u.created_at, u.updated_at,
                    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'success'), 0) as so_don_order,
                    COALESCE((SELECT COUNT(*) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as so_don_da_nap,
                    COALESCE((SELECT SUM(amount) FROM topup_wallet_logs tw WHERE tw.user_id = u.id AND tw.status = 'ThÃ nh CÃ´ng'), 0) as tong_amount
                FROM users u
            `;
        }

        const [result] = await db.execute(querySql);
        return { success: true, users: result };
    },

    toggleUserLock: async (userId) => {
        if (!userId) {
            throw { status: 400, message: "Thiáº¿u user ID" };
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) {
            throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" };
        }

        if (user.role === "admin") {
            throw { status: 403, message: "KhÃ´ng thá»ƒ khÃ³a tÃ i khoáº£n admin" };
        }

        const newStatus = user.status === "banned" ? "active" : "banned";
        const isLocked = newStatus === "banned";

        await db.update(users)
            .set({ status: newStatus })
            .where(eq(users.id, userId));

        return {
            success: true,
            locked: isLocked,
            message: isLocked ? "ÄÃ£ khÃ³a tÃ i khoáº£n" : "ÄÃ£ má»Ÿ khÃ³a tÃ i khoáº£n"
        };
    },

    updateUserLevel: async (targetUserId, newLevel) => {
        if (!targetUserId || !newLevel) {
            throw { status: 400, message: "Thiáº¿u tham sá»‘ báº¯t buá»™c" };
        }

        const level = parseInt(newLevel, 10);
        if (![1, 2, 3].includes(level)) {
            throw { status: 400, message: "Level pháº£i lÃ  1 (Basic), 2 (Pro), hoáº·c 3 (Plus)" };
        }

        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));

        if (!targetUser) {
            throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" };
        }

        await db.update(users)
            .set({ level })
            .where(eq(users.id, targetUserId));

        const levelLabels = { 1: "Basic", 2: "Pro", 3: "Plus" };

        const [updatedUser] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            level: users.level,
            balance: users.balance
        }).from(users).where(eq(users.id, targetUserId));

        return {
            success: true,
            message: `Ä Ã£ cáº­p nháº­t level thÃ nh ${levelLabels[level]}`,
            user: updatedUser
        };
    },

    updateUser: async (userId, data) => {
        if (!userId) {
            throw { status: 400, message: "Thiếu user ID" };
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            throw { status: 404, message: "Không tìm thấy người dùng" };
        }

        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.level !== undefined) {
            const level = parseInt(data.level, 10);
            if ([1, 2, 3].includes(level)) {
                updateData.level = level;
            }
        }
        if (data.status !== undefined && ["active", "banned"].includes(data.status)) {
            if (user.role !== "admin" || data.status !== "banned") {
                updateData.status = data.status;
            }
        }
        
        let finalBalance = Number(user.balance || 0);

        if (data.balance !== undefined) {
            const newBalance = parseInt(data.balance, 10);
            if (!isNaN(newBalance) && newBalance >= 0 && newBalance !== Number(user.balance || 0)) {
                const diff = newBalance - Number(user.balance || 0);
                const type = diff > 0 ? "credit" : "debit";
                const amount = Math.abs(diff);

                await UserService.updateBalance(userId, amount, type, "Admin điều chỉnh số dư");
                finalBalance = newBalance;
            }
        }

        if (Object.keys(updateData).length > 0) {
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId));
        }

        return { 
            success: true, 
            message: "Cập nhật thông tin thành công", 
            user: { ...user, ...updateData, balance: finalBalance } 
        };
    }
};

module.exports = UserService;
