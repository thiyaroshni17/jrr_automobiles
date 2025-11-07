const express = require('express')
const { register, login, logout, Resetpasswordotp, resetpassword, isauth, userdata } = require('../controller/user.js')
const userauth = require('../middleware/userauth.js')
const { createJobCard, updateJobCard, listJobCards,getJobCardById,deleteJobCard, } = require('../controller/jobcard.js')
const { createPettyCash,updatePettyCash,deletePettyCash,listPettyCash,getPettyCashById,addPettyEntry,updatePettyEntry,deletePettyEntry} = require("../controller/pettycash.js");
const {createWaterWash,updateWaterWash,deleteWaterWash,listWaterWash,getWaterWashById,addWashEntry,updateWashEntry,deleteWashEntry,} = require("../controller/collectionWW.js");
const {createBodyShop,updateBodyShop,deleteBodyShop,listBodyShop,getBodyShopById,addBodyEntry,updateBodyEntry,deleteBodyEntry,} = require("../controller/collectionBS.JS");
const Router = express.Router()

Router.post('/register',register)
Router.post('/login',login)
Router.post('/logout',logout)
Router.get('/isauth',userauth,isauth)
Router.get('/data',userauth,userdata)
Router.post('/resetotp',Resetpasswordotp)
Router.post('/resetpassword',resetpassword)


Router.post('/jobcard/create',createJobCard)
Router.put('/jobcard/update/:id',updateJobCard)
Router.get('/jobcard/list', listJobCards);
Router.get('/jobcard/:id', getJobCardById);
Router.delete('/jobcard/delete/:id', deleteJobCard);


Router.post("/pettycash/create", createPettyCash);
Router.put("/pettycash/update/:id", updatePettyCash);
Router.delete("/pettycash/delete/:id", deletePettyCash);
Router.get("/pettycash/list", listPettyCash);
Router.get("/pettycash/:id", getPettyCashById);
Router.post("/pettycash/:id/entry", addPettyEntry);
Router.put("/pettycash/:id/entry/:entryId", updatePettyEntry);
Router.delete("/pettycash/:id/entry/:entryId", deletePettyEntry);


Router.post("/waterwash/create", createWaterWash);
Router.put("/waterwash/update/:id", updateWaterWash);
Router.delete("/waterwash/delete/:id", deleteWaterWash);
Router.get("/waterwash/list", listWaterWash);
Router.get("/waterwash/:id", getWaterWashById);
Router.post("/waterwash/:id/entry", addWashEntry);
Router.put("/waterwash/:id/entry/:entryId", updateWashEntry);
Router.delete("/waterwash/:id/entry/:entryId", deleteWashEntry);


Router.post("/bodyshop/create", createBodyShop);
Router.put("/bodyshop/update/:id", updateBodyShop);
Router.delete("/bodyshop/delete/:id", deleteBodyShop);
Router.get("/bodyshop/list", listBodyShop);
Router.get("/bodyshop/:id", getBodyShopById);
Router.post("/bodyshop/:id/entry", addBodyEntry);
Router.put("/bodyshop/:id/entry/:entryId", updateBodyEntry);
Router.delete("/bodyshop/:id/entry/:entryId", deleteBodyEntry);












module.exports = Router