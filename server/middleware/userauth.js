const jwt = require('jsonwebtoken')
require('dotenv').config()


const userauth = async(req , res,next)=>{
    const {token} = req.cookies;
    if(!token){
        res.status(404).json({
            success:false,
            message: "not authorization , login again"
        })
    }try{
        const tokendecode = jwt.verify(token,process.env.JWT_PASS);
        if(tokendecode.id){
            if(!req.body) req.body={};
            req.body.userID = tokendecode.id
        }else{
            res.status(404).json({
            success:false,
            message: "not authorization , login again"
        })
        }
         next();
         
    }catch(e){
         res.status(404).json({
            success:false,
            message: e.message
        })

    }

}

module.exports = userauth