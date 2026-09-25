const traceabilityService = require("../services/traceabilityservice");

const create = async (req, res) => {
    try {
        const { serial_number, batch_number, product_id } = req.body;
        if (!serial_number || !batch_number || !product_id) {
            return res.status(400).json({
                success: false,
                message: "serial_number, batch_number, and product_id are required"
            });
        }

        const record = await traceabilityService.createTraceRecord(req.body);

        res.status(201).json({
            success: true,
            message: "Traceability record created successfully",
            data: record
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getBySerial = async (req, res) => {
    try {
        const record = await traceabilityService.getTraceBySerialNumber(req.params.serialNumber);

        res.status(200).json({
            success: true,
            message: "Hardware traceability history retrieved",
            data: record
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByBatch = async (req, res) => {
    try {
        const records = await traceabilityService.getTracesByBatch(req.params.batchNumber);

        res.status(200).json({
            success: true,
            message: "Batch hardware units retrieved",
            data: records
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
        const records = await traceabilityService.getAllTraces(req.query);

        res.status(200).json({
            success: true,
            message: "Hardware traceability records retrieved",
            data: records
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const addCheckpoint = async (req, res) => {
    try {
        const record = await traceabilityService.appendTraceCheckpoint(req.params.serialNumber, req.body);

        res.status(200).json({
            success: true,
            message: "Checkpoint logged successfully",
            data: record
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
    getBySerial,
    getByBatch,
    getAll,
    addCheckpoint
};
