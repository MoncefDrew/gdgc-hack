/**
 * Middleware to validate name search parameter
 * Ensures the name parameter exists and has a minimum length
 */
exports.validateNameSearch = (req, res, next) => {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name parameter is required'
      });
    }
    
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name search term must be at least 2 characters long'
      });
    }
    
    next();
  };