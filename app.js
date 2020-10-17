const express = require("express");
const app = express();
const hbs = require("hbs");
const expressHbs = require("express-handlebars");
const firebase = require("firebase");
const bodyParser = require("body-parser");
const firebaseConfig = {
    apiKey: "AIzaSyBrWgVrFynrh5EnXxOawvcyZaMkVLC6fls",
    authDomain: "simpledocproject.firebaseapp.com",
    databaseURL: "https://simpledocproject.firebaseio.com",
    projectId: "simpledocproject",
    storageBucket: "simpledocproject.appspot.com",
    messagingSenderId: "300726465767",
    appId: "1:300726465767:web:d1e408324c053f23e81e42"
};
firebase.initializeApp(firebaseConfig);
const admin = require("firebase-admin");
const config = require("./simpledocproject-firebase-adminsdk-3dnm5-fac0e261f4.json");
admin.initializeApp({
    credential: admin.credential.cert(config)
});


const docRouter = require("./routes/docRoute");
const homeRouter = require("./routes/homeRoute");
const publicRouter = require("./routes/publicRoute");
const testHosting = "http://localhost:5000/simpledocproject/us-central1/app";
const workHosting = "https://us-central1-simpledocproject.cloudfunctions.net/app";

global.host = workHosting;


app.set("view engine", "hbs");

app.engine("hbs", expressHbs(
    {
        layoutsDir: "views/layout",
        defaultLayout: "layout",
        extname: "hbs",
        helpers: {
            getFields: function (fields) {
                let result = "";
                for (let i = 0; i < fields.length; i++) {
                    result += `<div class=form-group>`;
                    let label = `<label for=arg_${i}` + `>` + fields[i] + `</label>`;
                    let input = `<input type=text name=arg_${i} ` + `class=form-control>`;
                    result += label + input + `</div>`;
                }
                return new hbs.SafeString(result);
            }


        }
    }
));
app.use(express.static('public'));
app.use("/doc", docRouter);
app.use("/home", homeRouter);
app.use("/public", publicRouter);
app.use("/", homeRouter);
app.use(function (req, resp) {
    resp.send("404 not found page")
});
module.exports = app;