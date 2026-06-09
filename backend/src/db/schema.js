const {
    mysqlTable,
    serial,
    varchar,
    int,
    timestamp,
    json,
    boolean,
    text,
    double
} = require('drizzle-orm/mysql-core');
const { relations, sql } = require('drizzle-orm');

const users = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }).unique().notNull(),
    hash_password: varchar('hash_password', { length: 60 }).notNull(),
    role: varchar('role', { length: 40 }).default('user'),
    level: int('level').default(1),
    balance: int('balance').default(0),
    status: varchar('status', { length: 20 }).default('active'),
    created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at').onUpdateNow(),
});

const games = mysqlTable('games', {
    id: varchar('id', { length: 36 }).primaryKey(),
    api_id: varchar('api_id', { length: 100 }),
    api_source: varchar('api_source', { length: 50 }),
    name: varchar('name', { length: 50 }).notNull(),
    sort_order: int('sort_order').default(0),
    thumbnail: varchar('thumbnail', { length: 500 }),
    server: json('server'),
    input_fields: json('input_fields'),
    gamecode: varchar('gamecode', { length: 50 }).unique(),
    publisher: varchar('publisher', { length: 50 }),
    status: varchar('status', { length: 20 }).default('active'),
    status_source: varchar('status_source', { length: 30 }),
    origin_markup_percent: double('origin_markup_percent').default(0),
    profit_percent_basic: int('profit_percent_basic').default(0),
    profit_percent_pro: int('profit_percent_pro').default(0),
    profit_percent_plus: int('profit_percent_plus').default(0),
});

const topupPackages = mysqlTable('topup_packages', {
    id: varchar('id', { length: 36 }).primaryKey(),
    api_id: varchar('api_id', { length: 100 }),
    package_name: varchar('package_name', { length: 255 }).notNull(),
    game_id: varchar('game_id', { length: 36 }).notNull(),
    price: int('price').notNull(),
    price_basic: int('price_basic'),
    price_pro: int('price_pro'),
    price_plus: int('price_plus'),
    thumbnail: varchar('thumbnail', { length: 500 }),
    package_type: varchar('package_type', { length: 50 }),
    status: varchar('status', { length: 20 }).default('active'),
    status_source: varchar('status_source', { length: 30 }),
    sort_order: int('sort_order').default(0),
    api_price: int('api_price'),
    origin_price: int('origin_price'),
    fileAPI: json('fileAPI'),
    id_server: boolean('id_server').default(false),
    sale: boolean('sale').default(false),
    profit_percent_basic: int('profit_percent_basic').default(0),
    profit_percent_pro: int('profit_percent_pro').default(0),
    profit_percent_plus: int('profit_percent_plus').default(0),
    profit_percent_user: int('profit_percent_user').default(0),
});

const orders = mysqlTable('orders', {
    id: serial('id').primaryKey(),
    api_id: varchar('api_id', { length: 50 }),
    user_id: varchar('user_id', { length: 36 }).notNull(),
    package_id: varchar('package_id', { length: 36 }).notNull(),
    amount: int('amount').notNull(),
    quantity: int('quantity').default(1),
    status: varchar('status', { length: 50 }).default('pending'),
    account_info: json('account_info'),
    profit: int('profit').default(0),
    user_id_nap: varchar('user_id_nap', { length: 36 }),
    created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at').onUpdateNow(),
});

const walletLogs = mysqlTable('topup_wallet_logs', {
    id: varchar('id', { length: 20 }).primaryKey(),
    user_id: varchar('user_id', { length: 36 }).notNull(),
    amount: int('amount').notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at').onUpdateNow(),
});

const acc = mysqlTable('acc', {
    id: serial('id').primaryKey(),
    game_id: varchar('game_id', { length: 36 }).notNull(),
    info: text('info'),
    image: varchar('image', { length: 255 }),
    price: int('price').notNull(),
    price_basic: int('price_basic'),
    price_pro: int('price_pro'),
    price_plus: int('price_plus'),
    status: varchar('status', { length: 50 }).default('available'),
});

const accOrders = mysqlTable('acc_orders', {
    id: serial('id').primaryKey(),
    acc_id: int('acc_id').notNull(),
    user_id: varchar('user_id', { length: 36 }).notNull(),
    price: int('price').notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    contact_info: json('contact_info'),
    created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at').onUpdateNow(),
});

const balanceHistory = mysqlTable('balance_history', {
    id: serial('id').primaryKey(),
    user_id: varchar('user_id', { length: 36 }).notNull(),
    amount: int('amount').notNull(),
    balance_before: int('balance_before').notNull(),
    balance_after: int('balance_after').notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }),
    created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    walletLogs: many(walletLogs),
    accOrders: many(accOrders),
    balanceHistory: many(balanceHistory),
}));

const gamesRelations = relations(games, ({ many }) => ({
    packages: many(topupPackages),
    accs: many(acc),
}));

const packagesRelations = relations(topupPackages, ({ one }) => ({
    game: one(games, {
        fields: [topupPackages.game_id],
        references: [games.id],
    }),
}));

const ordersRelations = relations(orders, ({ one }) => ({
    user: one(users, {
        fields: [orders.user_id],
        references: [users.id],
    }),
    package: one(topupPackages, {
        fields: [orders.package_id],
        references: [topupPackages.id],
    }),
}));

const accRelations = relations(acc, ({ one }) => ({
    game: one(games, {
        fields: [acc.game_id],
        references: [games.id],
    }),
}));

const accOrdersRelations = relations(accOrders, ({ one }) => ({
    user: one(users, {
        fields: [accOrders.user_id],
        references: [users.id],
    }),
    acc: one(acc, {
        fields: [accOrders.acc_id],
        references: [acc.id],
    }),
}));

const balanceHistoryRelations = relations(balanceHistory, ({ one }) => ({
    user: one(users, {
        fields: [balanceHistory.user_id],
        references: [users.id],
    }),
}));

module.exports = {
    users,
    games,
    topupPackages,
    orders,
    walletLogs,
    acc,
    accOrders,
    balanceHistory,

    usersRelations,
    gamesRelations,
    packagesRelations,
    ordersRelations,
    accRelations,
    accOrdersRelations,
    balanceHistoryRelations
};