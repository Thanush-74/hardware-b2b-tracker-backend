const validateRequiredFields = (requiredFields = []) => {
    return (req, res, next) => {
        const missingFields = [];
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        next();
    };
};

module.exports = {
    validateRequiredFields
};
