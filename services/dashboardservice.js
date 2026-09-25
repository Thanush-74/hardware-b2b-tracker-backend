const {
    Order,
    Product,
    Stock,
    ManufacturingWorkOrder,
    InspectionReport,
    DeliveryShipment,
    ReturnReplacement,
    Employee
} = require("../models");
const { Op } = require("sequelize");

const getExecutiveOverview = async () => {
    const totalOrders = await Order.count();
    const totalRevenueSum = await Order.sum("total_amount", {
        where: { payment_status: "Paid" }
    }) || 0;

    const pendingOrders = await Order.count({
        where: { status: "Pending" }
    });

    const activeWorkOrders = await ManufacturingWorkOrder.count({
        where: { status: { [Op.in]: ["Planned", "In_Progress"] } }
    });

    const totalProducts = await Product.count();

    const stocks = await Stock.findAll({
        include: [{ model: Product, as: "product" }]
    });

    let totalInventoryValuation = 0;
    let totalStockUnits = 0;

    for (const stock of stocks) {
        const price = stock.product ? Number(stock.product.unit_price) : 0;
        const qty = stock.quantity_on_hand || 0;
        totalInventoryValuation += price * qty;
        totalStockUnits += qty;
    }

    const totalInspections = await InspectionReport.count();
    const passedInspections = await InspectionReport.count({
        where: { status: "Passed" }
    });

    let passRate = 100;
    if (totalInspections > 0) {
        passRate = ((passedInspections / totalInspections) * 100).toFixed(2);
    }

    const activeDeliveries = await DeliveryShipment.count({
        where: { status: { [Op.in]: ["Dispatch_Ready", "In_Transit", "Out_For_Delivery"] } }
    });

    const pendingReturns = await ReturnReplacement.count({
        where: { status: { [Op.in]: ["Requested", "Item_Received", "Under_Inspection"] } }
    });

    return {
        financials: {
            total_orders: totalOrders,
            total_revenue: parseFloat(Number(totalRevenueSum).toFixed(2)),
            pending_orders: pendingOrders
        },
        operations: {
            active_work_orders: activeWorkOrders,
            active_deliveries: activeDeliveries,
            pending_returns: pendingReturns
        },
        inventory: {
            total_skus: totalProducts,
            total_units: totalStockUnits,
            inventory_valuation: parseFloat(totalInventoryValuation.toFixed(2))
        },
        quality: {
            total_inspections: totalInspections,
            passed_inspections: passedInspections,
            pass_rate_percentage: parseFloat(passRate)
        }
    };
};

const getManufacturingDashboard = async () => {
    const planned = await ManufacturingWorkOrder.count({ where: { status: "Planned" } });
    const inProgress = await ManufacturingWorkOrder.count({ where: { status: "In_Progress" } });
    const completed = await ManufacturingWorkOrder.count({ where: { status: "Completed" } });
    const halted = await ManufacturingWorkOrder.count({ where: { status: "Halted" } });

    const totalProduced = await ManufacturingWorkOrder.sum("quantity_produced") || 0;
    const totalRejected = await ManufacturingWorkOrder.sum("quantity_rejected") || 0;

    const totalOutput = totalProduced + totalRejected;
    let scrapRate = 0;
    if (totalOutput > 0) {
        scrapRate = parseFloat(((totalRejected / totalOutput) * 100).toFixed(2));
    }

    const recentWorkOrders = await ManufacturingWorkOrder.findAll({
        limit: 10,
        order: [["created_at", "DESC"]],
        include: [
            { model: Product, as: "product" },
            { model: Employee, as: "supervisor" }
        ]
    });

    return {
        status_distribution: {
            planned,
            in_progress: inProgress,
            completed,
            halted
        },
        production_metrics: {
            total_units_produced: totalProduced,
            total_units_rejected: totalRejected,
            scrap_rate_percentage: scrapRate
        },
        recent_work_orders: recentWorkOrders
    };
};

const getInventoryDashboard = async () => {
    const totalSkus = await Product.count();

    const lowStockItems = await Stock.findAll({
        where: {
            quantity_on_hand: {
                [Op.lte]: Stock.sequelize.col("reorder_level")
            }
        },
        include: [{ model: Product, as: "product" }]
    });

    return {
        total_skus: totalSkus,
        low_stock_count: lowStockItems.length,
        low_stock_items: lowStockItems
    };
};

const getQualityDashboard = async () => {
    const passed = await InspectionReport.count({ where: { status: "Passed" } });
    const failed = await InspectionReport.count({ where: { status: "Failed" } });
    const conditional = await InspectionReport.count({ where: { status: "Conditional_Pass" } });
    const underReview = await InspectionReport.count({ where: { status: "Under_Review" } });

    const totalInspected = await InspectionReport.sum("total_inspected") || 0;
    const totalDefects = await InspectionReport.sum("defect_count") || 0;

    let defectRate = 0;
    if (totalInspected > 0) {
        defectRate = parseFloat(((totalDefects / totalInspected) * 100).toFixed(2));
    }

    const recentReports = await InspectionReport.findAll({
        limit: 10,
        order: [["created_at", "DESC"]],
        include: [{ model: Employee, as: "inspector" }]
    });

    return {
        summary: {
            passed,
            failed,
            conditional_pass: conditional,
            under_review: underReview
        },
        metrics: {
            total_units_inspected: totalInspected,
            total_defects_found: totalDefects,
            defect_rate_percentage: defectRate
        },
        recent_inspections: recentReports
    };
};

const getLogisticsDashboard = async () => {
    const dispatchReady = await DeliveryShipment.count({ where: { status: "Dispatch_Ready" } });
    const inTransit = await DeliveryShipment.count({ where: { status: "In_Transit" } });
    const outForDelivery = await DeliveryShipment.count({ where: { status: "Out_For_Delivery" } });
    const delivered = await DeliveryShipment.count({ where: { status: "Delivered" } });
    const failed = await DeliveryShipment.count({ where: { status: "Failed" } });

    const recentShipments = await DeliveryShipment.findAll({
        limit: 10,
        order: [["created_at", "DESC"]],
        include: [
            { model: Order, as: "order" },
            { model: Employee, as: "driver" }
        ]
    });

    return {
        shipment_distribution: {
            dispatch_ready: dispatchReady,
            in_transit: inTransit,
            out_for_delivery: outForDelivery,
            delivered,
            failed
        },
        recent_shipments: recentShipments
    };
};

module.exports = {
    getExecutiveOverview,
    getManufacturingDashboard,
    getInventoryDashboard,
    getQualityDashboard,
    getLogisticsDashboard
};
