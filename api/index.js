const { app } = require('../hospital-backend/server');

// Export the Express app as a handler function for Vercel serverless
// Vercel automatically wraps the Express app with the serverless framework
module.exports = app;
