const express = require("express");
const publicController = require("../controllers/publicController");
const publicRouter = express.Router();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});
publicRouter.get("/form", publicController.form);
publicRouter.post("/form", urlencodedParser, publicController.formPost);
module.exports = publicRouter;