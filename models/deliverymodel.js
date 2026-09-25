const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DeliveryShipment = sequelize.define("DeliveryShipment", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tracking_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "orders",
            key: "id"
        }
    },
    carrier_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "B2B Freight Logistics"
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "employees",
            key: "id"
        }
    },
    dispatch_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estimated_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actual_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    current_location: {
        type: DataTypes.STRING,
        defaultValue: "Dispatch Hub"
    },
    status: {
        type: DataTypes.ENUM("Dispatch_Ready", "In_Transit", "Out_For_Delivery", "Delivered", "Failed", "Returned"),
        defaultValue: "Dispatch_Ready"
    },
    recipient_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    recipient_signature: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "delivery_shipments"
});

module.exports = DeliveryShipment;
