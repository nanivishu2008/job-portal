const errorHandler = (err, req, res, next) => {
  console.error('??', err.message);
  if (err.code==='23505') return res.status(409).json({ success:false, message:'Duplicate entry.' });
  if (err.code==='23503') return res.status(400).json({ success:false, message:'Referenced record not found.' });
  res.status(err.statusCode||500).json({ success:false, message:err.message||'Internal server error.' });
};
module.exports = errorHandler;

