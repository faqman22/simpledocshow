let Form = require("../models/form");
const Doc = require('../models/document');
exports.form = function (req, res) {
    let id = req.query.id;
    let form = new Form(id);
    form.getForm(function (mass) {
        res.render("public/form", {
            fields: mass,
            publicId: id,
            host:global.host,
            layout: false
        });
    });
};
exports.formPost = function (req, res) {
    let publicId = req.body.publicId;
    let fieldsForm = [];
    for (let i = 0; ; i++) {
        let field = req.body[`arg_${i}`];
        if (field == null) {
            break;
        }
        fieldsForm.push(field);
    }
    let formDoc = new Form(publicId);
    formDoc.getWordDoc(fieldsForm, (wordDoc) => {
        let doc = new Doc();
        doc.saveReadyDoc(publicId, wordDoc,er =>{
            if(er == null){
                res.send("Мы получили вашу форму и обрабатываем данные, наш менеджер свяжется с вами в ближайшее время!")
            } else {
                res.send(er);
            }
        });
    });
};
