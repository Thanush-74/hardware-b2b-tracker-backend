const { ReturnReplacement, Order, Product, User } = require("../models");

const createReturnRequest = async (returnData) => {
    const { order_id, product_id, user_id, reason, condition, request_type } = returnData;

    const order = await Order.findOne({ where: { id: order_id } });
    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    const rmaNumber = `RMA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const returnRequest = await ReturnReplacement.create({
        rma_number: rmaNumber,
        order_id,
        product_id,
        user_id,
        reason,
        condition: condition || "Defective",
        request_type: request_type || "REPLACEMENT",
        status: "Requested"
    });

    const fullReturn = await ReturnReplacement.findByPk(returnRequest.id, {
        include: [
            { model: Order, as: "order" },
            { model: Product, as: "product" },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ]
    });

    return fullReturn;
};

const getAllReturnRequests = async (query = {}) => {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.request_type) {
        where.request_type = query.request_type;
    }

    const returns = await ReturnReplacement.findAll({
        where,
        include: [
            { model: Order, as: "order" },
            { model: Product, as: "product" },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ],
        order: [["created_at", "DESC"]]
    });

    return returns;
};

const getReturnById = async (id) => {
    const returnRequest = await ReturnReplacement.findByPk(id, {
        include: [
            { model: Order, as: "order" },
            { model: Product, as: "product" },
            { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] }
        ]
    });

    if (!returnRequest) {
        const error = new Error("Return/Replacement request not found");
        error.statusCode = 404;
        throw error;
    }

    return returnRequest;
};

const getUserReturns = async (userId) => {
    const returns = await ReturnReplacement.findAll({
        where: { user_id: userId },
        include: [
            { model: Order, as: "order" },
            { model: Product, as: "product" }
        ],
        order: [["created_at", "DESC"]]
    });

    return returns;
};

const updateReturnStatus = async (id, statusData) => {
    const returnRequest = await ReturnReplacement.findByPk(id);

    if (!returnRequest) {
        const error = new Error("Return request not found");
        error.statusCode = 404;
        throw error;
    }

    const { status, resolution_notes } = statusData;
    const validStatuses = ["Requested", "Approved", "Item_Received", "Under_Inspection", "Replacement_Dispatched", "Refunded", "Rejected"];

    if (status && !validStatuses.includes(status)) {
        const error = new Error(`Invalid RMA status. Must be one of: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (resolution_notes) updatePayload.resolution_notes = resolution_notes;

    await returnRequest.update(updatePayload);

    return await getReturnById(id);
};

module.exports = {
    createReturnRequest,
    getAllReturnRequests,
    getReturnById,
    getUserReturns,
    updateReturnStatus
};
