const { InspectionReport, Employee } = require("../models");

const createInspection = async (inspectionData) => {
    const { total_inspected, passed_count, defect_count } = inspectionData;

    const inspectionCode = `QC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let status = "Under_Review";
    const total = parseInt(total_inspected, 10) || 1;
    const passed = parseInt(passed_count, 10) || 0;
    const defects = parseInt(defect_count, 10) || 0;

    if (passed === total && defects === 0) {
        status = "Passed";
    } else if (defects > 0 && passed === 0) {
        status = "Failed";
    } else if (defects > 0 && passed > 0) {
        status = "Conditional_Pass";
    }

    const report = await InspectionReport.create({
        ...inspectionData,
        inspection_code: inspectionCode,
        total_inspected: total,
        passed_count: passed,
        defect_count: defects,
        status: inspectionData.status || status
    });

    const fullReport = await InspectionReport.findByPk(report.id, {
        include: [{ model: Employee, as: "inspector" }]
    });

    return fullReport;
};

const getAllInspections = async (query = {}) => {
    const where = {};

    if (query.entity_type) {
        where.entity_type = query.entity_type;
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.inspector_id) {
        where.inspector_id = query.inspector_id;
    }

    const reports = await InspectionReport.findAll({
        where,
        include: [{ model: Employee, as: "inspector" }],
        order: [["created_at", "DESC"]]
    });

    return reports;
};

const getInspectionById = async (id) => {
    const report = await InspectionReport.findByPk(id, {
        include: [{ model: Employee, as: "inspector" }]
    });

    if (!report) {
        const error = new Error("Inspection report not found");
        error.statusCode = 404;
        throw error;
    }

    return report;
};

const updateInspectionStatus = async (id, statusData) => {
    const report = await InspectionReport.findByPk(id);

    if (!report) {
        const error = new Error("Inspection report not found");
        error.statusCode = 404;
        throw error;
    }

    const { status, remarks, defect_details } = statusData;
    const validStatuses = ["Passed", "Failed", "Conditional_Pass", "Under_Review"];

    if (status && !validStatuses.includes(status)) {
        const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (remarks) updatePayload.remarks = remarks;
    if (defect_details) updatePayload.defect_details = defect_details;

    await report.update(updatePayload);

    return await getInspectionById(id);
};

const getInspectionsByEntity = async (entityType, entityId) => {
    const reports = await InspectionReport.findAll({
        where: {
            entity_type: entityType.toUpperCase(),
            entity_id: entityId
        },
        include: [{ model: Employee, as: "inspector" }],
        order: [["created_at", "DESC"]]
    });

    return reports;
};

module.exports = {
    createInspection,
    getAllInspections,
    getInspectionById,
    updateInspectionStatus,
    getInspectionsByEntity
};
