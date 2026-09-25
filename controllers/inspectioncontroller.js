const inspectionService = require("../services/inspectionservice");

const create = async (req, res) => {
    try {
        const { entity_type, entity_id } = req.body;
        if (!entity_type || !entity_id) {
            return res.status(400).json({
                success: false,
                message: "entity_type and entity_id are required"
            });
        }

        const report = await inspectionService.createInspection(req.body);

        res.status(201).json({
            success: true,
            message: "Inspection report created successfully",
            data: report
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
        const reports = await inspectionService.getAllInspections(req.query);

        res.status(200).json({
            success: true,
            message: "Inspection reports retrieved successfully",
            data: reports
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
        const report = await inspectionService.getInspectionById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Inspection report retrieved successfully",
            data: report
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
        const report = await inspectionService.updateInspectionStatus(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Inspection report updated successfully",
            data: report
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByEntity = async (req, res) => {
    try {
        const { entity_type, entity_id } = req.params;
        const reports = await inspectionService.getInspectionsByEntity(entity_type, entity_id);

        res.status(200).json({
            success: true,
            message: "Entity inspection records retrieved",
            data: reports
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
    getByEntity
};
