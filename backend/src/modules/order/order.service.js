const { db } = require("../../configs/drizzle");
const { orders, users, topupPackages, games, balanceHistory } = require("../../db/schema");
const { eq, like, or, sql, desc, aliasedTable, inArray } = require("drizzle-orm");
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
            quantity: orders.quantity,
            updated_at: orders.updated_at,
            created_at: orders.created_at,
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
        joins: (queryBuilder) => queryBuilder
            .innerJoin(users, eq(orders.user_id, users.id))
            .leftJoin(usersNap, eq(orders.user_id_nap, usersNap.id))
            .leftJoin(topupPackages, eq(orders.package_id, topupPackages.id))
            .leftJoin(games, eq(topupPackages.game_id, games.id))
    };
};

const getAffectedRows = (result) => {
    if (!result) return 0;
    if (typeof result.affectedRows === "number") return result.affectedRows;
    if (Array.isArray(result)) {
        if (typeof result[0]?.affectedRows === "number") return result[0].affectedRows;
        if (typeof result[0]?.rowsAffected === "number") return result[0].rowsAffected;
    }
    return 0;
};

const refundOrderBalance = async (tx, userId, amount, description) => {
    const refundAmount = Number(amount);
    const updateResult = await tx.execute(sql`
        UPDATE users
        SET balance = balance + ${refundAmount}
        WHERE id = ${userId}
    `);

    if (getAffectedRows(updateResult) === 0) {
        throw { status: 404, message: "KhÃ´ng tÃ¬m tháº¥y user Ä‘á»ƒ hoÃ n tiá»n" };
    }

    const [updatedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId));
    const balanceAfter = Number(updatedUser.balance || 0);
    const balanceBefore = balanceAfter - refundAmount;

    await tx.insert(balanceHistory).values({
        user_id: userId,
        amount: refundAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        type: "credit",
        description
    });

    return balanceAfter;
};

const OrderService = {
    createOrder: async (data) => {
        let createdOrder = null;
        const qty = Number(data.quantity || 1);

        if (!Number.isInteger(qty) || qty <= 0) {
            throw { status: 400, message: "Sá»‘ lÆ°á»£ng khÃ´ng há»£p lá»‡" };
        }

        await db.transaction(async (tx) => {
            const [user] = await tx.select({
                id: users.id,
                level: users.level
            }).from(users).where(eq(users.id, data.user_id));

            if (!user) {
                console.error(`[OrderService] User ${data.user_id} not found.`);
                throw { status: 404, message: "NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i" };
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
                throw { status: 404, message: "GÃ³i náº¡p khÃ´ng tá»“n táº¡i" };
            }

            let unitPrice = packageInfo.price;
            const level = user.level || 1;

            if (level === 2 && packageInfo.price_pro) unitPrice = packageInfo.price_pro;
            if (level === 3 && packageInfo.price_plus) unitPrice = packageInfo.price_plus;
            if (level === 1 && packageInfo.price_basic) unitPrice = packageInfo.price_basic;

            const finalPrice = Number(unitPrice) * qty;
            const originPrice = Number(packageInfo.origin_price || 0) * qty;
            const finalProfit = finalPrice - originPrice;
            const description = `Thanh toÃ¡n gÃ³i ${packageInfo.package_name} - ${packageInfo.game_name} (x${qty})`;

            const debitResult = await tx.execute(sql`
                UPDATE users
                SET balance = balance - ${finalPrice}
                WHERE id = ${data.user_id} AND balance >= ${finalPrice}
            `);

            if (getAffectedRows(debitResult) === 0) {
                const [balanceRow] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, data.user_id));
                const currentBalance = Number(balanceRow?.balance || 0);
                const missing = finalPrice - currentBalance;
                console.warn(`[OrderService] Insufficient Balance. User: ${currentBalance}, Need: ${finalPrice}`);
                throw {
                    status: 400,
                    message: `Sá»‘ dÆ° khÃ´ng Ä‘á»§! Hiá»‡n cÃ³: ${currentBalance.toLocaleString("vi-VN")}Ä‘. Cáº§n: ${finalPrice.toLocaleString("vi-VN")}Ä‘. Thiáº¿u: ${missing.toLocaleString("vi-VN")}Ä‘. Vui lÃ²ng náº¡p thÃªm!`
                };
            }

            const [updatedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, data.user_id));
            const balanceAfter = Number(updatedUser.balance || 0);
            const balanceBefore = balanceAfter + finalPrice;

            await tx.insert(balanceHistory).values({
                user_id: data.user_id,
                amount: -finalPrice,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                type: "debit",
                description
            });

            try {
                emitToUser(data.user_id, "balance_update", balanceAfter);
            } catch (socketError) {
                console.error("Failed to emit balance_update:", socketError);
            }

            const newOrder = {
                user_id: data.user_id,
                package_id: data.package_id,
                account_info: data.account_info,
                amount: finalPrice,
                profit: finalProfit,
                quantity: qty,
                status: "pending"
            };

            const insertResult = await tx.insert(orders).values(newOrder);
            const createdId = insertResult[0]?.insertId;

            if (!createdId) {
                throw { status: 500, message: "KhÃ´ng táº¡o Ä‘Æ°á»£c Ä‘Æ¡n hÃ ng" };
            }

            const [created] = await tx.select().from(orders).where(eq(orders.id, createdId));
            createdOrder = created || null;
        });

        if (createdOrder) {
            OrderService.processOrderExternal(createdOrder, data.package_id, data.account_info).catch((err) => {
                console.error(`[OrderService] Error in processOrderExternal for Order #${createdOrder.id}:`, err);
            });
        }

        return createdOrder;
    },

    failOrderAndRefund: async (orderId, reason = "NhÃ  cung cáº¥p xá»­ lÃ½ tháº¥t báº¡i") => {
        let order = null;
        let refundedBalance = null;

        await db.transaction(async (tx) => {
            const [currentOrder] = await tx.select().from(orders).where(eq(orders.id, orderId));
            if (!currentOrder) {
                throw { status: 404, message: "ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i" };
            }

            if (["cancelled", "failed", "success"].includes(currentOrder.status)) {
                order = currentOrder;
                return;
            }

            await tx.update(orders)
                .set({
                    status: "failed",
                    updated_at: new Date()
                })
                .where(eq(orders.id, orderId));

            refundedBalance = await refundOrderBalance(
                tx,
                currentOrder.user_id,
                currentOrder.amount,
                `HoÃ n tiá»n Ä‘Æ¡n hÃ ng #${orderId}: ${reason}`
            );

            const [updatedOrder] = await tx.select().from(orders).where(eq(orders.id, orderId));
            order = updatedOrder || currentOrder;
        });

        if (order) {
            emitToUser(order.user_id, "balance_update", refundedBalance);
            emitToUser(order.user_id, "order_status_update", {
                orderId,
                status: "failed",
                refundAmount: Number(order.amount),
                message: `ÄÆ¡n hÃ ng tháº¥t báº¡i vÃ  Ä‘Ã£ hoÃ n tiá»n. LÃ½ do: ${reason}`
            });
        }

        return order;
    },

    processOrderExternal: async (order, packageId, accountInfoData) => {
        const NguonAService = require("../nguona/nguona.service");

        try {
            const [pkg] = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId));
            if (!pkg) {
                console.error(`[OrderService] Package ${packageId} not found for Order #${order.id}`);
                await OrderService.failOrderAndRefund(order.id, "KhÃ´ng tÃ¬m tháº¥y gÃ³i náº¡p");
                return false;
            }

            const [game] = await db.select().from(games).where(eq(games.id, pkg.game_id));
            const apiSource = game?.api_source;

            let accountInfo = accountInfoData;
            if (typeof accountInfo === "string") {
                try {
                    accountInfo = JSON.parse(accountInfo);
                } catch (error) {
                    console.error("[OrderService] Failed to parse account_info JSON:", error);
                    accountInfo = {};
                }
            } else {
                accountInfo = accountInfo || {};
            }

            if (!accountInfoData && order.account_info) {
                accountInfo = typeof order.account_info === "string"
                    ? JSON.parse(order.account_info)
                    : order.account_info;
            }

            if (apiSource !== "nguona") {
                await OrderService.failOrderAndRefund(order.id, "Game chÆ°a cáº¥u hÃ¬nh API nhÃ  cung cáº¥p");
                return false;
            }

            const extPkgId = pkg?.api_id;
            const qty = order.quantity || 1;

            if (!extPkgId) {
                await OrderService.failOrderAndRefund(order.id, "GÃ³i náº¡p chÆ°a map API nhÃ  cung cáº¥p");
                return false;
            }

            const res = await NguonAService.createOrder(order.id, extPkgId, accountInfo, qty);
            if (res && res.status === "success" && res.data && res.data.id) {
                await db.update(orders)
                    .set({
                        api_id: res.data.id,
                        status: "processing",
                        updated_at: new Date()
                    })
                    .where(eq(orders.id, order.id));
                return true;
            }

            console.error(`[OrderService] Order #${order.id} provider forward failed:`, res?.message || "Unknown error");
            await OrderService.failOrderAndRefund(order.id, res?.message || "NhÃ  cung cáº¥p tá»« chá»‘i Ä‘Æ¡n");
        } catch (err) {
            console.error("[OrderService] Error executing processOrderExternal:", err);
            await OrderService.failOrderAndRefund(order.id, err?.message || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh tá»« nhÃ  cung cáº¥p");
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
        statsResult.forEach((row) => {
            stats[row.status] = Number(row.count);
        });

        return { orders: data, stats, total: Number(total.count) };
    },

    getOrdersByStatus: async (status, page = 1) => {
        const limit = 10;
        const offset = (page - 1) * limit;
        const base = buildOrderQuery();

        const condition = status === "failed_cancelled"
            ? inArray(orders.status, ["failed", "cancelled"])
            : eq(orders.status, status);

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
        if (!order) throw { status: 404, message: "ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i" };

        await db.update(orders)
            .set({
                status: "processing",
                user_id_nap: adminId,
                updated_at: new Date()
            })
            .where(eq(orders.id, id));

        return OrderService.getOrderById(id);
    },

    changeOrderStatus: async (id, status) => {
        await db.update(orders)
            .set({ status, updated_at: new Date() })
            .where(eq(orders.id, id));

        const base = buildOrderQuery();
        const [updated] = await base.joins(db.select(base.selection).from(base.from)).where(eq(orders.id, id));
        return updated;
    },

    cancelOrderIfPending: async (id, userId) => {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        if (!order) throw { status: 404, message: "Not found" };
        if (order.user_id !== userId) throw { status: 403, message: "Unauthorized" };
        if (order.status !== "pending") throw { status: 400, message: "Cannot cancel non-pending order" };

        await db.update(orders).set({ status: "cancelled", updated_at: new Date() }).where(eq(orders.id, id));
        await UserService.updateBalance(userId, order.amount, "credit", `HoÃ n tiá»n Ä‘Æ¡n hÃ ng #${id}`);
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
                message: "ÄÆ¡n hÃ ng Ä‘Ã£ hoÃ n thÃ nh!"
            });
        } catch (socketError) {
            console.error("Failed to emit socket:", socketError);
        }

        if (updatedOrder?.user_email) {
            try {
                await sendOrderSuccessEmail(updatedOrder.user_email, updatedOrder);
            } catch (emailError) {
                console.error("Failed to send order success email:", emailError);
            }
        }

        return updatedOrder;
    },

    cancelOrderAndRefund: async (id) => {
        const order = await OrderService.getOrderById(id);
        if (!order) throw { status: 404, message: "ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i" };
        if (["cancelled", "failed"].includes(order.status)) {
            return { message: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c hoÃ n tiá»n trÆ°á»›c Ä‘Ã³", refundAmount: Number(order.amount) };
        }
        if (order.status === "success") {
            throw { status: 400, message: "KhÃ´ng thá»ƒ hoÃ n tiá»n Ä‘Æ¡n Ä‘Ã£ thÃ nh cÃ´ng" };
        }

        let refundAmount = 0;

        await db.transaction(async (tx) => {
            await tx.update(orders)
                .set({ status: "cancelled", updated_at: new Date() })
                .where(eq(orders.id, id));

            refundAmount = Number(order.amount);
            await refundOrderBalance(tx, order.user_id, refundAmount, `HoÃ n tiá»n Ä‘Æ¡n hÃ ng #${id}`);
        });

        try {
            emitToUser(order.user_id, "order_status_update", {
                orderId: id,
                status: "cancelled",
                packageName: order.package_name,
                refundAmount,
                message: "ÄÆ¡n hÃ ng Ä‘Ã£ bá»‹ há»§y vÃ  hoÃ n tiá»n!"
            });
        } catch (socketError) {
            console.error("Failed to emit socket:", socketError);
        }

        if (order.user_email) {
            try {
                await sendOrderFailureEmail(order.user_email, order, "ÄÆ¡n hÃ ng Ä‘Ã£ bá»‹ há»§y vÃ  hoÃ n tiá»n");
            } catch (emailError) {
                console.error("Failed to send order failure email:", emailError);
            }
        }

        return { message: "Cancelled and refunded", refundAmount };
    },

    getUserFinancialSummary: async (userId) => {
        const [result] = await db.execute(sql`
            SELECT
                (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ${userId} AND status = 'success') AS tong_tieu,
                (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ${userId} AND status = 'success' AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS tong_tieu_thang,
                (SELECT COALESCE(SUM(amount), 0) FROM topup_wallet_logs WHERE user_id = ${userId} AND status = 'ThÃ nh CÃ´ng') AS tong_nap,
                (SELECT COALESCE(SUM(amount), 0) FROM topup_wallet_logs WHERE user_id = ${userId} AND status = 'ThÃ nh CÃ´ng' AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS tong_nap_thang
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
            last_30_days: last30Days[0].map((row) => ({
                date: row.date,
                total_cost: Number(row.total_cost)
            }))
        };
    },

    getMyNapOrdersStats: async (userIdNap) => {
        return db.select({
            status: orders.status,
            total: sql`COUNT(*)`
        }).from(orders).where(eq(orders.user_id_nap, userIdNap)).groupBy(orders.status);
    }
};

OrderService.getCostStats = OrderService.getCostSummary;

module.exports = OrderService;
