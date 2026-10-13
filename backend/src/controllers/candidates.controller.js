const candModel = require('../models/candidate.model');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await candModel.getProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await candModel.updateProfileByUserId(req.user.id, req.body);
    res.json({ success: true, message: 'Profile updated.', data: updated });
  } catch (err) { next(err); }
};

module.exports = { getMyProfile, updateMyProfile };
