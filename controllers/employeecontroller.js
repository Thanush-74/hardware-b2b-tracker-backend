const employeeService = require("../services/employeeservice");

const create = async (req, res) => {
    try {
        const { employee_code, first_name, last_name, email, designation } = req.body;
        if (!employee_code || !first_name || !last_name || !email || !designation) {
            return res.status(400).json({
                success: false,
                message: "employee_code, first_name, last_name, email, and designation are required"
            });
        }

        const employee = await employeeService.createEmployee(req.body);

        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: employee
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
        const employees = await employeeService.getAllEmployees(req.query);

        res.status(200).json({
            success: true,
            message: "Employees fetched successfully",
            data: employees
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
        const employee = await employeeService.getEmployeeById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Employee details fetched successfully",
            data: employee
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const employee = await employeeService.updateEmployee(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        const result = await employeeService.deleteEmployee(req.params.id);

        res.status(200).json({
            success: true,
            message: "Employee removed successfully",
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getByDepartment = async (req, res) => {
    try {
        const employees = await employeeService.getEmployeesByDepartment(req.params.department);

        res.status(200).json({
            success: true,
            message: "Department employees fetched successfully",
            data: employees
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
    getById,
    update,
    remove,
    getByDepartment
};
