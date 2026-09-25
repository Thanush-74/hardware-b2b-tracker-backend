const { DeliveryShipment, Order, Employee, User, OrderItem, Product } = require("../models");

const createShipment = async (shipmentData) => {
    const { order_id } = shipmentData;

    const order = await Order.findByPk(order_id);
    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    const trackingNumber = `TRACK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const shipment = await DeliveryShipment.create({
        ...shipmentData,
        tracking_number: trackingNumber,
        status: "Dispatch_Ready",
        dispatch_date: new Date()
    });

    await order.update({ status: "Shipped" });

    const fullShipment = await DeliveryShipment.findByPk(shipment.id, {
        include: [
            {
                model: Order,
                as: "order",
                include: [
                    { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] },
                    { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
                ]
            },
            { model: Employee, as: "driver" }
        ]
    });

    return fullShipment;
};

const getAllShipments = async (query = {}) => {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.driver_id) {
        where.driver_id = query.driver_id;
    }

    const shipments = await DeliveryShipment.findAll({
        where,
        include: [
            { model: Order, as: "order" },
            { model: Employee, as: "driver" }
        ],
        order: [["created_at", "DESC"]]
    });

    return shipments;
};

const getShipmentByTrackingNumber = async (trackingNumber) => {
    const shipment = await DeliveryShipment.findOne({
        where: { tracking_number: trackingNumber },
        include: [
            {
                model: Order,
                as: "order",
                include: [
                    { model: User, as: "customer", attributes: ["id", "username", "email", "company_name"] },
                    { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
                ]
            },
            { model: Employee, as: "driver" }
        ]
    });

    if (!shipment) {
        const error = new Error("Shipment not found for this tracking number");
        error.statusCode = 404;
        throw error;
    }

    return shipment;
};

const getShipmentById = async (id) => {
    const shipment = await DeliveryShipment.findByPk(id, {
        include: [
            { model: Order, as: "order" },
            { model: Employee, as: "driver" }
        ]
    });

    if (!shipment) {
        const error = new Error("Shipment not found");
        error.statusCode = 404;
        throw error;
    }

    return shipment;
};

const updateShipmentStatus = async (id, statusData) => {
    const shipment = await DeliveryShipment.findByPk(id);

    if (!shipment) {
        const error = new Error("Shipment not found");
        error.statusCode = 404;
        throw error;
    }

    const { status, current_location, recipient_name, recipient_signature } = statusData;
    const validStatuses = ["Dispatch_Ready", "In_Transit", "Out_For_Delivery", "Delivered", "Failed", "Returned"];

    if (status && !validStatuses.includes(status)) {
        const error = new Error(`Invalid shipment status. Valid options: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (current_location) updatePayload.current_location = current_location;
    if (recipient_name) updatePayload.recipient_name = recipient_name;
    if (recipient_signature) updatePayload.recipient_signature = recipient_signature;

    if (status === "Delivered") {
        updatePayload.actual_delivery_date = new Date();
        const order = await Order.findByPk(shipment.order_id);
        if (order) {
            await order.update({ status: "Delivered" });
        }
    }

    await shipment.update(updatePayload);

    return await getShipmentById(id);
};

const assignDriver = async (id, driverId) => {
    const shipment = await DeliveryShipment.findByPk(id);

    if (!shipment) {
        const error = new Error("Shipment not found");
        error.statusCode = 404;
        throw error;
    }

    const driver = await Employee.findByPk(driverId);
    if (!driver) {
        const error = new Error("Driver employee not found");
        error.statusCode = 404;
        throw error;
    }

    await shipment.update({ driver_id: driverId });

    return await getShipmentById(id);
};

module.exports = {
    createShipment,
    getAllShipments,
    getShipmentByTrackingNumber,
    getShipmentById,
    updateShipmentStatus,
    assignDriver
};
