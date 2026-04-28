const { app } = require('../hospital-backend/server');

// Export a handler function for serverless platforms (Vercel expects a function)
module.exports = (req, res) => {
	return app(req, res);
};
