const { db } = require("../../configs/drizzle");
const { walletLogs, users } = require("../../db/schema");
const { eq, gte, lte, and, sql, desc, like } = require("drizzle-orm");
const crypto = require("crypto");
const UserService = require("../user/user.service");

const WalletLogService = {
    getTongTienTrongKhoang: async (userId, from, to) => {
        let conditions = [eq(walletLogs.status, 'Thành Công')];

        if (userId) conditions.push(eq(walletLogs.user_id, userId));
        if (from) conditions.push(gte(walletLogs.created_at, new Date(from)));
        if (to) conditions.push(lte(walletLogs.created_at, new Date(to)));

        const [result] = await db.select({
            total: sql`COALESCE(SUM(${walletLogs.amount}), 0)`
        })
            .from(walletLogs)
            .where(and(...conditions));

        return {
            total_amount: Number(result.total)
        };
    },

    getWalletLog: async (page = 1, search = "") => {
        const limit = 10;
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = like(users.email, `%${search}%`);
        }

        const data = await db.select({
            id: walletLogs.id,
            user_id: walletLogs.user_id,
            amount: walletLogs.amount,
            status: walletLogs.status,
            created_at: walletLogs.created_at,
            update_at: walletLogs.updated_at,
            email: users.email,
            name_user: users.name
        })
            .from(walletLogs)
            .leftJoin(users, eq(walletLogs.user_id, users.id))
            .where(whereClause)
            .orderBy(desc(walletLogs.created_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(walletLogs)
            .leftJoin(users, eq(walletLogs.user_id, users.id))
            .where(whereClause);

        return {
            status: true,
            data: data,
            totalItem: total.count
        };
    },

    getWalletLogStatusDone: async (page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;

        const data = await db.select({
            id: walletLogs.id,
            user_id: walletLogs.user_id,
            amount: walletLogs.amount,
            status: walletLogs.status,
            created_at: walletLogs.created_at,
            update_at: walletLogs.updated_at,
            name_user: users.name,
            email: users.email
        })
            .from(walletLogs)
            .leftJoin(users, eq(walletLogs.user_id, users.id))
            .where(eq(walletLogs.status, 'Thành Công'))
            .orderBy(desc(walletLogs.created_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(walletLogs)
            .where(eq(walletLogs.status, 'Thành Công'));

        return {
            status: true,
            data: data,
            totalLog: total.count
        };
    },

    getPendingLogs: async (page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;

        const statusValues = ['Đang Chờ', 'pending', 'wait'];

        const data = await db.select({
            id: walletLogs.id,
            user_id: walletLogs.user_id,
            amount: walletLogs.amount,
            status: walletLogs.status,
            created_at: walletLogs.created_at,
            update_at: walletLogs.updated_at,
            name_user: users.name,
            email: users.email
        })
            .from(walletLogs)
            .leftJoin(users, eq(walletLogs.user_id, users.id))
            .where(sql`${walletLogs.status} IN ('Đang Chờ', 'pending', 'wait')`)
            .orderBy(desc(walletLogs.created_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(walletLogs)
            .where(sql`${walletLogs.status} IN ('Đang Chờ', 'pending', 'wait')`);

        return {
            status: true,
            data: data,
            totalItem: total.count
        };
    },

    getTongSoTienDaNap: async (userId) => {
        let conditions = [eq(walletLogs.status, 'Thành Công')];
        if (userId) conditions.push(eq(walletLogs.user_id, userId));

        const [result] = await db.select({
            total: sql`COALESCE(SUM(${walletLogs.amount}), 0)`
        })
            .from(walletLogs)
            .where(and(...conditions));

        return {
            total_amount: Number(result.total)
        };
    },

    manualChargeBalance: async (id, newStatus) => {
        const [log] = await db.select().from(walletLogs).where(eq(walletLogs.id, id));
        if (!log) throw { status: 404, message: "Không tìm thấy giao dịch" };

        if (log.status === 'Thành Công' || log.status === 'Thất Bại' || log.status === 'Đã Hủy') {
            throw { status: 400, message: "Giao dịch đã kết thúc, không thể thay đổi trạng thái" };
        }

        await db.update(walletLogs)
            .set({
                status: newStatus,
                updated_at: new Date()
            })
            .where(eq(walletLogs.id, id));

        if (newStatus === "Thành Công") {
            await UserService.updateBalance(log.user_id, log.amount, "credit");
        }

        return { message: "Cập nhật trạng thái thành công" };
    },

    cancelWalletLog: async (id, userId) => {
        const [log] = await db.select().from(walletLogs).where(eq(walletLogs.id, id));
        if (!log) throw { status: 404, message: "Không tìm thấy giao dịch" };

        if (log.user_id !== userId) throw { status: 403, message: "Không có quyền hủy giao dịch này" };

        if (log.status !== 'pending' && log.status !== 'Chờ thanh toán') {
            throw { status: 400, message: "Chỉ có thể hủy giao dịch đang chờ" };
        }

        await db.update(walletLogs)
            .set({ status: 'Đã Hủy' })
            .where(eq(walletLogs.id, id));

        return { message: "Hủy giao dịch thành công" };
    },

    getLogsByUser: async (userId, page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;

        const data = await db.select()
            .from(walletLogs)
            .where(eq(walletLogs.user_id, userId))
            .orderBy(desc(walletLogs.created_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(walletLogs)
            .where(eq(walletLogs.user_id, userId));

        return {
            status: true,
            data: data,
            totalLog: total.count,
            totalPages: Math.ceil(total.count / limit)
        };
    },

    autoCheckExpiredTransactions: async () => {
        try {
            const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

            // Log for debugging

            const result = await db.update(walletLogs)
                .set({
                    status: 'Thất Bại',
                    updated_at: new Date()
                })
                .where(
                    and(
                        sql`${walletLogs.status} IN ('Đang Chờ', 'pending', 'wait')`,
                        lte(walletLogs.created_at, twentyMinutesAgo)
                    )
                );

            return result;
        } catch (error) {
            console.error("Error auto-expiring transactions:", error);
        }
    }
};

module.exports = WalletLogService;