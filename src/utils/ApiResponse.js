class ApiResponse {
    constructor(statusCode, data, message = 'Success', meta = null) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.meta = meta;
        this.success = statusCode < 400;
        this.error = statusCode >= 400 ? message : null;
    }
}

module.exports = ApiResponse;
