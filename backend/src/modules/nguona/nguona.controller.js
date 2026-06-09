const NguonAService = require("./nguona.service");
const OrderService = require("../order/order.service");
const { db } = require("../../configs/drizzle");
const { orders } = require("../../db/schema");
const { eq } = require("drizzle-orm");

const NguonAController = {
    handleCallback: async (req, res) => {
        try {
            const { event, order_id, status, amount, message, reason } = req.body;

            if (!order_id) return res.status(400).json({ status: false, message: "Missing order_id" });

            const [order] = await db.select().from(orders).where(eq(orders.api_id, order_id));

            if (!order) {
                console.error(`[Provider] Webhook: Order with api_id ${order_id} not found.`);
                return res.status(404).json({ status: false, message: "Order not found" });
            }

            let newStatus = 'processing';
            if (status === 'success') newStatus = 'success';
            if (status === 'cancelled' || status === 'failed') newStatus = 'failed';

            if (newStatus === 'success' && order.status !== 'success') {
                await OrderService.completeOrder(order.id);
            } else if (newStatus === 'failed' && order.status !== 'failed' && order.status !== 'cancelled') {
                await OrderService.cancelOrderAndRefund(order.id);
            }

            return res.status(200).json({ status: true, message: "Callback processed" });

        } catch (error) {
            console.error("[Provider] Callback Error:", error);
            return res.status(500).json({ status: false, message: "Internal Server Error" });
        }
    }
};

module.exports = NguonAController;