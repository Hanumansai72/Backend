/**
 * Role-based access control middleware
 * Roles: admin, customer, Technical, Non-Technical
 */

/**
 * Require specific roles to access a route
 * @param {string[]} allowedRoles - Array of allowed roles
 */
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has an allowed role
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        yourRole: req.user.role || 'none'
      });
    }

    next();
  };
};

/**
 * Require vendor role (either Technical or Non-Technical)
 */
exports.requireVendor = () => {
  return exports.requireRole(['Technical', 'Non-Technical']);
};

/**
 * Require customer role
 */
exports.requireCustomer = () => {
  return exports.requireRole(['customer']);
};

/**
 * Require admin role
 */
exports.requireAdmin = () => {
  return exports.requireRole(['admin']);
};

/**
 * Require Non-Technical vendor OR explicit 'product' role (for product routes)
 */
exports.requireProductVendor = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check for product role OR Non-Technical OR admin
    // Also check Category as fallback for backward compatibility (before migration)
    const hasProductAccess =
      req.user.role === 'product' ||
      req.user.role === 'Non-Technical' ||
      req.user.role === 'admin' ||
      req.user.Category === 'Non-Technical' ||  // Fallback: check Category from JWT
      req.user.category === 'Non-Technical';    // Fallback: lowercase variant

    if (!hasProductAccess) {
      return res.status(403).json({
        message: "Access denied. Product role required.",
        requiredRoles: ['product', 'Non-Technical', 'admin'],
        yourRole: req.user.role || req.user.Category || 'none'
      });
    }

    next();
  };
};

/**
 * Require Technical vendor (for service routes)
 */
exports.requireServiceVendor = () => {
  return exports.requireRole(['Technical', 'admin']);
};

/**
 * Require any authenticated user
 */
exports.requireAuth = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
};
