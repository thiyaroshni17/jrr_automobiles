const express = require('express')
const { register, login, logout, Resetpasswordotp, resetpassword, isauth, userdata } = require('../controller/user.js')
const userauth = require('../middleware/userauth.js')

const { createPettyCash,updatePettyCash,deletePettyCash,listPettyCash,getPettyCashById,addPettyEntry,updatePettyEntry,deletePettyEntry} = require("../controller/pettycash.js");
const {createWaterWash,updateWaterWash,deleteWaterWash,listWaterWash,getWaterWashById,addWashEntry,updateWashEntry,deleteWashEntry,} = require("../controller/collectionWW.js");
const {createBodyShop,updateBodyShop,deleteBodyShop,listBodyShop,getBodyShopById,addBodyEntry,updateBodyEntry,deleteBodyEntry,} = require("../controller/collectionBS.JS");
const ctrl = require('../controller/jobcard'); 
const Router = express.Router()

Router.post('/register',register)
Router.post('/login',login)
Router.post('/logout',logout)
Router.get('/isauth',userauth,isauth)
Router.get('/data',userauth,userdata)
Router.post('/resetotp',Resetpasswordotp)
Router.post('/resetpassword',resetpassword)



Router.post('/jobcard/create', ctrl.createJobCard);
Router.get('/jobcard/list', ctrl.listJobCards);
Router.get('/jobcard/list/:id', ctrl.getJobCardById);
Router.put('/jobcard/update/:id', ctrl.updateJobCard);
Router.delete('/jobcard/delete/:id', ctrl.deleteJobCard);
Router.post('/jobcard/:id/spares', ctrl.addSpare);
Router.patch('/jobcard/:id/spares/update/:itemId', ctrl.updateSpare);
Router.delete('/jobcard/:id/spares/delete/:itemId', ctrl.deleteSpare);
Router.post('/jobcard/:id/labours', ctrl.addLabour);
Router.patch('/jobcard/:id/labours/update/:itemId', ctrl.updateLabour);
Router.delete('/jobcard/:id/labours/delete/:itemId', ctrl.deleteLabour);

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