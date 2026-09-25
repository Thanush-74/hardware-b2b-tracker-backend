const { ManufacturingWorkOrder, Product, Employee, Order, AssemblyStage, TraceabilityRecord } = require("../models");

const createWorkOrder = async (workOrderData) => {
    const { product_id, quantity_planned } = workOrderData;

    const product = await Product.findByPk(product_id);
    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    const workOrderNumber = `WO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const workOrder = await ManufacturingWorkOrder.create({
        ...workOrderData,
        work_order_number: workOrderNumber,
        batch_number: batchNumber,
        status: "Planned"
    });

    await AssemblyStage.create({
        assembly_code: `ASM-${Date.now()}`,
        work_order_id: workOrder.id,
        product_id: workOrder.product_id,
        stage_name: "Initial Fabrication & Assembly",
        status: "Pending"
    });

    const fullWorkOrder = await ManufacturingWorkOrder.findByPk(workOrder.id, {
        include: [
            { model: Product, as: "product" },
            { model: Employee, as: "supervisor" },
            { model: Order, as: "order" },
            { model: AssemblyStage, as: "assembly_steps" }
        ]
    });

    return fullWorkOrder;
};

const getAllWorkOrders = async (query = {}) => {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.product_id) {
        where.product_id = query.product_id;
    }
    if (query.line_number) {
        where.line_number = query.line_number;
    }

    const workOrders = await ManufacturingWorkOrder.findAll({
        where,
        include: [
            { model: Product, as: "product" },
            { model: Employee, as: "supervisor" },
            { model: Order, as: "order" },
            { model: AssemblyStage, as: "assembly_steps" }
        ],
        order: [["created_at", "DESC"]]
    });

    return workOrders;
};

const getWorkOrderById = async (id) => {
    const workOrder = await ManufacturingWorkOrder.findByPk(id, {
        include: [
            { model: Product, as: "product" },
            { model: Employee, as: "supervisor" },
            { model: Order, as: "order" },
            { model: AssemblyStage, as: "assembly_steps" },
            { model: TraceabilityRecord, as: "traceability_items" }
        ]
    });

    if (!workOrder) {
        const error = new Error("Manufacturing Work Order not found");
        error.statusCode = 404;
        throw error;
    }

    return workOrder;
};

const updateWorkOrderStatus = async (id, status) => {
    const workOrder = await ManufacturingWorkOrder.findByPk(id);

    if (!workOrder) {
        const error = new Error("Work order not found");
        error.statusCode = 404;
        throw error;
    }

    const validStatuses = ["Planned", "In_Progress", "Completed", "Halted", "Cancelled"];
    if (!validStatuses.includes(status)) {
        const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const updatePayload = { status };
    if (status === "In_Progress" && !workOrder.start_date) {
        updatePayload.start_date = new Date();
    } else if (status === "Completed") {
        updatePayload.completion_date = new Date();
    }

    await workOrder.update(updatePayload);

    return await getWorkOrderById(id);
};

const recordProductionOutput = async (id, outputData) => {
    const { produced, rejected } = outputData;

    const workOrder = await ManufacturingWorkOrder.findByPk(id);
    if (!workOrder) {
        const error = new Error("Work order not found");
        error.statusCode = 404;
        throw error;
    }

    const newProduced = (workOrder.quantity_produced || 0) + (parseInt(produced, 10) || 0);
    const newRejected = (workOrder.quantity_rejected || 0) + (parseInt(rejected, 10) || 0);

    const updatePayload = {
        quantity_produced: newProduced,
        quantity_rejected: newRejected
    };

    if (newProduced >= workOrder.quantity_planned) {
        updatePayload.status = "Completed";
        updatePayload.completion_date = new Date();
    } else if (workOrder.status === "Planned") {
        updatePayload.status = "In_Progress";
        updatePayload.start_date = new Date();
    }

    await workOrder.update(updatePayload);

    const producedCount = parseInt(produced, 10) || 0;
    for (let i = 0; i < producedCount; i++) {
        const serialNo = `SN-${workOrder.product_id}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await TraceabilityRecord.create({
            serial_number: serialNo,
            batch_number: workOrder.batch_number,
            product_id: workOrder.product_id,
            work_order_id: workOrder.id,
            current_stage: "MANUFACTURED",
            location: `Production Line ${workOrder.line_number}`,
            history_log: JSON.stringify([{
                action: "Unit Manufactured",
                timestamp: new Date(),
                workOrderNumber: workOrder.work_order_number
            }]),
            status: "In_Production"
        });
    }

    return await getWorkOrderById(id);
};

const assignSupervisor = async (id, supervisorId) => {
    const workOrder = await ManufacturingWorkOrder.findByPk(id);
    if (!workOrder) {
        const error = new Error("Work order not found");
        error.statusCode = 404;
        throw error;
    }

    const supervisor = await Employee.findByPk(supervisorId);
    if (!supervisor) {
        const error = new Error("Supervisor employee not found");
        error.statusCode = 404;
        throw error;
    }

    await workOrder.update({ assigned_supervisor_id: supervisorId });

    return await getWorkOrderById(id);
};

module.exports = {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    updateWorkOrderStatus,
    recordProductionOutput,
    assignSupervisor
};
