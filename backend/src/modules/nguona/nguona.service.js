const axios = require('axios');
const { db } = require("../../configs/drizzle");
const { games, topupPackages } = require("../../db/schema");
const { eq, and, sql } = require("drizzle-orm");

const NGUONA_BASE_URL = process.env.NGUONA_API_URL || 'https://turbo.id.vn/api/partner';
const NGUONA_API_KEY = process.env.NGUONA_API_KEY;

const normalizeProviderOrderStatus = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'success';
        case 'FAILED':
            return 'failed';
        case 'PARTIAL_COMPLETED':
            return 'partial_completed';
        case 'PENDING':
            return 'pending';
        case 'PROCESSING':
        default:
            return 'processing';
    }
};

const NguonAService = {
    _callApi: async (method, endpoint, data = null) => {
        try {
            const config = {
                method,
                url: `${NGUONA_BASE_URL}${endpoint}`,
                headers: {
                    'x-api-key': NGUONA_API_KEY,
                }
            };

            if (data) {
                config.headers['Content-Type'] = 'application/json';
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            console.error(`[Provider] API Error (${endpoint}) Details:`, JSON.stringify(errorData, null, 2));
            throw error;
        }
    },

    syncGames: async () => {
        try {
            const res = await NguonAService._callApi('GET', '/games');
            if (res.success && Array.isArray(res.data)) {
                const [maxSortOrderRow] = await db
                    .select({ maxSortOrder: sql`COALESCE(MAX(${games.sort_order}), 0)` })
                    .from(games);
                let nextSortOrder = Number(maxSortOrderRow?.maxSortOrder || 0) + 1;
                const localNguonaGames = await db.select().from(games).where(eq(games.api_source, 'nguona'));
                const localByGamecode = new Map(localNguonaGames.map(item => [item.gamecode, item]));
                const seenGamecodes = new Set();

                for (const game of res.data) {
                    if (game.kind !== 'game' && game.kind !== 'folder') continue;

                    const existing = localByGamecode.get(game.slug)
                        || (await db.select().from(games).where(eq(games.gamecode, game.slug)))[0];
                    seenGamecodes.add(game.slug);

                    const apiIdStr = String(game.id);
                    const safeApiId = apiIdStr.substring(0, 50);

                    const gameData = {
                        api_id: safeApiId,
                        api_source: 'nguona',
                        name: game.name,
                        gamecode: game.slug,
                        thumbnail: game.imageUrl,
                        server: null,
                        input_fields: game.inputFields,
                        origin_markup_percent: existing ? existing.origin_markup_percent : 0,
                    };

                    if (existing) {
                        const updateData = {
                            api_id: safeApiId,
                            api_source: 'nguona',
                        };

                        if (existing.status_source === 'provider_missing') {
                            updateData.status = 'active';
                            updateData.status_source = null;
                        }

                        await db.update(games).set(updateData).where(eq(games.id, existing.id));
                    } else {
                        const { randomUUID } = require('crypto');
                        await db.insert(games).values({
                            id: randomUUID(),
                            sort_order: nextSortOrder++,
                            status: 'active',
                            status_source: null,
                            ...gameData
                        });
                    }
                }

                for (const localGame of localNguonaGames) {
                    if (seenGamecodes.has(localGame.gamecode) || localGame.status_source === 'manual') {
                        continue;
                    }

                    await db.update(games)
                        .set({
                            status: 'inactive',
                            status_source: 'provider_missing'
                        })
                        .where(eq(games.id, localGame.id));

                    await db.update(topupPackages)
                        .set({
                            status: 'inactive',
                            status_source: 'provider_missing'
                        })
                        .where(and(
                            eq(topupPackages.game_id, localGame.id),
                            sql`COALESCE(${topupPackages.status_source}, '') <> 'manual'`
                        ));
                }
                return { success: true, count: res.data.length };
            }
            return { success: false, error: "Invalid API response structure" };
        } catch (error) {
            console.error("[Provider] Sync Games Failed:", error.message);
            return { success: false, error: error.message };
        }
    },

    syncPackages: async () => {
        try {
            const res = await NguonAService._callApi('GET', '/games');
            if (!res.success || !Array.isArray(res.data)) {
                return { success: false, error: "Invalid API response structure" };
            }

            const nguonaGames = await db.select().from(games).where(eq(games.api_source, 'nguona'));
            const localGamesByCode = new Map(nguonaGames.map(item => [item.gamecode, item]));

            for (const gameData of res.data) {
                if (gameData.kind !== 'game' && gameData.kind !== 'folder') continue;

                const localGame = localGamesByCode.get(gameData.slug);
                if (!localGame || localGame.status !== 'active') {
                    continue;
                }

                const localPackages = await db.select()
                    .from(topupPackages)
                    .where(eq(topupPackages.game_id, localGame.id));

                if (!Array.isArray(gameData.packages)) {
                    await db.update(topupPackages)
                        .set({
                            status: 'inactive',
                            status_source: 'provider_missing'
                        })
                        .where(and(
                            eq(topupPackages.game_id, localGame.id),
                            sql`COALESCE(${topupPackages.status_source}, '') <> 'manual'`
                        ));
                    continue;
                }

                const { randomUUID } = require('crypto');
                const localByApiId = new Map(
                    localPackages
                        .filter(item => item.api_id)
                        .map(item => [String(item.api_id), item])
                );
                const seenApiIds = new Set();
                const [maxSortOrderRow] = await db
                    .select({ maxSortOrder: sql`COALESCE(MAX(${topupPackages.sort_order}), 0)` })
                    .from(topupPackages)
                    .where(eq(topupPackages.game_id, localGame.id));
                let nextSortOrder = Number(maxSortOrderRow?.maxSortOrder || 0) + 1;

                for (const pkg of gameData.packages) {
                    let pkgApiId = String(pkg.id);
                    if (pkgApiId.length > 50) {
                        pkgApiId = pkgApiId.substring(0, 50);
                    }

                    seenApiIds.add(pkgApiId);
                    const existing = localByApiId.get(pkgApiId);

                    const pkgData = {
                        api_id: pkgApiId,
                        package_name: pkg.displayName,
                        game_id: localGame.id,
                        api_price: pkg.price,
                        price: pkg.price,
                        thumbnail: null,
                        package_type: pkg.category,
                        id_server: false,
                        sale: false,
                        origin_price: pkg.price,
                        status: 'active',
                        status_source: null
                    };

                    if (existing) {
                        const updateData = {
                            api_price: pkg.price,
                            origin_price: pkg.price
                        };

                        if (existing.status_source === 'provider_missing') {
                            updateData.status = 'active';
                            updateData.status_source = null;
                        }

                        await db.update(topupPackages)
                            .set(updateData)
                            .where(eq(topupPackages.id, existing.id));
                    } else {
                        await db.insert(topupPackages).values({
                            id: randomUUID(),
                            sort_order: nextSortOrder++,
                            ...pkgData
                        });
                    }
                }

                for (const localPackage of localPackages) {
                    const apiId = localPackage.api_id ? String(localPackage.api_id) : null;
                    if (!apiId || seenApiIds.has(apiId) || localPackage.status_source === 'manual') {
                        continue;
                    }

                    await db.update(topupPackages)
                        .set({
                            status: 'inactive',
                            status_source: 'provider_missing'
                        })
                        .where(eq(topupPackages.id, localPackage.id));
                }
            }
            return { success: true };
        } catch (error) {
            console.error("[Provider] Sync Packages Failed:", error.message);
            return { success: false, error: error.message };
        }
    },

    createOrder: async (orderId, packageApiId, accountInfo, quantity = 1) => {
        try {
            const [pkg] = await db.select()
                .from(topupPackages)
                .where(eq(topupPackages.api_id, packageApiId))
                .limit(1);
            if (!pkg) {
                return { status: 'failed', message: `Package not found for API ID: ${packageApiId}` };
            }

            const [game] = await db.select()
                .from(games)
                .where(eq(games.id, pkg.game_id))
                .limit(1);
            if (!game) {
                return { status: 'failed', message: `Game not found for Package ID: ${pkg.id}` };
            }

            const providerGameId = Number(game.api_id);
            const providerPackageId = Number(packageApiId);

            if (!Number.isInteger(providerPackageId) || providerPackageId <= 0) {
                return { status: 'failed', message: `Invalid provider package ID: ${packageApiId}` };
            }

            const payload = {
                items: [
                    {
                        packageId: providerPackageId,
                        quantity: Number(quantity) || 1
                    }
                ],
                gameAccountInfo: accountInfo || {}
            };

            if (Number.isInteger(providerGameId) && providerGameId > 0) {
                payload.gameId = providerGameId;
            } else if (game.gamecode) {
                payload.catalogSlug = game.gamecode;
            } else {
                return {
                    status: 'failed',
                    message: `Game ${game.id} is missing both provider gameId and catalogSlug`
                };
            }

            try {
                const res = await NguonAService._callApi('POST', '/orders', payload);

                if (res.success && res.data) {
                    return {
                        status: 'success',
                        data: {
                            id: res.data.orderId,
                            price: res.data.totalPrice,
                            orderStatus: res.data.status,
                            splitCount: res.data.splitCount,
                            orders: res.data.orders || []
                        }
                    };
                } else {
                    return { status: 'failed', message: res.message || "Unknown provider error" };
                }
            } catch (apiError) {
                const errorMsg = apiError.response?.data?.message || apiError.message;
                return { status: 'failed', message: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg };
            }
        } catch (error) {
            return { status: 'failed', message: error.message };
        }
    },

    checkOrderStatus: async (externalOrderId) => {
        try {
            const res = await NguonAService._callApi('GET', `/orders/${externalOrderId}`);
            if (res && res.success && res.data) {
                const rawStatus = res.data.status;
                return {
                    status: true,
                    order: {
                        status: normalizeProviderOrderStatus(rawStatus),
                        rawStatus
                    }
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }
};

module.exports = NguonAService;
