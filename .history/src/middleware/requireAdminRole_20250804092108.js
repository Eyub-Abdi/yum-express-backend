//  HELLO CODERS
//  NIAMBIE NANI ATARUHUSIWA KUPITA (ATAKAE PATIA ANANIDAI SALIO) LETS GO     ENGINEERS
const requireAdminRole = requiredRole => (req, res, next) => {
  if (requiredRole === 'admin') {
    // Allow both admins and superadmins
    if (req.user?.type !== 'admin' || (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (requiredRole === 'superadmin') {
    // Only allow superadmins
    if (req.user?.type !== 'admin' || req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  next()
}
// THE DAY I WROTE THIS MIDDLEWARE
// I POSTED IT ON MY WHAT'S APP STATUS AS A CHALLANGE AND NO ONE GOT IT RIGHT
// THE QUESTION WAS VERY SIMPLE __WHO DO YOU THINK WILL PASS THIS GATE?
// OK I JUST WANT TO REFRESH __KAZI IENDELEE
// IN CASE YOU ARE CURIOUS THAT DAY WAS  Apr 10th 2025
module.exports = { requireAdminRole }
