try {
  const { verifyToken } = require('./middleware/authMiddleware');
  console.log('Path from server/ verified');
} catch(e) { console.error('Failed from server/', e.message); }

try {
  const p = require('path');
  const pathFromRoute = p.join(__dirname, 'routes', '..', 'middleware', 'authMiddleware');
  const { verifyToken } = require(pathFromRoute);
  console.log('Path from server/routes/ simulation verified');
} catch(e) { console.error('Failed from server/routes/ simulation', e.message); }
