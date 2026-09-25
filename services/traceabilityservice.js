const { TraceabilityRecord, Product, ManufacturingWorkOrder } = require("../models");

const createTraceRecord = async (traceData) => {
    const { serial_number, current_stage, location } = traceData;

    const existing = await TraceabilityRecord.findOne({ where: { serial_number } });
    if (existing) {
        const error = new Error("Serial number already exists");
        error.statusCode = 400;
        throw error;
    }

    const initialHistory = [{
        stage: current_stage || "MANUFACTURED",
        location: location || "Production Floor",
        timestamp: new Date(),
        note: "Initial serial record created"
    }];

    const record = await TraceabilityRecord.create({
        ...traceData,
        history_log: JSON.stringify(initialHistory)
    });

    const fullRecord = await TraceabilityRecord.findByPk(record.id, {
        include: [
            { model: Product, as: "product" },
            { model: ManufacturingWorkOrder, as: "work_order" }
        ]
    });

    return fullRecord;
};

const getTraceBySerialNumber = async (serialNumber) => {
    const record = await TraceabilityRecord.findOne({
        where: { serial_number: serialNumber },
        include: [
            { model: Product, as: "product" },
            { model: ManufacturingWorkOrder, as: "work_order" }
        ]
    });

    if (!record) {
        const error = new Error("Hardware traceability record not found for this serial number");
        error.statusCode = 404;
        throw error;
    }

    let parsedLog = [];
    try {
        parsedLog = typeof record.history_log === "string" ? JSON.parse(record.history_log) : (record.history_log || []);
    } catch (e) {
        parsedLog = [];
    }

    const result = record.toJSON();
    result.history_log = parsedLog;

    return result;
};

const getTracesByBatch = async (batchNumber) => {
    const records = await TraceabilityRecord.findAll({
        where: { batch_number: batchNumber },
        include: [
            { model: Product, as: "product" },
            { model: ManufacturingWorkOrder, as: "work_order" }
        ],
        order: [["created_at", "ASC"]]
    });

    const results = [];
    for (const record of records) {
        let parsedLog = [];
        try {
            parsedLog = typeof record.history_log === "string" ? JSON.parse(record.history_log) : (record.history_log || []);
        } catch (e) {
            parsedLog = [];
        }
        const item = record.toJSON();
        item.history_log = parsedLog;
        results.push(item);
    }

    return results;
};

const getAllTraces = async (query = {}) => {
    const where = {};

    if (query.product_id) {
        where.product_id = query.product_id;
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.current_stage) {
        where.current_stage = query.current_stage;
    }

    const records = await TraceabilityRecord.findAll({
        where,
        include: [
            { model: Product, as: "product" },
            { model: ManufacturingWorkOrder, as: "work_order" }
        ],
        order: [["created_at", "DESC"]]
    });

    return records;
};

const appendTraceCheckpoint = async (serialNumber, checkpointData) => {
    const record = await TraceabilityRecord.findOne({
        where: { serial_number: serialNumber }
    });

    if (!record) {
        const error = new Error("Traceability record not found");
        error.statusCode = 404;
        throw error;
    }

    let currentLog = [];
    try {
        currentLog = typeof record.history_log === "string" ? JSON.parse(record.history_log) : (record.history_log || []);
    } catch (e) {
        currentLog = [];
    }

    const newEntry = {
        stage: checkpointData.stage || record.current_stage,
        location: checkpointData.location || record.location,
        timestamp: new Date(),
        note: checkpointData.note || "Checkpoint recorded",
        status: checkpointData.status || record.status
    };

    currentLog.push(newEntry);

    const updatePayload = {
        history_log: JSON.stringify(currentLog)
    };

    if (checkpointData.stage) updatePayload.current_stage = checkpointData.stage;
    if (checkpointData.location) updatePayload.location = checkpointData.location;
    if (checkpointData.status) updatePayload.status = checkpointData.status;

    await record.update(updatePayload);

    return await getTraceBySerialNumber(serialNumber);
};

module.exports = {
    createTraceRecord,
    getTraceBySerialNumber,
    getTracesByBatch,
    getAllTraces,
    appendTraceCheckpoint
};
