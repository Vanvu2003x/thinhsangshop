const { db } = require("../../configs/drizzle");
const { orders, users, topupPackages, games, walletLogs, balanceHistory } = require("../../db/schema");
const { eq, like, or, and, sql, desc, aliasedTable, inArray } = require("drizzle-orm");
const UserService = require("../user/user.service");
const { sendOrderSuccessEmail, sendOrderFailureEmail } = require("../../services/nodemailer.service");
const { emitToUser } = require("../../sockets/websocket");

const buildOrderQuery = () => {

    const usersNap = aliasedTable(users, "user_nap");

    return {
        selection: {
            id: orders.id,
            user_id: orders.user_id,
            user_email: users.email,
            user_name: users.name,
            user_nap_email: usersNap.email,
            user_nap_name: usersNap.name,
            status: orders.status,
            account_info: orders.account_info,
            amount: orders.amount,
            update_at: orders.updated_at,
            create_at: orders.created_at,
            package_name: topupPackages.package_name,
            thumbnail: topupPackages.thumbnail,
            package_type: topupPackages.package_type,
            game_name: games.name,
            game_image: games.thumbnail,
            profit: orders.profit
        },
        from: orders,
        joins: (queryBuilder) => {
            return queryBuilder
                .innerJoin(users, eq(orders.user_id, users.id))
                .leftJoin(usersNap, eq(orders.user_id_nap, usersNap.id))
                .leftJoin(topupPackages, eq(orders.package_id, topupPackages.id))
                .leftJoin(games, eq(topupPackages.game_id, games.id));
        }
    };
};

const OrderService = {
    createOrder: async (data) => {
        let createdOrder = null;
        let packageDetails = null;
        const qty = data.quantity || 1;

        await db.transaction(async (tx) => {

            const [user] = await tx.select({
                id: users.id,
                balance: users.balance,
                level: users.level
            }).from(users).where(eq(users.id, data.user_id));

            if (!user) {
                console.error(`[OrderService] User ${data.user_id} not found.`);
                throw { status: 404, message: 'Người dùng không tồn tại' };
            }

            const [packageInfo] = await tx
                .select({
                    id: topupPackages.id,
                    package_name: topupPackages.package_name,
                    price: topupPackages.price,
                    origin_price: topupPackages.origin_price,
                    price_basic: topupPackages.price_basic,
                    price_pro: topupPackages.price_pro,
                    price_plus: topupPackages.price_plus,
                    game_name: games.name,
                    game_code: games.gamecode,
                    game_id: games.id,
                    fileAPI: topupPackages.fileAPI,
                    input_fields: games.input_fields
                })
                .from(topupPackages)
                .innerJoin(games, eq(topupPackages.game_id, games.id))
                .where(eq(topupPackages.id, data.package_id));

            if (!packageInfo) {
                console.error(`[OrderService] Package ${data.package_id} not found.`);
                throw { status: 404, message: 'Gói nạp không tồn tại' };
            }

            packageDetails = packageInfo;

            let unitPrice = packageInfo.price;
            const level = user.level || 1;

            if (level === 2 && packageInfo.price_pro) unitPrice = packageInfo.price_pro;
            if (level === 3 && packageInfo.price_plus) unitPrice = packageInfo.price_plus;

            if (level === 1 && packageInfo.price_basic) unitPrice = packageInfo.price_basic;

            const finalPrice = unitPrice * qty;

            if (Number(user.balance) < finalPrice) {
                const missing = finalPrice - Number(user.balance);
                console.warn(`[OrderService] Insufficient Balance. User: ${user.balance}, Need: ${finalPrice}`);
                throw {
                    status: 400,
                    message: `Số dư không đủ! Hiện có: ${Number(user.balance).toLocaleString('vi-VN')}đ. Cần: ${finalPrice.toLocaleString('vi-VN')}đ. Thiếu: ${missing.toLocaleString('vi-VN')}đ. Vui lòng nạp thêm!`
                };
            }

            const originPrice = (packageInfo.origin_price || 0) * qty;
            const finalProfit = finalPrice - originPrice;

            const description = `Thanh toán gói ${packageInfo.package_name} - ${packageInfo.game_name} (x${qty})`;

            const balanceBefore = Number(user.balance);
            const balanceAfter = balanceBefore - finalPrice;

            await tx.update(users)
                .set({ balance: balanceAfter })
                .where(eq(users.id, data.user_id));

            await tx.insert(balanceHistory).values({
                user_id: data.user_id,
                amount: -finalPrice,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                type: "debit",
                description: description
            });

            try {
                emitToUser(data.user_id, "balance_update", balanceAfter);
            } catch (socketError) {
                console.error("❌ Failed to emit balance_update:", socketError);
            }

            const newOrder = {
                user_id: data.user_id,
                package_id: data.package_id,
                account_info: data.account_info,
                amount: finalPrice,
                profit: finalProfit,
                quantity: qty,
                status: 'pending'
            };

            await tx.insert(orders).values(newOrder);

            const [created] = await tx.select().from(orders).orderBy(desc(orders.id)).limit(1);
            createdOrder = created;
        });

        if (createdOrder) {

            OrderService.processOrderExternal(createdOrder, data.package_id, data.account_info).catch(err => {
                console.error(`[OrderService] Error in processOrderExternal for Order #${createdOrder.id}:`, err);
            });
        }

        return createdOrder;
    },

    processOrderExternal: async (order, packageId, accountInfoData) => {

        const NguonAService = require("../nguona/nguona.service");
        const { topupPackages, games, orders } = require("../../db/schema");

        try {

            const [pkg] = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId));
            if (!pkg) {
                console.error(`[OrderService] Package ${packageId} not found for Order #${order.id}`);
                return;
            }
            const [game] = await db.select().from(games).where(eq(games.id, pkg.game_id));

            const apiSource = game?.api_source;
            const fileAPI = pkg?.fileAPI || {};

            let accountInfo = accountInfoData;

            if (typeof accountInfo === 'string') {
                try {
                    accountInfo = JSON.parse(accountInfo);
                } catch (e) {
                    console.error("[OrderService] Failed to parse account_info JSON:", e);
                    accountInfo = {};
                }
            } else {
                accountInfo = accountInfo || {};
            }

            if (!accountInfoData && order.account_info) {
                if (typeof order.account_info === 'string') {
                    try {
                        accountInfo = JSON.parse(order.account_info);
                    } catch (e) {
                        accountInfo = {};
                    }
                } else {
                    accountInfo = order.account_info;
                }
            }

            if (apiSource === 'nguona') {
                const extPkgId = pkg?.api_id;
                const qty = order.quantity || 1;

                if (extPkgId) {
                    const res = await NguonAService.createOrder(order.id, extPkgId, accountInfo, qty);

                    if (res && res.status === 'success' && res.data && res.data.id) {
                        await db.update(orders)
                            .set({
                                api_id: res.data.id,
                                status: 'processing',
                                updated_at: new Date()
                            })
                            .where(eq(orders.id, order.id));
                        return true;
                    } else {
                        console.error(`[OrderService] Order #${order.id} provider forward failed:`, res?.message || "Unknown error");
                    }
                } else {
                }

            } else {
            }

        } catch (err) {
            console.error("[OrderService] Error executing processOrderExternal:", err);
        }
        return false;
    },

    getAllOrders: async (page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;

        const base = buildOrderQuery();

        const data = await base.joins(
            db.select(base.selection).from(base.from)
        )
            .orderBy(desc(orders.updated_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` }).from(orders);

        const statsResult = await db.select({
            status: orders.status,
            count: sql`COUNT(*)`
        }).from(orders).groupBy(orders.status);

        const stats = { pending: 0, processing: 0, success: 0, cancelled: 0, failed: 0 };
        statsResult.forEach(row => { stats[row.status] = Number(row.count); });

        return { orders: data, stats, total: Number(total.count) };
    },

    getOrdersByStatus: async (status, page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;
        const base = buildOrderQuery();

        let condition;
        if (status === 'failed_cancelled') {
            condition = inArray(orders.status, ['failed', 'cancelled']);
        } else {
            condition = eq(orders.status, status);
        }

        const data = await base.joins(
            db.select(base.selection).from(base.from)
        )
            .where(condition)
            .orderBy(desc(orders.updated_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(condition);

        return { orders: data, total: Number(total.count) };
    },

    getOrdersByUserId: async (userId, page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;
        const base = buildOrderQuery();

        const data = await base.joins(
            db.select(base.selection).from(base.from)
        )
            .where(eq(orders.user_id, userId))
            .orderBy(desc(orders.updated_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(eq(orders.user_id, userId));

        return { orders: data, total: Number(total.count) };
    },

    searchOrders: async (keyword, page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;
        const base = buildOrderQuery();

        const usersNap = aliasedTable(users, "user_nap");

        const searchTerm = `%${keyword}%`;
        const searchCondition = or(
            sql`CAST(${orders.id} AS CHAR) LIKE ${searchTerm}`,
            like(users.email, searchTerm),
            like(usersNap.email, searchTerm),
            like(topupPackages.package_name, searchTerm),
            like(games.name, searchTerm)
        );

        const data = await db.select(base.selection)
            .from(orders)
            .innerJoin(users, eq(orders.user_id, users.id))
            .leftJoin(usersNap, eq(orders.user_id_nap, usersNap.id))
            .leftJoin(topupPackages, eq(orders.package_id, topupPackages.id))
            .leftJoin(games, eq(topupPackages.game_id, games.id))
            .where(searchCondition)
            .orderBy(desc(orders.updated_at))
            .limit(limit)
            .offset(offset);

        const [total] = await db.select({ count: sql`COUNT(*)` })
            .from(orders)
            .innerJoin(users, eq(orders.user_id, users.id))
            .leftJoin(usersNap, eq(orders.user_id_nap, usersNap.id))
            .leftJoin(topupPackages, eq(orders.package_id, topupPackages.id))
            .leftJoin(games, eq(topupPackages.game_id, games.id))
            .where(searchCondition);

        return { orders: data, total: Number(total.count) };
    },

    getOrderById: async (id) => {
        const base = buildOrderQuery();
        const [order] = await base.joins(
            db.select(base.selection).from(base.from)
        ).where(eq(orders.id, id));
        return order;
    },

    getTransactionHistory: async (userId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;

        const transactions = await db
            .select()
            .from(balanceHistory)
            .where(eq(balanceHistory.user_id, userId))
            .orderBy(desc(balanceHistory.created_at))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql`COUNT(*)` })
            .from(balanceHistory)
            .where(eq(balanceHistory.user_id, userId));

        const total = Number(countResult.count);

        return {
            transactions,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    acceptOrder: async (id, adminId) => {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        if (!order) throw { status: 404, message: 'Đơn hàng không tồn tại' };

        await db.update(orders)
            .set({
                status: 'processing',
                user_id_nap: adminId,
                updated_at: new Date()
            })
            .where(eq(orders.id, id));

        return await OrderService.getOrderById(id);
    },

    changeOrderStatus: async (id, status) => {
        await db.update(orders)
            .set({ status: status, updated_at: new Date() })
            .where(eq(orders.id, id));

        const base = buildOrderQuery();
        const [updated] = await base.joins(db.select(base.selection).from(base.from)).where(eq(orders.id, id));
        return updated;
    },

    cancelOrderIfPending: async (id, userId) => {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        if (!order) throw { status: 404, message: 'Not found' };
        if (order.user_id !== userId) throw { status: 403, message: 'Unauthorized' };
        if (order.status !== 'pending') throw { status: 400, message: 'Cannot cancel non-pending order' };

        await db.update(orders).set({ status: 'cancelled', updated_at: new Date() }).where(eq(orders.id, id));

        // Refund
        await UserService.updateBalance(userId, order.amount, 'credit', `Hoàn tiền đơn hàng #${id}`);
        return { message: "Cancelled and refunded" };
    },

    completeOrder: async (id) => {
        const updatedOrder = await OrderService.changeOrderStatus(id, "success");

        try {
            emitToUser(updatedOrder.user_id, "order_status_update", {
                orderId: id,
                status: "success",
                packageName: updatedOrder.package_name,
                amount: updatedOrder.amount,
                message: "🎉 Đơn hàng đã hoàn thành!"
            });
        } catch (socketError) {
            console.error('Failed to emit socket:', socketError);
        }

        if (updatedOrder && updatedOrder.user_email) {
            try {
                await sendOrderSuccessEmail(updatedOrder.user_email, updatedOrder);
            } catch (emailError) {
                console.error('Failed to send order success email:', emailError);
            }
        }

        return updatedOrder;
    },

    cancelOrderAndRefund: async (id) => {
        const order = await OrderService.getOrderById(id);
        if (!order) throw { status: 404, message: "Đơn hàng không tồn tại" };

        await db.update(orders).set({ status: 'cancelled', updated_at: new Date() }).where(eq(orders.id, id));

        const refundAmount = Number(order.amount);
        await UserService.updateBalance(order.user_id, refundAmount, 'credit', `Hoàn tiền đơn hàng #${id}`);

        try {
            emitToUser(order.user_id, "order_status_update", {
                orderId: id,
                status: "cancelled",
                packageName: order.package_name,
                refundAmount: refundAmount,
                message: "⚠️ Đơn hàng đã bị hủy và hoàn tiền!"
            });
        } catch (socketError) {
            console.error('Failed to emit socket:', socketError);
        }

        if (order && order.user_email) {
            try {
                await sendOrderFailureEmail(order.user_email, order, "Đơn hàng đã bị hủy và hoàn tiền");
            } catch (emailError) {
                console.error('Failed to send order failure email:', emailError);
            }
        }

        return { message: "Cancelled and refunded", refundAmount };
    },

    getUserFinancialSummary: async (userId) => {
        const [result] = await db.execute(sql`
           SELECT
             (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ${userId} AND status = 'success') AS tong_tieu,
             (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ${userId} AND status = 'success' AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS tong_tieu_thang,
             (SELECT COALESCE(SUM(amount), 0) FROM topup_wallet_logs WHERE user_id = ${userId} AND status = 'Thành Công') AS tong_nap,
             (SELECT COALESCE(SUM(amount), 0) FROM topup_wallet_logs WHERE user_id = ${userId} AND status = 'Thành Công' AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS tong_nap_thang
        `);
        return result[0];
    },

    getCostSummary: async () => {
        const [result] = await db.execute(sql`
             SELECT
              (SELECT COALESCE(SUM(amount - profit), 0) FROM orders WHERE status = 'success') AS total_cost,
              (SELECT COALESCE(SUM(amount - profit), 0) FROM orders WHERE status = 'success' AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS total_cost_this_month,
              (SELECT COALESCE(SUM(amount - profit), 0) FROM orders WHERE status = 'success' AND DATE(updated_at) = CURRENT_DATE) AS total_cost_today
         `);

        const last30Days = await db.execute(sql`
            SELECT
                DATE(updated_at) as date,
                COALESCE(SUM(amount - profit), 0) as total_cost
            FROM orders
            WHERE status = 'success'
                AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(updated_at)
            ORDER BY date ASC
        `);

        return {
            status: true,
            total_cost: Number(result[0].total_cost),
            total_cost_this_month: Number(result[0].total_cost_this_month),
            total_cost_today: Number(result[0].total_cost_today),
            last_30_days: last30Days[0].map(row => ({
                date: row.date,
                total_cost: Number(row.total_cost)
            }))
        };
    },

    getMyNapOrdersStats: async (userIdNap) => {
        const result = await db.select({
            status: orders.status,
            total: sql`COUNT(*)`
        }).from(orders).where(eq(orders.user_id_nap, userIdNap)).groupBy(orders.status);
        return result;
    }
};

OrderService.getCostStats = OrderService.getCostSummary;

module.exports = OrderService;