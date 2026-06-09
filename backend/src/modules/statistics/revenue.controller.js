const RevenueService = require('./revenue.service');
const asyncHandler = require('../../utils/asyncHandler');

const RevenueController = {

    getRevenueOverview: asyncHandler(async (req, res) => {
        const result = await RevenueService.getRevenueStats();
        res.json(result);
    }),

    getProfitMargin: asyncHandler(async (req, res) => {
        const result = await RevenueService.getProfitMargins();
        res.json(result);
    }),

    getGrowthRates: asyncHandler(async (req, res) => {
        const result = await RevenueService.getGrowthRates();
        res.json(result);
    }),

    getTopSources: asyncHandler(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const result = await RevenueService.getTopRevenueSources(limit);
        res.json(result);
    }),

    getByPeriod: asyncHandler(async (req, res) => {
        const period = req.query.period || 'daily';
        const result = await RevenueService.getRevenueByPeriod(period);
        res.json(result);
    }),

    getDashboard: asyncHandler(async (req, res) => {
        const result = await RevenueService.getDashboardStats();
        res.json(result);
    })
};

module.exports = RevenueController;