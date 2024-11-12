class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Read about StatusCode
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
