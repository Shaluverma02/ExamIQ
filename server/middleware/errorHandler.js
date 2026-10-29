const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('API Error:', err);

  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON request body', error: 'INVALID_JSON' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File must be no larger than 5 MB', error: 'FILE_TOO_LARGE' });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message, error: 'RESOURCE_NOT_FOUND' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({ success: false, message, error: 'DUPLICATE_KEY' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ success: false, message, error: 'VALIDATION_ERROR' });
  }

  res.status(error.statusCode || err.status || 500).json({
    success: false,
    message: error.message || 'Server Error',
    error: error.code || 'SERVER_ERROR',
  });
};

module.exports = errorHandler;
