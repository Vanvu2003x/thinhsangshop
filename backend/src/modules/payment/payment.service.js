const { db } = require("../../configs/drizzle");
const { walletLogs } = require("../../db/schema");
const { eq } = require("drizzle-orm");

const crypto = require("crypto");
const UserService = require("../user/user.service");
require('dotenv').config();

async function addLogDirect(data) {
    const { user_id, amount } = data;

    const generatedId = crypto.randomBytes(8).toString('hex').toUpperCase();

    const newLog = {
        id: generatedId,
        user_id,
        amount,
        status: 'pending'
    };

    await db.insert(walletLogs).values(newLog);
    const [log] = await db.select().from(walletLogs).where(eq(walletLogs.id, generatedId));
    return log;
}

const PaymentService = {
    createQR: async (user, amount) => {
        if (!amount) throw { status: 400, message: "Thiếu amount" };

        const bankBin = "970422";
        const bankName = "MB Bank";
        const stk = "0865024919";
        const chusohuu = "TĂNG VĂN NAM";

        const Log = await addLogDirect({ user_id: user.id, amount });

        const rawId = Log.id.toString().replace(/[^a-zA-Z0-9]/g, '');
        const memo = `AZ${rawId}ZA`;

        const template = "compact2";
        const url = `https://img.vietqr.io/image/${bankBin}-${stk}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(chusohuu)}`;

        return {
            id: Log.id,
            urlPayment: url,
            amount: amount,
            name: user.name,
            email: user.email,
            bank_name: bankName,
            accountNumber: stk,
            accountHolder: chusohuu,
            memo: memo
        };
    },

    handleWeb2mHook: async (data, token) => {
        const web2mToken = process.env.TOKEN_WEB2M;

        if (token !== web2mToken) {
            console.warn("Token sai payment hook");
            throw { status: 401, message: 'Token sai' };
        }

        if (data.status === true && Array.isArray(data.data)) {

            const { sql: sqlOp, or } = require("drizzle-orm");
            const pendingLogs = await db.select().from(walletLogs)
                .where(sqlOp`${walletLogs.status} IN ('pending', 'Đang Chờ', 'wait')`);

            for (const value of data.data) {
                try {
                    const rawDesc = (value.description || '').toLowerCase();

                    const normalizedDesc = rawDesc.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

                    let matchedLog = null;

                    const strictMatch = value.description.match(/AZ([A-F0-9]{16})ZA/i)
                        || value.description.match(/KB\.?([A-F0-9]{16})\.?KB/i)
                        || value.description.match(/KB\.?([A-F0-9]{16})/i);

                    if (strictMatch) {
                        const logId = strictMatch[1];
                        matchedLog = pendingLogs.find(l => l.id.toLowerCase() === logId.toLowerCase());
                    }

                    if (!matchedLog) {
                        matchedLog = pendingLogs.find(log => {
                            const logIdNorm = log.id.toLowerCase().replace(/[^a-z0-9]/g, '');

                            return rawDesc.includes(log.id.toLowerCase())
                                || normalizedDesc.replace(/\s/g, '').includes(logIdNorm)
                                || normalizedDesc.includes(logIdNorm);
                        });
                    }

                    if (matchedLog) {
                        const amount = Number(value.amount);
                        const expectedAmount = Number(matchedLog.amount);

                        console.log(`[Webhook] Khớp memo: "${value.description}" → logId: ${matchedLog.id}. Cần: ${expectedAmount}, Nhận: ${amount}`);

                        if (amount === expectedAmount) {

                            await UserService.updateBalance(matchedLog.user_id, amount, 'credit', 'Nạp tiền qua ngân hàng (Auto)');

                            await db.update(walletLogs)
                                .set({
                                    status: "Thành Công",
                                    amount: amount,
                                    updated_at: new Date()
                                })
                                .where(eq(walletLogs.id, matchedLog.id));
                        } else {

                            console.warn(`[Webhook] Sai số tiền cho logId: ${matchedLog.id}. Cần: ${expectedAmount}, Thực nhận: ${amount}. Giao dịch thất bại.`);

                            await db.update(walletLogs)
                                .set({
                                    status: "Thất Bại",
                                    amount: amount,
                                    updated_at: new Date()
                                })
                                .where(eq(walletLogs.id, matchedLog.id));
                        }
                    } else {
                        console.warn(`[Webhook] Không khớp giao dịch nào: "${value.description}"`);
                    }
                } catch (err) {
                    console.error("Error processing transaction:", err);
                }
            }
        } else {
            console.warn('Invalid webhook data or transaction failed.');
        }

        return true;
    }
};

module.exports = PaymentService;