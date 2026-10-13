const multer = require('multer'), path=require('path'), crypto=require('crypto'), fs=require('fs');
const DIR = path.join(__dirname,'../../uploads');
if(!fs.existsSync(DIR)) fs.mkdirSync(DIR,{recursive:true});
const storage = multer.diskStorage({
  destination:(_,__,cb)=>cb(null,DIR),
  filename:(_,file,cb)=>cb(null,crypto.randomBytes(16).toString('hex')+path.extname(file.originalname).toLowerCase())
});
module.exports = multer({
  storage, limits:{fileSize:parseInt(process.env.MAX_FILE_SIZE_MB||'5',10)*1024*1024},
  fileFilter:(_,f,cb)=>f.mimetype==='application/pdf'?cb(null,true):cb(new Error('PDF only.'),false)
});

