const express = require("express");
const homeController = require("../controllers/homeController");
const homeRouter = express.Router();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});

homeRouter.get("/", homeController.index);
homeRouter.get("/sign", homeController.sign);
homeRouter.post("/sign", urlencodedParser, homeController.signPost);
homeRouter.get("/signOut", homeController.signOut);
module.exports = homeRouter;