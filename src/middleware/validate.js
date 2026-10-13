'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware: checks express-validator results.
 * Returns 422 with a structured errors array if validation failed.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { handleValidationErrors };
