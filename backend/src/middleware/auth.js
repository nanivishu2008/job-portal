const jwt = require('jsonwebtoken');
const requireAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ success:false, message:'No token provided.' });
  try {
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch(e) {
    const msg = e.name==='TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    res.status(401).json({ success:false, message:msg });
  }
};
const requireRole = (...roles) => (req,res,next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Not authenticated.' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:`Access denied. Requires: ${roles.join(' or ')}.` });
  next();
};
module.exports = { requireAuth, requireRole };

