const manufacturingService = require("../services/manufactouringservice");

const create = async (req, res) => {
    try {
        const { product_id, quantity_planned } = req.body;
        if (!product_id || !quantity_planned) {
            return res.status(400).json({
                success: false,
                message: "product_id and quantity_planned are required"
            });
        }

        const workOrder = await manufacturingService.createWorkOrder(req.body);

        res.status(201).json({
            success: true,
            message: "Manufacturing work order created successfully",
            data: workOrder
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
        const workOrders = await manufacturingService.getAllWorkOrders(req.query);

        res.status(200).json({
            success: true,
            message: "Manufacturing work orders retrieved successfully",
            data: workOrders
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
        const workOrder = await manufacturingService.getWorkOrderById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Work order retrieved successfully",
            data: workOrder
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
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const workOrder = await manufacturingService.updateWorkOrderStatus(req.params.id, status);

        res.status(200).json({
            success: true,
            message: "Work order status updated successfully",
            data: workOrder
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const recordOutput = async (req, res) => {
    try {
        const { produced, rejected } = req.body;
        if (produced === undefined && rejected === undefined) {
            return res.status(400).json({
                success: false,
                message: "produced or rejected count is required"
            });
        }

        const workOrder = await manufacturingService.recordProductionOutput(req.params.id, {
            produced: produced || 0,
            rejected: rejected || 0
        });

        res.status(200).json({
            success: true,
            message: "Production output recorded successfully",
            data: workOrder
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const assign = async (req, res) => {
    try {
        const { supervisor_id } = req.body;
        if (!supervisor_id) {
            return res.status(400).json({
                success: false,
                message: "supervisor_id is required"
            });
        }

        const workOrder = await manufacturingService.assignSupervisor(req.params.id, supervisor_id);

        res.status(200).json({
            success: true,
            message: "Supervisor assigned to work order",
            data: workOrder
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
    updateStatus,
    recordOutput,
    assign
};
