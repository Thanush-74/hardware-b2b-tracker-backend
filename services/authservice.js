const { User, Employee } = require("../models");
const { hashPassword, comparePassword } = require("../utils/passwordHelper");
const { generateToken } = require("../utils/jwtHelper");

const registerUser = async (userData) => {
    const { username, email, password, role, company_name, phone } = userData;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        const error = new Error("User with this email already exists");
        error.statusCode = 400;
        throw error;
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
        const error = new Error("Username is already taken");
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: role || "buyer",
        company_name,
        phone
    });

    const userObj = user.toJSON();
    delete userObj.password;

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
    });

    return { user: userObj, token };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({
        where: { email },
        include: [{ model: Employee, as: "employee_profile" }]
    });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    if (!user.is_active) {
        const error = new Error("Account has been deactivated. Please contact support.");
        error.statusCode = 403;
        throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
    });

    const userObj = user.toJSON();
    delete userObj.password;

    return { user: userObj, token };
};

const getUserProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
        include: [{ model: Employee, as: "employee_profile" }]
    });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    return user;
};

const updateUserProfile = async (userId, updateData) => {
    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const allowedFields = ["company_name", "phone", "username"];
    const payload = {};

    for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
            payload[key] = updateData[key];
        }
    }

    if (updateData.password) {
        payload.password = await hashPassword(updateData.password);
    }

    await user.update(payload);

    const updated = await User.findByPk(userId, {
        attributes: { exclude: ["password"] }
    });

    return updated;
};

const getAllUsers = async (query = {}) => {
    const where = {};

    if (query.role) {
        where.role = query.role;
    }
    if (query.is_active !== undefined) {
        where.is_active = query.is_active === "true" || query.is_active === true;
    }

    const users = await User.findAll({
        where,
        attributes: { exclude: ["password"] },
        order: [["created_at", "DESC"]]
    });

    return users;
};

const changeUserRole = async (userId, newRole) => {
    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const validRoles = ["admin", "manager", "operator", "inspector", "driver", "buyer", "employee"];
    if (!validRoles.includes(newRole)) {
        const error = new Error(`Invalid role. Valid roles are: ${validRoles.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    await user.update({ role: newRole });

    return { id: user.id, username: user.username, email: user.email, role: user.role };
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    changeUserRole
};
