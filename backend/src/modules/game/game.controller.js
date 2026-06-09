const GameService = require("./game.service");
const asyncHandler = require("../../utils/asyncHandler");
const { deleteFile } = require("../../utils/file.util");

const GameController = {
    getAllGames: asyncHandler(async (req, res) => {
        const result = await GameService.getAllGames(req.isAdmin);
        res.status(200).json(result);
    }),

    createGame: asyncHandler(async (req, res) => {
        const infoRaw = req.body.info;
        if (!infoRaw) {

            throw { status: 400, message: "Thiếu thông tin game" };
        }

        let gameInfo;
        try {
            gameInfo = JSON.parse(infoRaw);
        } catch {
            throw { status: 400, message: "Thông tin game không hợp lệ (không phải JSON)" };
        }

        if (req.file) {
            gameInfo.thumbnail = req.file.path;
        }

        const result = await GameService.createGame(gameInfo);
        return res.status(201).json(result);
    }),

    updateGame: asyncHandler(async (req, res) => {
        const infoRaw = req.body.info;
        if (!infoRaw) throw { status: 400, message: "Thiếu thông tin game" };

        let gameInfo;
        try {
            gameInfo = JSON.parse(infoRaw);
        } catch {
            throw { status: 400, message: "Thông tin game không hợp lệ (không phải JSON)" };
        }

        if (req.file) {
            gameInfo.thumbnail = req.file.path;

            const oldGame = await GameService.getGameById(req.query.id);
            if (oldGame && oldGame.thumbnail) {

            }
        }

        const result = await GameService.updateGame(req.query.id, gameInfo);
        return res.status(200).json(result);
    }),

    deleteGame: asyncHandler(async (req, res) => {
        const result = await GameService.deleteGame(req.query.id);

        if (result && result.thumbnail) {

        }

        return res.status(200).json(result);
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const result = await GameService.updateStatus(req.query.id, req.body.status);
        return res.status(200).json(result);
    }),

    getGamesByType: asyncHandler(async (req, res) => {
        const result = await GameService.getGamesByType(req.query.type);
        res.status(200).json(result);
    }),

    getGameByGameCode: asyncHandler(async (req, res) => {
        const result = await GameService.getGameByGameCode(req.params.gamecode, req.isAdmin);
        return res.status(200).json(result);
    }),

    syncNguonA: asyncHandler(async (req, res) => {
        const NguonAService = require("../nguona/nguona.service");
        await NguonAService.syncGames();
        await NguonAService.syncPackages();
        return res.status(200).json({ status: true, message: "Dang tien hanh dong bo du lieu nguon nap..." });
    }),

    getTopUpGames: asyncHandler(async (req, res) => {
        const result = await GameService.getTopUpGames();
        res.status(200).json(result);
    })
};

module.exports = GameController;