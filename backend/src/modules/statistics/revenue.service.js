const { db } = require("../../configs/drizzle");
const { sql } = require("drizzle-orm");

const SUCCESS_WALLET_STATUS = "Thành Công";
const SUCCESS_ORDER_STATUS = "success";

const toNumber = (value) => Number(value || 0);

const formatDateKey = (value) => {
    if (!value) return "";

    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, "0");
        const day = `${value.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
};

const formatMonthKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    return `${year}-${month}`;
};

const makeDailyLabel = (dateKey) => {
    const [, month = "", day = ""] = dateKey.split("-");
    return `${day}/${month}`;
};

const makeMonthLabel = (monthKey) => {
    const [year = "", month = ""] = monthKey.split("-");
    return `${month}/${year.slice(2)}`;
};

const buildSnapshot = (row, extra = {}) => {
    const customerSpent = toNumber(row.customer_spent);
    const cost = toNumber(row.cost);
    const profit = toNumber(row.profit);

    return {
        customer_deposit: toNumber(row.customer_deposit),
        customer_spent: customerSpent,
        cost,
        profit,
        margin_percent: customerSpent > 0 ? (profit / customerSpent) * 100 : 0,
        success_order_count: toNumber(row.success_order_count),
        ...extra
    };
};

const buildDailySeries = (walletRows, orderRows, days = 30) => {
    const walletMap = new Map(
        walletRows.map((row) => [
            formatDateKey(row.date),
            {
                customer_deposit: toNumber(row.customer_deposit)
            }
        ])
    );

    const orderMap = new Map(
        orderRows.map((row) => [
            formatDateKey(row.date),
            {
                customer_spent: toNumber(row.customer_spent),
                cost: toNumber(row.cost),
                profit: toNumber(row.profit)
            }
        ])
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: days }, (_, index) => {
        const pointDate = new Date(today);
        pointDate.setDate(today.getDate() - (days - index - 1));

        const dateKey = formatDateKey(pointDate);
        const walletPoint = walletMap.get(dateKey) || {};
        const orderPoint = orderMap.get(dateKey) || {};
        const customerSpent = toNumber(orderPoint.customer_spent);
        const profit = toNumber(orderPoint.profit);

        return {
            date: dateKey,
            label: makeDailyLabel(dateKey),
            customer_deposit: toNumber(walletPoint.customer_deposit),
            customer_spent: customerSpent,
            cost: toNumber(orderPoint.cost),
            profit,
            margin_percent: customerSpent > 0 ? (profit / customerSpent) * 100 : 0
        };
    });
};

const buildMonthlySeries = (walletRows, orderRows, months = 6) => {
    const walletMap = new Map(
        walletRows.map((row) => [
            String(row.month_key),
            {
                customer_deposit: toNumber(row.customer_deposit)
            }
        ])
    );

    const orderMap = new Map(
        orderRows.map((row) => [
            String(row.month_key),
            {
                customer_spent: toNumber(row.customer_spent),
                cost: toNumber(row.cost),
                profit: toNumber(row.profit)
            }
        ])
    );

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    return Array.from({ length: months }, (_, index) => {
        const pointDate = new Date(currentMonth);
        pointDate.setMonth(currentMonth.getMonth() - (months - index - 1));

        const monthKey = formatMonthKey(pointDate);
        const walletPoint = walletMap.get(monthKey) || {};
        const orderPoint = orderMap.get(monthKey) || {};
        const customerSpent = toNumber(orderPoint.customer_spent);
        const profit = toNumber(orderPoint.profit);

        return {
            month: monthKey,
            label: makeMonthLabel(monthKey),
            customer_deposit: toNumber(walletPoint.customer_deposit),
            customer_spent: customerSpent,
            cost: toNumber(orderPoint.cost),
            profit,
            margin_percent: customerSpent > 0 ? (profit / customerSpent) * 100 : 0
        };
    });
};

const buildWeeklySeries = (dailySeries, weeks = 12) => {
    const grouped = new Map();

    for (const point of dailySeries) {
        const date = new Date(`${point.date}T00:00:00`);
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekKey = formatDateKey(weekStart);
        const current = grouped.get(weekKey) || {
            week: weekKey,
            label: `Tuần ${weekKey.slice(8, 10)}/${weekKey.slice(5, 7)}`,
            customer_deposit: 0,
            customer_spent: 0,
            cost: 0,
            profit: 0
        };

        current.customer_deposit += toNumber(point.customer_deposit);
        current.customer_spent += toNumber(point.customer_spent);
        current.cost += toNumber(point.cost);
        current.profit += toNumber(point.profit);
        grouped.set(weekKey, current);
    }

    return Array.from(grouped.values())
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-weeks)
        .map((item) => ({
            ...item,
            margin_percent: item.customer_spent > 0 ? (item.profit / item.customer_spent) * 100 : 0
        }));
};

const fetchFinanceSnapshots = async () => {
    const [overallRows] = await db.execute(sql`
        SELECT
            COALESCE((SELECT SUM(amount) FROM topup_wallet_logs WHERE status = ${SUCCESS_WALLET_STATUS}), 0) AS customer_deposit,
            COALESCE((SELECT SUM(amount) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS}), 0) AS customer_spent,
            COALESCE((SELECT SUM(amount - profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS}), 0) AS cost,
            COALESCE((SELECT SUM(profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS}), 0) AS profit,
            COALESCE((SELECT COUNT(*) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS}), 0) AS success_order_count,
            COALESCE((SELECT SUM(balance) FROM users WHERE role = 'user'), 0) AS wallet_balance
    `);

    const [periodRows] = await db.execute(sql`
        SELECT
            COALESCE((SELECT SUM(amount) FROM topup_wallet_logs WHERE status = ${SUCCESS_WALLET_STATUS} AND DATE(IFNULL(updated_at, created_at)) = CURDATE()), 0) AS today_customer_deposit,
            COALESCE((SELECT SUM(amount) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE(IFNULL(updated_at, created_at)) = CURDATE()), 0) AS today_customer_spent,
            COALESCE((SELECT SUM(amount - profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE(IFNULL(updated_at, created_at)) = CURDATE()), 0) AS today_cost,
            COALESCE((SELECT SUM(profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE(IFNULL(updated_at, created_at)) = CURDATE()), 0) AS today_profit,
            COALESCE((SELECT COUNT(*) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE(IFNULL(updated_at, created_at)) = CURDATE()), 0) AS today_success_order_count,
            COALESCE((SELECT SUM(amount) FROM topup_wallet_logs WHERE status = ${SUCCESS_WALLET_STATUS} AND DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')), 0) AS month_customer_deposit,
            COALESCE((SELECT SUM(amount) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')), 0) AS month_customer_spent,
            COALESCE((SELECT SUM(amount - profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')), 0) AS month_cost,
            COALESCE((SELECT SUM(profit) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')), 0) AS month_profit,
            COALESCE((SELECT COUNT(*) FROM orders WHERE status = ${SUCCESS_ORDER_STATUS} AND DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')), 0) AS month_success_order_count
    `);

    return {
        overall: overallRows[0],
        period: periodRows[0]
    };
};

const fetchDailyChartRows = async () => {
    const [walletDailyRows] = await db.execute(sql`
        SELECT
            DATE(IFNULL(updated_at, created_at)) AS date,
            COALESCE(SUM(amount), 0) AS customer_deposit
        FROM topup_wallet_logs
        WHERE status = ${SUCCESS_WALLET_STATUS}
            AND DATE(IFNULL(updated_at, created_at)) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(IFNULL(updated_at, created_at))
        ORDER BY date ASC
    `);

    const [orderDailyRows] = await db.execute(sql`
        SELECT
            DATE(IFNULL(updated_at, created_at)) AS date,
            COALESCE(SUM(amount), 0) AS customer_spent,
            COALESCE(SUM(amount - profit), 0) AS cost,
            COALESCE(SUM(profit), 0) AS profit
        FROM orders
        WHERE status = ${SUCCESS_ORDER_STATUS}
            AND DATE(IFNULL(updated_at, created_at)) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(IFNULL(updated_at, created_at))
        ORDER BY date ASC
    `);

    return {
        walletDailyRows,
        orderDailyRows
    };
};

const fetchMonthlyChartRows = async () => {
    const [walletMonthlyRows] = await db.execute(sql`
        SELECT
            DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') AS month_key,
            COALESCE(SUM(amount), 0) AS customer_deposit
        FROM topup_wallet_logs
        WHERE status = ${SUCCESS_WALLET_STATUS}
            AND DATE(IFNULL(updated_at, created_at)) >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
        GROUP BY DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m')
        ORDER BY month_key ASC
    `);

    const [orderMonthlyRows] = await db.execute(sql`
        SELECT
            DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') AS month_key,
            COALESCE(SUM(amount), 0) AS customer_spent,
            COALESCE(SUM(amount - profit), 0) AS cost,
            COALESCE(SUM(profit), 0) AS profit
        FROM orders
        WHERE status = ${SUCCESS_ORDER_STATUS}
            AND DATE(IFNULL(updated_at, created_at)) >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
        GROUP BY DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m')
        ORDER BY month_key ASC
    `);

    return {
        walletMonthlyRows,
        orderMonthlyRows
    };
};

const RevenueService = {
    getRevenueStats: async () => {
        try {
            const { overall, period } = await fetchFinanceSnapshots();
            const { walletDailyRows, orderDailyRows } = await fetchDailyChartRows();

            return {
                status: true,
                total: buildSnapshot(overall, {
                    wallet_balance: toNumber(overall.wallet_balance)
                }),
                today: buildSnapshot({
                    customer_deposit: period.today_customer_deposit,
                    customer_spent: period.today_customer_spent,
                    cost: period.today_cost,
                    profit: period.today_profit,
                    success_order_count: period.today_success_order_count
                }),
                this_month: buildSnapshot({
                    customer_deposit: period.month_customer_deposit,
                    customer_spent: period.month_customer_spent,
                    cost: period.month_cost,
                    profit: period.month_profit,
                    success_order_count: period.month_success_order_count
                }),
                daily_chart: buildDailySeries(walletDailyRows, orderDailyRows, 30)
            };
        } catch (error) {
            console.error("Error in getRevenueStats:", error);
            throw error;
        }
    },

    getProfitMargins: async () => {
        try {
            const { overall, period } = await fetchFinanceSnapshots();

            return {
                status: true,
                total: {
                    revenue: toNumber(overall.customer_spent),
                    cost: toNumber(overall.cost),
                    profit: toNumber(overall.profit),
                    margin_percent: toNumber(overall.customer_spent) > 0
                        ? (toNumber(overall.profit) / toNumber(overall.customer_spent)) * 100
                        : 0
                },
                this_month: {
                    revenue: toNumber(period.month_customer_spent),
                    cost: toNumber(period.month_cost),
                    profit: toNumber(period.month_profit),
                    margin_percent: toNumber(period.month_customer_spent) > 0
                        ? (toNumber(period.month_profit) / toNumber(period.month_customer_spent)) * 100
                        : 0
                },
                today: {
                    revenue: toNumber(period.today_customer_spent),
                    cost: toNumber(period.today_cost),
                    profit: toNumber(period.today_profit),
                    margin_percent: toNumber(period.today_customer_spent) > 0
                        ? (toNumber(period.today_profit) / toNumber(period.today_customer_spent)) * 100
                        : 0
                }
            };
        } catch (error) {
            console.error("Error in getProfitMargins:", error);
            throw error;
        }
    },

    getGrowthRates: async () => {
        try {
            const [monthlyGrowthRows] = await db.execute(sql`
                SELECT
                    COALESCE(SUM(CASE
                        WHEN DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
                        THEN amount ELSE 0
                    END), 0) AS current_month,
                    COALESCE(SUM(CASE
                        WHEN DATE_FORMAT(IFNULL(updated_at, created_at), '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
                        THEN amount ELSE 0
                    END), 0) AS previous_month
                FROM orders
                WHERE status = ${SUCCESS_ORDER_STATUS}
            `);

            const [dailyGrowthRows] = await db.execute(sql`
                SELECT
                    COALESCE(SUM(CASE
                        WHEN DATE(IFNULL(updated_at, created_at)) = CURDATE()
                        THEN amount ELSE 0
                    END), 0) AS today,
                    COALESCE(SUM(CASE
                        WHEN DATE(IFNULL(updated_at, created_at)) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                        THEN amount ELSE 0
                    END), 0) AS yesterday
                FROM orders
                WHERE status = ${SUCCESS_ORDER_STATUS}
            `);

            const currentMonth = toNumber(monthlyGrowthRows[0].current_month);
            const previousMonth = toNumber(monthlyGrowthRows[0].previous_month);
            const today = toNumber(dailyGrowthRows[0].today);
            const yesterday = toNumber(dailyGrowthRows[0].yesterday);

            const monthlyGrowthRate = previousMonth > 0
                ? ((currentMonth - previousMonth) / previousMonth) * 100
                : (currentMonth > 0 ? 100 : 0);

            const dailyGrowthRate = yesterday > 0
                ? ((today - yesterday) / yesterday) * 100
                : (today > 0 ? 100 : 0);

            return {
                status: true,
                monthly: {
                    current: currentMonth,
                    previous: previousMonth,
                    growth_rate: monthlyGrowthRate,
                    trend: monthlyGrowthRate >= 0 ? "up" : "down"
                },
                daily: {
                    today,
                    yesterday,
                    growth_rate: dailyGrowthRate,
                    trend: dailyGrowthRate >= 0 ? "up" : "down"
                }
            };
        } catch (error) {
            console.error("Error in getGrowthRates:", error);
            throw error;
        }
    },

    getTopRevenueSources: async (limit = 10) => {
        try {
            const [topUsers] = await db.execute(sql`
                SELECT
                    u.id,
                    u.name AS username,
                    u.email,
                    COALESCE(SUM(o.amount), 0) AS total_spent,
                    COALESCE(SUM(o.profit), 0) AS total_profit,
                    COUNT(o.id) AS total_orders
                FROM users u
                INNER JOIN orders o ON u.id = o.user_id
                WHERE o.status = ${SUCCESS_ORDER_STATUS}
                GROUP BY u.id, u.name, u.email
                ORDER BY total_spent DESC
                LIMIT ${limit}
            `);

            return {
                status: true,
                data: topUsers.map((user) => ({
                    user_id: user.id,
                    username: user.username,
                    email: user.email,
                    total_spent: toNumber(user.total_spent),
                    total_profit: toNumber(user.total_profit),
                    total_orders: toNumber(user.total_orders)
                }))
            };
        } catch (error) {
            console.error("Error in getTopRevenueSources:", error);
            throw error;
        }
    },

    getRevenueByPeriod: async (period = "daily") => {
        try {
            const { walletDailyRows, orderDailyRows } = await fetchDailyChartRows();
            const { walletMonthlyRows, orderMonthlyRows } = await fetchMonthlyChartRows();

            const dailySeries = buildDailySeries(walletDailyRows, orderDailyRows, 30);
            const monthlySeries = buildMonthlySeries(walletMonthlyRows, orderMonthlyRows, 6);

            let data = dailySeries;

            if (period === "monthly") {
                data = monthlySeries;
            } else if (period === "weekly") {
                data = buildWeeklySeries(dailySeries, 12);
            }

            return {
                status: true,
                period_type: period,
                data
            };
        } catch (error) {
            console.error("Error in getRevenueByPeriod:", error);
            throw error;
        }
    },

    getDashboardStats: async () => {
        try {
            const { overall, period } = await fetchFinanceSnapshots();
            const { walletDailyRows, orderDailyRows } = await fetchDailyChartRows();
            const { walletMonthlyRows, orderMonthlyRows } = await fetchMonthlyChartRows();

            const dailySeries = buildDailySeries(walletDailyRows, orderDailyRows, 30);
            const monthlySeries = buildMonthlySeries(walletMonthlyRows, orderMonthlyRows, 6);

            return {
                status: true,
                data: {
                    total: buildSnapshot(overall, {
                        wallet_balance: toNumber(overall.wallet_balance)
                    }),
                    today: buildSnapshot({
                        customer_deposit: period.today_customer_deposit,
                        customer_spent: period.today_customer_spent,
                        cost: period.today_cost,
                        profit: period.today_profit,
                        success_order_count: period.today_success_order_count
                    }),
                    this_month: buildSnapshot({
                        customer_deposit: period.month_customer_deposit,
                        customer_spent: period.month_customer_spent,
                        cost: period.month_cost,
                        profit: period.month_profit,
                        success_order_count: period.month_success_order_count
                    }),
                    charts: {
                        daily: dailySeries,
                        weekly: buildWeeklySeries(dailySeries, 12),
                        monthly: monthlySeries
                    }
                }
            };
        } catch (error) {
            console.error("Error in getDashboardStats:", error);
            throw error;
        }
    }
};

module.exports = RevenueService;
