const { db } = require("../../configs/drizzle");
const { games, topupPackages, acc } = require("../../db/schema");
const { eq, sql, asc, and } = require("drizzle-orm");
const crypto = require("crypto");

const parseSortOrder = (value) => {
    if (value === undefined || value === null || value === "") return undefined;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        const error = new Error("STT hiển thị không hợp lệ.");
        error.status = 400;
        throw error;
    }

    return Math.floor(parsed);
};

const publicGameFields = {
    id: games.id,
    name: games.name,
    sort_order: games.sort_order,
    thumbnail: games.thumbnail,
    server: games.server,
    input_fields: games.input_fields,
    gamecode: games.gamecode,
    publisher: games.publisher
};

const GameService = {
    getNextSortOrder: async (tx = db) => {
        const [row] = await tx
            .select({
                maxSortOrder: sql`COALESCE(MAX(${games.sort_order}), 0)`,
            })
            .from(games);

        return Number(row?.maxSortOrder || 0) + 1;
    },

    getAllGames: async (includeInternal = false) => {
        if (includeInternal) {
            return await db.select()
                .from(games)
                .orderBy(asc(games.sort_order), asc(games.name));
        }

        return await db.selectDistinct(publicGameFields)
            .from(games)
            .innerJoin(topupPackages, eq(topupPackages.game_id, games.id))
            .where(and(eq(games.status, 'active'), eq(topupPackages.status, 'active')))
            .orderBy(asc(games.sort_order), asc(games.name));
    },

    getGameById: async (id) => {
        const [game] = await db.select().from(games).where(eq(games.id, id));
        return game;
    },

    getGameByGameCode: async (gamecode, includeInternal = false) => {
        if (includeInternal) {
            const [game] = await db.select().from(games).where(eq(games.gamecode, gamecode));
            return game;
        }

        const [game] = await db.selectDistinct(publicGameFields)
            .from(games)
            .innerJoin(topupPackages, eq(topupPackages.game_id, games.id))
            .where(and(
                eq(games.gamecode, gamecode),
                eq(games.status, 'active'),
                eq(topupPackages.status, 'active')
            ));
        return game;
    },

    createGame: async (data) => {
        const parsedSortOrder = parseSortOrder(data.sort_order);
        const sortOrder = parsedSortOrder !== undefined
            ? parsedSortOrder
            : await GameService.getNextSortOrder();

        const status = data.status || 'active';
        const newGame = {
            id: crypto.randomUUID(),
            api_id: data.api_id,
            name: data.name,
            sort_order: sortOrder,
            thumbnail: data.thumbnail,
            server: data.server,
            gamecode: data.gamecode,
            publisher: data.publisher,
            status,
            status_source: status === 'inactive' ? 'manual' : null,
            profit_percent_basic: data.profit_percent_basic || 0,
            profit_percent_pro: data.profit_percent_pro || 0,
            profit_percent_plus: data.profit_percent_plus || 0,
            origin_markup_percent: data.origin_markup_percent !== undefined ? Number(data.origin_markup_percent) : 0,
        };

        await db.insert(games).values(newGame);

        const [createdGame] = await db.select().from(games).where(eq(games.id, newGame.id));
        return createdGame;
    },

    updateGame: async (id, data) => {

        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.api_id !== undefined) updateData.api_id = data.api_id;
        if (data.thumbnail !== undefined && data.thumbnail !== "") updateData.thumbnail = data.thumbnail;
        if (data.server !== undefined) updateData.server = data.server;
        if (data.gamecode !== undefined) updateData.gamecode = data.gamecode;
        if (data.publisher !== undefined) updateData.publisher = data.publisher;
        if (data.status !== undefined) {
            if (!['active', 'inactive'].includes(data.status)) {
                const error = new Error("Trang thai game khong hop le.");
                error.status = 400;
                throw error;
            }
            updateData.status = data.status;
            updateData.status_source = data.status === 'inactive' ? 'manual' : null;
        }
        const parsedSortOrder = parseSortOrder(data.sort_order);
        if (parsedSortOrder !== undefined) updateData.sort_order = parsedSortOrder;

        let profitChanged = false;
        if (data.profit_percent_basic !== undefined) { updateData.profit_percent_basic = Number(data.profit_percent_basic); profitChanged = true; }
        if (data.profit_percent_pro !== undefined) { updateData.profit_percent_pro = Number(data.profit_percent_pro); profitChanged = true; }
        if (data.profit_percent_plus !== undefined) { updateData.profit_percent_plus = Number(data.profit_percent_plus); profitChanged = true; }

        if (data.origin_markup_percent !== undefined) { updateData.origin_markup_percent = Number(data.origin_markup_percent); profitChanged = true; }

        if (Object.keys(updateData).length === 0) {
            throw new Error("Không có trường nào để cập nhật.");
        }

        await db.transaction(async (tx) => {

            await tx.update(games)
                .set(updateData)
                .where(eq(games.id, id));

            if (profitChanged) {

                const [game] = await tx.select().from(games).where(eq(games.id, id));

                const percentBasic = game.profit_percent_basic || 0;
                const percentPro = game.profit_percent_pro || 0;
                const percentPlus = game.profit_percent_plus || 0;
                const markupPercent = Number(game.origin_markup_percent || 0);
                const markupCoefficient = 1 + (markupPercent / 100);

                const packages = await tx.select().from(topupPackages).where(eq(topupPackages.game_id, id));

                for (const pkg of packages) {
                    const apiPrice = pkg.api_price || 0;

                    const originPrice = apiPrice > 0
                        ? Math.ceil(apiPrice * markupCoefficient)
                        : (pkg.origin_price || 0);

                    const priceBasic = Math.ceil(originPrice * (1 + percentBasic / 100));
                    const pricePro = Math.ceil(originPrice * (1 + percentPro / 100));
                    const pricePlus = Math.ceil(originPrice * (1 + percentPlus / 100));

                    await tx.update(topupPackages)
                        .set({
                            origin_price: originPrice, // Update origin price
                            price: priceBasic,
                            price_basic: priceBasic,
                            price_pro: pricePro,
                            price_plus: pricePlus,
                            profit_percent_basic: percentBasic,
                            profit_percent_pro: percentPro,
                            profit_percent_plus: percentPlus
                        })
                        .where(eq(topupPackages.id, pkg.id));
                }
            }
        });

        const [updatedGame] = await db.select().from(games).where(eq(games.id, id));
        return updatedGame;
    },

    updateStatus: async (id, status) => {
        if (!['active', 'inactive'].includes(status)) {
            const error = new Error("Trang thai game khong hop le.");
            error.status = 400;
            throw error;
        }

        await db.update(games)
            .set({
                status,
                status_source: status === 'inactive' ? 'manual' : null
            })
            .where(eq(games.id, id));

        const [updatedGame] = await db.select().from(games).where(eq(games.id, id));
        return updatedGame;
    },

    deleteGame: async (id) => {
        const [deletedGame] = await db.select().from(games).where(eq(games.id, id));
        await db.delete(games).where(eq(games.id, id));
        return deletedGame;
    },

    getGamesByType: async (type) => {
        let result;
        if (type === "ACC") {

            result = await db.selectDistinct(publicGameFields)
                .from(games)
                .innerJoin(acc, eq(acc.game_id, games.id))
                .where(eq(games.status, 'active'))
                .orderBy(asc(games.sort_order), asc(games.name));
        } else {
            result = await db.selectDistinct(publicGameFields)
                .from(games)
                .innerJoin(topupPackages, eq(topupPackages.game_id, games.id))
                .where(and(
                    eq(topupPackages.package_type, type),
                    eq(topupPackages.status, 'active'),
                    eq(games.status, 'active')
                ))
                .orderBy(asc(games.sort_order), asc(games.name));
        }
        return result;
    },

    getTopUpGames: async () => {
        const result = await db.selectDistinct(publicGameFields)
            .from(games)
            .innerJoin(topupPackages, eq(topupPackages.game_id, games.id))
            .where(and(eq(topupPackages.status, 'active'), eq(games.status, 'active')))
            .orderBy(asc(games.sort_order), asc(games.name));

        return result;
    }
};

module.exports = GameService;
