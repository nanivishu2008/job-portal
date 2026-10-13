const express=require('express');
const{body}=require('express-validator');
const{register,login,getMe}=require('../controllers/auth.controller');
const{requireAuth}=require('../middleware/auth');
const router=express.Router();

router.post('/register',[
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min:8}).matches(/\d/),
  body('role').isIn(['candidate','recruiter']),
  body('fullName').if(body('role').equals('candidate')).notEmpty().trim(),
  body('companyName').if(body('role').equals('recruiter')).notEmpty().trim(),
  body('contactName').if(body('role').equals('recruiter')).notEmpty().trim(),
],register);

router.post('/login',[
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
],login);

router.get('/me',requireAuth,getMe);
module.exports=router;

