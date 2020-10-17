const firebase = require("firebase");
exports.index = function (req, res) {
    //todo make home page
    res.redirect("app/doc/get");
};
exports.sign = function (req, res) {

    res.render("home/sign", {
        layout: false,
        host: global.host
    });
};
exports.signPost = function (req, res) {
    let email = req.body.email;
    let pass = req.body.pass;
    firebase.auth().signInWithEmailAndPassword(email, pass).then(function (cr) {
        res.redirect("../doc/get");
    })
        .catch(function (error) {
            res.render("home/sign", {
                failAuth: true,
                host:global.host,
                layout: false
            })
        });
};
exports.signOut = function (req, res) {
    firebase.auth().signOut().then(function () {
        res.redirect(global.host + "/doc/get");
    }).catch(function (error) {
        console.log("error in sign out method ", error);
    });
}