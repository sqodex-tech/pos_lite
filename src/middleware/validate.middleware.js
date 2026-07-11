const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        // Update request objects with validated/transformed data
        req.body = validatedData.body;
        req.query = validatedData.query;
        req.params = validatedData.params;

        next();
    } catch (error) {
        const errors = error.errors?.map(err => ({
            path: err.path.join('.'),
            message: err.message
        })) || [];
        next(new ApiError(422, 'Validation Error', errors));
    }
};

module.exports = validate;
