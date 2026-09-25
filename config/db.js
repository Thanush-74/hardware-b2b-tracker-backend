const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbName = process.env.DB_NAME || "hardware_be";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? false : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("PostgreSQL Database connected successfully via Sequelize.");
    } catch (error) {
        console.error("Unable to connect to the PostgreSQL database:", error.message);
    }
};

module.exports = {
    sequelize,
    connectDB
};
