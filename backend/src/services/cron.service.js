const cron = require('node-cron');

const WalletLogService = require('../modules/walletLog/walletLog.service');

const initCronJobs = () => {

    cron.schedule('10,30,50 * * * *', async () => {
        await WalletLogService.autoCheckExpiredTransactions();
    });

    const NguonAService = require('../modules/nguona/nguona.service');
    console.log('[Cron] Starting initial sync for games and packages...');
    NguonAService.syncGames()
        .then(res => {
            console.log('[Cron] Initial games sync result:', JSON.stringify(res));
            return NguonAService.syncPackages();
        })
        .then(res => {
            console.log('[Cron] Initial packages sync result:', JSON.stringify(res));
        })
        .catch(err => {
            console.error('[Cron] Initial sync error:', err.message);
        });

    cron.schedule('*/30 * * * *', async () => {
        console.log('[Cron] Starting scheduled sync for games and packages...');
        try {
            const resGames = await NguonAService.syncGames();
            console.log('[Cron] Scheduled games sync result:', JSON.stringify(resGames));
            const resPkgs = await NguonAService.syncPackages();
            console.log('[Cron] Scheduled packages sync result:', JSON.stringify(resPkgs));
        } catch (syncErr) {
            console.error('[Cron] Scheduled sync error:', syncErr.message);
        }
    });

    cron.schedule('*/3 * * * *', async () => {
        const NguonAService = require('../modules/nguona/nguona.service');
        const OrderService = require('../modules/order/order.service');
        const { db } = require("../configs/drizzle");
        const { orders } = require("../db/schema");
        const { eq, and, isNotNull } = require("drizzle-orm");

        try {
            const processingOrders = await db.select().from(orders)
                .where(and(
                    eq(orders.status, 'processing'),
                    isNotNull(orders.api_id)
                ));

            for (const order of processingOrders) {
                try {
                    const res = await NguonAService.checkOrderStatus(order.api_id);

                    if (res && res.status && res.order) {
                        const remoteStatus = res.order.status;

                        if (remoteStatus === 'success') {
                            await OrderService.completeOrder(order.id);
                            console.log(`[Cron] Order #${order.id} completed successfully.`);

                        } else if (remoteStatus === 'partial_completed') {
                            await OrderService.changeOrderStatus(order.id, 'partial_completed');
                            console.warn(`[Cron] Order #${order.id} is partial completed and needs manual review.`);

                        } else if (remoteStatus === 'failed' || remoteStatus === 'cancelled') {
                            await OrderService.cancelOrderAndRefund(order.id);
                            console.log(`[Cron] Order #${order.id} failed/cancelled — refunded.`);
                        }
                    }
                } catch (innerErr) {
                    console.error(`[Cron] Error checking Order #${order.id}:`, innerErr.message);
                }
            }
        } catch (err) {
            console.error("[Cron] Check provider status error:", err);
        }
    });
};

module.exports = {
    initCronJobs
};
