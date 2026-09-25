const assemblyService = require("../services/assemblyservice");

const create = async (req, res) => {
    try {
        const { work_order_id, product_id, stage_name } = req.body;
        if (!work_order_id || !product_id || !stage_name) {
            return res.status(400).json({
                success: false,
                message: "work_order_id, product_id, and stage_name are required"
            });
        }

        const stage = await assemblyService.createAssemblyStage(req.body);

        res.status(201).json({
            success: true,
            message: "Assembly stage created successfully",
            data: stage
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
        const stages = await assemblyService.getAllAssemblyStages(req.query);

        res.status(200).json({
            success: true,
            message: "Assembly stages retrieved successfully",
            data: stages
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
        const stage = await assemblyService.getAssemblyStageById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Assembly stage details retrieved successfully",
            data: stage
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const stage = await assemblyService.updateAssemblyStage(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Assembly stage updated successfully",
            data: stage
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
        const { status, notes } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const stage = await assemblyService.updateAssemblyStatus(req.params.id, status, notes);

        res.status(200).json({
            success: true,
            message: "Assembly status updated successfully",
            data: stage
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const assignOperator = async (req, res) => {
    try {
        const { employee_id } = req.body;
        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: "employee_id is required"
            });
        }

        const stage = await assemblyService.assignOperator(req.params.id, employee_id);

        res.status(200).json({
            success: true,
            message: "Operator assigned to assembly stage",
            data: stage
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
    update,
    updateStatus,
    assignOperator
};
