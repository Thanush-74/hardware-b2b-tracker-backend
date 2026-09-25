const { AssemblyStage, ManufacturingWorkOrder, Product, Employee } = require("../models");

const createAssemblyStage = async (stageData) => {
    const assemblyCode = `ASM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const stage = await AssemblyStage.create({
        ...stageData,
        assembly_code: assemblyCode,
        status: stageData.status || "Pending"
    });

    const fullStage = await AssemblyStage.findByPk(stage.id, {
        include: [
            { model: ManufacturingWorkOrder, as: "work_order" },
            { model: Product, as: "product" },
            { model: Employee, as: "operator" }
        ]
    });

    return fullStage;
};

const getAllAssemblyStages = async (query = {}) => {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.work_order_id) {
        where.work_order_id = query.work_order_id;
    }
    if (query.assigned_employee_id) {
        where.assigned_employee_id = query.assigned_employee_id;
    }

    const stages = await AssemblyStage.findAll({
        where,
        include: [
            { model: ManufacturingWorkOrder, as: "work_order" },
            { model: Product, as: "product" },
            { model: Employee, as: "operator" }
        ],
        order: [["created_at", "DESC"]]
    });

    return stages;
};

const getAssemblyStageById = async (id) => {
    const stage = await AssemblyStage.findByPk(id, {
        include: [
            { model: ManufacturingWorkOrder, as: "work_order" },
            { model: Product, as: "product" },
            { model: Employee, as: "operator" }
        ]
    });

    if (!stage) {
        const error = new Error("Assembly stage not found");
        error.statusCode = 404;
        throw error;
    }

    return stage;
};

const updateAssemblyStage = async (id, updateData) => {
    const stage = await AssemblyStage.findByPk(id);

    if (!stage) {
        const error = new Error("Assembly stage not found");
        error.statusCode = 404;
        throw error;
    }

    await stage.update(updateData);

    return await getAssemblyStageById(id);
};

const updateAssemblyStatus = async (id, status, notes) => {
    const stage = await AssemblyStage.findByPk(id);

    if (!stage) {
        const error = new Error("Assembly stage not found");
        error.statusCode = 404;
        throw error;
    }

    const validStatuses = ["Pending", "In_Progress", "Passed", "Rework_Required", "Completed"];
    if (!validStatuses.includes(status)) {
        const error = new Error(`Invalid assembly status. Must be one of: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const updatePayload = { status };
    if (notes) {
        updatePayload.notes = notes;
    }

    await stage.update(updatePayload);

    return await getAssemblyStageById(id);
};

const assignOperator = async (id, employeeId) => {
    const stage = await AssemblyStage.findByPk(id);

    if (!stage) {
        const error = new Error("Assembly stage not found");
        error.statusCode = 404;
        throw error;
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    await stage.update({ assigned_employee_id: employeeId });

    return await getAssemblyStageById(id);
};

module.exports = {
    createAssemblyStage,
    getAllAssemblyStages,
    getAssemblyStageById,
    updateAssemblyStage,
    updateAssemblyStatus,
    assignOperator
};
