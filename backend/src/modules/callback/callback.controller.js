const OrderService = require("../order/order.service");
const { db } = require("../../configs/drizzle");
const { orders } = require("../../db/schema");
const { eq } = require("drizzle-orm");
const crypto = require("crypto");

const getClientIP = (req) => {
    return req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
        req.ip;
};

const verifyCallbackSignature = (req, secret) => {
    const signature = req.headers['x-callback-signature'];
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

const CallbackController = {

    morishopCallback: async (req, res) => {
        try {
            const clientIP = getClientIP(req);

            const callbackSecret = process.env.CALLBACK_SECRET;
            if (callbackSecret) {
                const isValid = verifyCallbackSignature(req, callbackSecret);
                if (!isValid) {
                    console.warn("[Callback] Morishop: Invalid signature from IP:", clientIP);
                    return res.status(403).json({ status: false, msg: "Invalid signature" });
                }
            }

            const { idtrx, status, sn, price, note } = req.body;

            if (!idtrx || !idtrx.toString().startsWith('KB_')) {
                return res.json({ status: false, msg: "Invalid ID format" });
            }

            const orderId = idtrx.split('_')[1];

            const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
            if (!order) {
                console.warn("[Callback] Morishop: Order not found:", orderId);
                return res.json({ status: false, msg: "Order not found" });
            }

            if (order.status !== 'processing' && order.status !== 'pending') {
                console.warn("[Callback] Morishop: Order already finalized:", orderId, "Status:", order.status);
                return res.json({ status: true, msg: "Order already processed" });
            }

            let newStatus = 'processing';
            let description = sn || note || '';

            if (status === 'Success') {
                newStatus = 'success';
            } else if (status === 'Error' || status === 'Gagal') {
                newStatus = 'failed';
            }

            if (newStatus === 'processing') {
                return res.json({ status: true });
            }

            if (newStatus === 'success') {
                await OrderService.completeOrder(orderId);
            } else if (newStatus === 'failed') {

                await OrderService.cancelOrderAndRefund(orderId);
            }

            res.json({ status: true });
        } catch (error) {
            console.error("[Callback] Morishop Error:", error);
            res.status(500).json({ status: false, msg: error.message });
        }
    },

    napgameCallback: async (req, res) => {
        try {
            const clientIP = getClientIP(req);

            const callbackSecret = process.env.CALLBACK_SECRET;
            if (callbackSecret && req.method === 'POST') {
                const isValid = verifyCallbackSignature(req, callbackSecret);
                if (!isValid) {
                    console.warn("[Callback] NapGame247: Invalid signature from IP:", clientIP);
                    return res.status(403).send("Forbidden");
                }
            }

            res.send("OK");
        } catch (error) {
            console.error("[Callback] NapGame247 Error:", error);
            res.status(500).send("Error");
        }
    }
};

module.exports = CallbackController;