const returnService = require("../services/returnandreplacementservice");

const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id, reason } = req.body;

        if (!order_id || !product_id || !reason) {
            return res.status(400).json({
                success: false,
                message: "order_id, product_id, and reason are required"
            });
        }

        const returnRequest = await returnService.createReturnRequest({
            ...req.body,
            user_id: userId
        });

        res.status(201).json({
            success: true,
            message: "Return/Replacement request submitted successfully",
            data: returnRequest
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getAll = async (req, res) => {
    try {
        if (req.user.role === "buyer") {
            const returns = await returnService.getUserReturns(req.user.id);
            return res.status(200).json({
                success: true,
                message: "My return requests retrieved",
                data: returns
            });
        }

        const returns = await returnService.getAllReturnRequests(req.query);
        res.status(200).json({
            success: true,
            message: "Return/Replacement requests retrieved",
            data: returns
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getById = async (req, res) => {
    try {
        const returnRequest = await returnService.getReturnById(req.params.id);

        if (req.user.role === "buyer" && returnRequest.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access forbidden"
            });
        }

        res.status(200).json({
            success: true,
            message: "Return request details retrieved",
            data: returnRequest
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getMyReturns = async (req, res) => {
    try {
        const returns = await returnService.getUserReturns(req.user.id);

        res.status(200).json({
            success: true,
            message: "User return requests retrieved",
            data: returns
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const returnRequest = await returnService.updateReturnStatus(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Return request status updated successfully",
            data: returnRequest
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    getMyReturns,
    updateStatus
};
