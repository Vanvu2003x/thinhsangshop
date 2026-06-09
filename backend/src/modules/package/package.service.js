const { db } = require("../../configs/drizzle");
const { topupPackages, games } = require("../../db/schema");
const { eq, and, ilike, asc, desc, sql, like } = require("drizzle-orm");
const crypto = require("crypto");
const { deleteFile } = require("../../utils/file.util");

const publicPackageFields = {
    id: topupPackages.id,
    package_name: topupPackages.package_name,
    game_id: topupPackages.game_id,
    price: topupPackages.price,
    price_basic: topupPackages.price_basic,
    price_pro: topupPackages.price_pro,
    price_plus: topupPackages.price_plus,
    thumbnail: topupPackages.thumbnail,
    package_type: topupPackages.package_type,
    status: topupPackages.status,
    sort_order: topupPackages.sort_order,
    id_server: topupPackages.id_server,
    sale: topupPackages.sale
};

const internalPackageFields = {
    ...publicPackageFields,
    status_source: topupPackages.status_source,
    api_id: topupPackages.api_id,
    api_price: topupPackages.api_price,
    origin_price: topupPackages.origin_price,
    fileAPI: topupPackages.fileAPI,
    profit_percent_basic: topupPackages.profit_percent_basic,
    profit_percent_pro: topupPackages.profit_percent_pro,
    profit_percent_plus: topupPackages.profit_percent_plus,
    profit_percent_user: topupPackages.profit_percent_user
};

const getNextPackageSortOrder = async (gameId, tx = db) => {
    const [row] = await tx
        .select({ maxSortOrder: sql`COALESCE(MAX(${topupPackages.sort_order}), 0)` })
        .from(topupPackages)
        .where(eq(topupPackages.game_id, gameId));

    return Number(row?.maxSortOrder || 0) + 1;
};

const PackageService = {
    getAllPackages: async (includeInternal = false) => {
        const fields = includeInternal ? internalPackageFields : publicPackageFields;
        const conditions = includeInternal ? [] : [eq(topupPackages.status, 'active')];
        let query = db.select(fields).from(topupPackages);
        if (conditions.length) query = query.where(and(...conditions));
        return await query.orderBy(asc(topupPackages.sort_order), asc(topupPackages.price_basic));
    },

    getPackageById: async (id, includeInternal = false) => {
        const fields = includeInternal ? internalPackageFields : publicPackageFields;
        const [result] = await db.select(fields).from(topupPackages).where(eq(topupPackages.id, id));
        return result || null;
    },

    getPackagesByGameCode: async (game_code, id_server = null, includeInternal = false) => {
        const conditions = [
            eq(games.gamecode, game_code)
        ];

        if (!includeInternal) {
            conditions.push(eq(topupPackages.status, 'active'));
            conditions.push(eq(games.status, 'active'));
        }

        if (id_server) {
            conditions.push(eq(topupPackages.id_server, id_server));
        }

        const fields = includeInternal ? internalPackageFields : publicPackageFields;
        const packages = await db.select(fields)
            .from(topupPackages)
            .innerJoin(games, eq(topupPackages.game_id, games.id))
            .where(and(...conditions))
            .orderBy(asc(topupPackages.sort_order), asc(topupPackages.price_basic));

        return packages;
    },

    createPackage: async (data, file) => {
        let parsedFileAPI = null;
        if (data.fileAPI) {
            try {
                parsedFileAPI = typeof data.fileAPI === 'string' ? JSON.parse(data.fileAPI) : data.fileAPI;
            } catch (error) {
                console.error("Invalid JSON in fileAPI:", error.message);
                parsedFileAPI = null;
            }
        }

        let thumbnailPath = data.thumbnail;
        if (file) {
            thumbnailPath = file.path;
        }

        const [game] = await db.select().from(games).where(eq(games.id, data.game_id));
        if (!game) throw { status: 404, message: "Game not found" };

        const originPrice = parseInt(data.origin_price || 0);

        const percentBasic = data.profit_percent_basic !== undefined ? Number(data.profit_percent_basic) : (game.profit_percent_basic || 0);
        const percentPro = data.profit_percent_pro !== undefined ? Number(data.profit_percent_pro) : (game.profit_percent_pro || 0);
        const percentPlus = data.profit_percent_plus !== undefined ? Number(data.profit_percent_plus) : (game.profit_percent_plus || 0);
        const percentUser = data.profit_percent_user !== undefined ? Number(data.profit_percent_user) : 0;

        const priceBasic = Math.ceil(originPrice * (1 + percentBasic / 100));
        const pricePro = Math.ceil(originPrice * (1 + percentPro / 100));
        const pricePlus = Math.ceil(originPrice * (1 + percentPlus / 100));
        // Default price is often User Price or Basic Price. Let's assume Price = User Price if defined, else Basic.
        // But usually 'price' column is the default display price.
        // If we have a specific user percentage, maybe we should calculate a price for it?
        // Let's assume price = origin * (1 + percentUser/100) if percentUser is set, otherwise use basic.

        const priceUser = Math.ceil(originPrice * (1 + percentUser / 100));

        const status = data.status || 'active';
        const newPackage = {
            id: crypto.randomUUID(),
            api_id: data.api_id, // Store external ID
            package_name: data.package_name,
            game_id: data.game_id,
            origin_price: originPrice,
            sort_order: await getNextPackageSortOrder(data.game_id),
            status,
            status_source: status === 'inactive' ? 'manual' : null,

            profit_percent_basic: percentBasic,
            profit_percent_pro: percentPro,
            profit_percent_plus: percentPlus,
            profit_percent_user: percentUser,

            price: priceUser > originPrice ? priceUser : priceBasic,
            price_basic: priceBasic,
            price_pro: pricePro,
            price_plus: pricePlus,

            thumbnail: thumbnailPath,
            package_type: data.package_type,
            id_server: data.id_server,
            sale: data.sale || false,
            fileAPI: parsedFileAPI,
        };

        await db.insert(topupPackages).values(newPackage);
        const [created] = await db.select().from(topupPackages).where(eq(topupPackages.id, newPackage.id));
        return created;
    },

    patchPackage: async (id, newStatus) => {
        const status = newStatus === 'active' ? 'active' : 'inactive';
        await db.update(topupPackages)
            .set({
                status,
                status_source: status === 'inactive' ? 'manual' : null
            })
            .where(eq(topupPackages.id, id));
        const [updated] = await db.select().from(topupPackages).where(eq(topupPackages.id, id));
        return updated;
    },

    updatePackage: async (id, data, file) => {
        const currentPkg = await PackageService.getPackageById(id, true);
        if (!currentPkg) throw { status: 404, message: "Gói không tồn tại" };

        const [game] = await db.select().from(games).where(eq(games.id, currentPkg.game_id));
        if (!game) throw { status: 404, message: "Game associated with this package not found" };

        const updateData = {};
        if (data.package_name !== undefined) updateData.package_name = data.package_name;
        if (data.api_id !== undefined) updateData.api_id = data.api_id;
        if (data.package_type !== undefined) updateData.package_type = data.package_type;
        if (data.id_server !== undefined) updateData.id_server = data.id_server;
        if (data.sale !== undefined) updateData.sale = data.sale;
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === 'active') {
                updateData.status_source = null;
            } else {
                updateData.status_source = currentPkg.status === 'inactive' && currentPkg.status_source === 'provider_missing'
                    ? 'provider_missing'
                    : 'manual';
            }
        }

        const originPrice = data.origin_price !== undefined ? parseInt(data.origin_price) : currentPkg.origin_price;

        const percentBasic = data.profit_percent_basic !== undefined ? Number(data.profit_percent_basic)
            : (currentPkg.profit_percent_basic !== null ? currentPkg.profit_percent_basic : (game.profit_percent_basic || 0));

        const percentPro = data.profit_percent_pro !== undefined ? Number(data.profit_percent_pro)
            : (currentPkg.profit_percent_pro !== null ? currentPkg.profit_percent_pro : (game.profit_percent_pro || 0));

        const percentPlus = data.profit_percent_plus !== undefined ? Number(data.profit_percent_plus)
            : (currentPkg.profit_percent_plus !== null ? currentPkg.profit_percent_plus : (game.profit_percent_plus || 0));

        const percentUser = data.profit_percent_user !== undefined ? Number(data.profit_percent_user)
            : (currentPkg.profit_percent_user !== null ? currentPkg.profit_percent_user : 0);

        updateData.origin_price = originPrice;
        updateData.profit_percent_basic = percentBasic;
        updateData.profit_percent_pro = percentPro;
        updateData.profit_percent_plus = percentPlus;
        updateData.profit_percent_user = percentUser;

        updateData.price_basic = Math.ceil(originPrice * (1 + percentBasic / 100));
        updateData.price_pro = Math.ceil(originPrice * (1 + percentPro / 100));
        updateData.price_plus = Math.ceil(originPrice * (1 + percentPlus / 100));
        const priceUser = Math.ceil(originPrice * (1 + percentUser / 100));
        updateData.price = priceUser > originPrice ? priceUser : updateData.price_basic;

        if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
        if (file) {
            updateData.thumbnail = file.path;
            if (currentPkg.thumbnail) {

            }
        }

        if (data.fileAPI !== undefined) {
            try {
                updateData.fileAPI = typeof data.fileAPI === 'string' ? JSON.parse(data.fileAPI) : data.fileAPI;
            } catch (e) {
                updateData.fileAPI = null;
            }
        }

        if (Object.keys(updateData).length === 0) {
            throw { status: 400, message: "Không có dữ liệu nào để cập nhật" };
        }

        await db.update(topupPackages).set(updateData).where(eq(topupPackages.id, id));
        const [updated] = await db.select().from(topupPackages).where(eq(topupPackages.id, id));
        return updated;
    },

    getPackagesByType: async (type, includeInternal = false) => {
        const fields = includeInternal ? internalPackageFields : publicPackageFields;
        const conditions = [eq(topupPackages.package_type, type)];
        if (!includeInternal) conditions.push(eq(topupPackages.status, 'active'));

        return await db.select(fields)
            .from(topupPackages)
            .where(and(...conditions))
            .orderBy(asc(topupPackages.sort_order), asc(topupPackages.price_basic));
    },

    delPackages: async (id) => {
        const [deleted] = await db.select().from(topupPackages).where(eq(topupPackages.id, id));
        await db.delete(topupPackages).where(eq(topupPackages.id, id));

        if (deleted && deleted.thumbnail) {
            deleteFile(deleted.thumbnail);
        }

        return deleted;
    },

    searchPackages: async ({ keyword = "", game_id = null, id_server = null, sale = null }, includeInternal = false) => {
        let conditions = [sql`1=1`];

        if (keyword) {
            conditions.push(ilike(topupPackages.package_name, `%${keyword}%`));
        }
        if (game_id) {
            conditions.push(eq(topupPackages.game_id, game_id));
        }
        if (id_server !== null) {
            conditions.push(eq(topupPackages.id_server, id_server));
        }
        if (sale !== null) {
            conditions.push(eq(topupPackages.sale, sale));
        }
        if (!includeInternal) {
            conditions.push(eq(topupPackages.status, 'active'));
        }

        const fields = includeInternal ? internalPackageFields : publicPackageFields;
        return await db.select(fields)
            .from(topupPackages)
            .where(and(...conditions))
            .orderBy(asc(topupPackages.sort_order), asc(topupPackages.price_basic));
    },

    getPackagePriceById: async (id) => {
        const [result] = await db.select({ id: topupPackages.id, price: topupPackages.price, package_name: topupPackages.package_name }).from(topupPackages).where(eq(topupPackages.id, id));
        return result || null;
    },

    getPackageProfitById: async (id) => {
        const [result] = await db.select({
            profit: sql`(${topupPackages.price} - ${topupPackages.origin_price})`
        }).from(topupPackages).where(eq(topupPackages.id, id));
        return result ? result.profit : null;
    },

    getPackageAmountById: async (id) => {
        const [result] = await db.select({ price: topupPackages.price }).from(topupPackages).where(eq(topupPackages.id, id));
        return result ? result.price : null;
    },

    getPackagesByGameSlug: async (game_code, id_server = null, includeInternal = false) => {
        return await PackageService.getPackagesByGameCode(game_code, id_server, includeInternal);
    },

    deletePackage: async (id) => {
        return await PackageService.delPackages(id);
    },

    updateStatus: async (id, newStatus) => {
        return await PackageService.patchPackage(id, newStatus);
    },

    reorderPackages: async (gameId, items = []) => {
        if (!gameId) throw { status: 400, message: "Thiếu game_id" };
        if (!Array.isArray(items) || items.length === 0) {
            throw { status: 400, message: "Danh sách sắp xếp không hợp lệ" };
        }

        await db.transaction(async (tx) => {
            for (const item of items) {
                if (!item?.id) continue;
                const sortOrder = Number(item.sort_order);
                if (!Number.isFinite(sortOrder) || sortOrder < 0) continue;

                await tx.update(topupPackages)
                    .set({ sort_order: Math.floor(sortOrder) })
                    .where(and(
                        eq(topupPackages.id, item.id),
                        eq(topupPackages.game_id, gameId)
                    ));
            }
        });

        return { status: true };
    },

    updateSale: async (id, sale) => {
        await db.update(topupPackages)
            .set({ sale: sale })
            .where(eq(topupPackages.id, id));
        const [updated] = await db.select().from(topupPackages).where(eq(topupPackages.id, id));
        return updated;
    },

    getLogTypePackages: async (includeInternal = false) => {
        return await PackageService.getAllPackages(includeInternal);
    }
};

module.exports = PackageService;