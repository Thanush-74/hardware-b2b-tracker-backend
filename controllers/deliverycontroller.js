const deliveryService = require("../services/deliveryservice");

const create = async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "order_id is required"
            });
        }

        const shipment = await deliveryService.createShipment(req.body);

        res.status(201).json({
            success: true,
            message: "Shipment created and dispatched successfully",
            data: shipment
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
        const shipments = await deliveryService.getAllShipments(req.query);

        res.status(200).json({
            success: true,
            message: "Shipments retrieved successfully",
            data: shipments
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByTracking = async (req, res) => {
    try {
        const shipment = await deliveryService.getShipmentByTrackingNumber(req.params.trackingNumber);

        res.status(200).json({
            success: true,
            message: "Shipment tracking info retrieved",
            data: shipment
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
        const shipment = await deliveryService.getShipmentById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Shipment details retrieved",
            data: shipment
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
        const shipment = await deliveryService.updateShipmentStatus(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Shipment status updated successfully",
            data: shipment
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const assignDriver = async (req, res) => {
    try {
        const { driver_id } = req.body;
        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        const shipment = await deliveryService.assignDriver(req.params.id, driver_id);

        res.status(200).json({
            success: true,
            message: "Driver assigned to shipment",
            data: shipment
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
    getByTracking,
    getById,
    updateStatus,
    assignDriver
};
