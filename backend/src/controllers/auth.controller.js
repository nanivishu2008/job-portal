const bcrypt=require('bcryptjs'), jwt=require('jsonwebtoken');
const {validationResult}=require('express-validator');
const {findUserByEmail,findUserById,createUserWithProfile}=require('../models/auth.model');
const sign = u=>jwt.sign({id:u.id,email:u.email,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});

const register = async(req,res,next)=>{
  try{
    const e=validationResult(req); if(!e.isEmpty()) return res.status(400).json({success:false,errors:e.array()});
    const{email,password,role,fullName,companyName,contactName}=req.body;
    if(await findUserByEmail(email)) return res.status(409).json({success:false,message:'Email already registered.'});
    const passwordHash=await bcrypt.hash(password,12);
    const profileData=role==='candidate'?{fullName}:{companyName,contactName};
    const user=await createUserWithProfile({email,passwordHash,role,profileData});
    res.status(201).json({success:true,message:'Registration successful.',token:sign(user),
      user:{id:user.id,email:user.email,role:user.role,createdAt:user.created_at}});
  }catch(e){next(e);}
};

const login = async(req,res,next)=>{
  try{
    const e=validationResult(req); if(!e.isEmpty()) return res.status(400).json({success:false,errors:e.array()});
    const{email,password}=req.body;
    const user=await findUserByEmail(email);
    if(!user||!await bcrypt.compare(password,user.password_hash))
      return res.status(401).json({success:false,message:'Invalid email or password.'});
    res.json({success:true,message:'Login successful.',token:sign(user),
      user:{id:user.id,email:user.email,role:user.role,createdAt:user.created_at}});
  }catch(e){next(e);}
};

const getMe = async(req,res,next)=>{
  try{
    const user=await findUserById(req.user.id);
    if(!user) return res.status(404).json({success:false,message:'User not found.'});
    res.json({success:true,user});
  }catch(e){next(e);}
};

module.exports={register,login,getMe};

