const { Employee, User } = require("../models");

const createEmployee = async (employeeData) => {
    const { employee_code, email } = employeeData;

    const existingCode = await Employee.findOne({ where: { employee_code } });
    if (existingCode) {
        const error = new Error("Employee code already exists");
        error.statusCode = 400;
        throw error;
    }

    const existingEmail = await Employee.findOne({ where: { email } });
    if (existingEmail) {
        const error = new Error("Employee with this email already exists");
        error.statusCode = 400;
        throw error;
    }

    const employee = await Employee.create(employeeData);
    return employee;
};

const getAllEmployees = async (query = {}) => {
    const where = {};

    if (query.department) {
        where.department = query.department;
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.shift) {
        where.shift = query.shift;
    }

    const employees = await Employee.findAll({
        where,
        include: [{
            model: User,
            as: "user_account",
            attributes: ["id", "username", "email", "role"]
        }],
        order: [["created_at", "DESC"]]
    });

    return employees;
};

const getEmployeeById = async (id) => {
    const employee = await Employee.findByPk(id, {
        include: [{
            model: User,
            as: "user_account",
            attributes: ["id", "username", "email", "role"]
        }]
    });

    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    return employee;
};

const updateEmployee = async (id, updateData) => {
    const employee = await Employee.findByPk(id);

    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    await employee.update(updateData);

    const updatedEmployee = await Employee.findByPk(id, {
        include: [{
            model: User,
            as: "user_account",
            attributes: ["id", "username", "email", "role"]
        }]
    });

    return updatedEmployee;
};

const deleteEmployee = async (id) => {
    const employee = await Employee.findByPk(id);

    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    await employee.destroy();

    return { message: "Employee deleted successfully", id };
};

const getEmployeesByDepartment = async (department) => {
    const employees = await Employee.findAll({
        where: { department, status: "Active" },
        order: [["first_name", "ASC"]]
    });

    return employees;
};

module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getEmployeesByDepartment
};
