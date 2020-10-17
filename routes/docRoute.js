const express = require("express");
const docController = require("../controllers/docController");
const firebase = require("firebase");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});
const docRouter = express.Router();


docRouter.use(function (req, res, next) {
    console.log("method work");
    let unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            unsubscribe();
            next();
        } else {
            unsubscribe();
            res.redirect(`${global.host}/home/sign`);
        }
    });
    // let user = firebase.auth().currentUser;
    // user == null ? res.redirect(`${global.host}/home/sign`) : next();
});

docRouter.get("/change", docController.change);
docRouter.post("/change", urlencodedParser, docController.changePost);
docRouter.get("/get", docController.getDoc);
docRouter.get("/add", docController.addDoc);
docRouter.get("/arch/:name", docController.getDocsArchive);
docRouter.post("/add", urlencodedParser, docController.postAddDoc);
docRouter.get("/list/:name", docController.getListByName);
docRouter.get("/list", docController.getList);
docRouter.post("/download/:name", docController.download);
docRouter.post("/delete/:name", docController.delete);
docRouter.post("/upload", docController.postUpload)

module.exports = docRouter;
