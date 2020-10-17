const admin = require("firebase-admin");
const firebase = require("firebase");
const fs = require('fs-extra');
let db = admin.firestore();
const officegen = require('officegen');
const path = require('path');
const os = require('os');
const docDir = path.join(os.tmpdir(),"/docsFolder");

module.exports.getList = function (callback) {
    let user = firebase.auth().currentUser;
    if (user != null) {
        let docsCollection = [];
        let docDb = db.collection("users/" + user.email + "/readyDocs");
        docDb.get()
            .then(docs => {
                docs.forEach(doc => {
                    docsCollection.push(doc.id);
                });
                callback(null, docsCollection);

            }).catch(err => {
            callback(err, null);
        });
    } else {
        callback("empty user", null);
    }
}

module.exports.getById = function (docName, docId, callback) {
    let user = firebase.auth().currentUser;
    if (user != null) {

        let docDb = db.collection("users/" + user.email + "/readyDocs/" + docName + "/collection/").doc(docId)
        docDb.get()
            .then(d => {
                if (d.exists) {
                    callback(null, d.data()["text"]);
                } else {
                    callback("not exists", null)
                }

            }).catch(err => {
            callback(err, null);
        });
    } else {
        callback("Fail to get Doc", null);
    }

}

module.exports.getByName = function (docName, callback) {
    let user = firebase.auth().currentUser;

    let docDb = db.collection("users/" + user.email + "/readyDocs/" + docName + "/collection");
    docDb.get().then(docs => {
        let list = [];
        docs.forEach(doc => {
            list.push(doc.id);
        });
        callback(null, list);
    }).catch(err => {
        callback(err, null);
    });

}
module.exports.downloadById = function (docName, docId, callback) {
    let user = firebase.auth().currentUser;
    let docx = officegen('docx');

    db.collection("users/" + user.email + "/readyDocs/" + docName + "/collection/").doc(docId).get().then(d => {




        let p = docx.createP();
        p.addText(d.data()["text"]);
        let docName = docId + ".docx";
        fs.ensureDir(docDir, err =>{
            if(!err){
                let pathToDocFile = path.join(docDir,docName);
                let out = fs.createWriteStream(pathToDocFile);

                out.on('error', function(err) {
                    callback(null,err);
                });
                out.on('finish', ()=> {
                    callback(pathToDocFile, null);
                });
                docx.generate(out);
            } else {
                callback(null, err);
            }
        })

        }).catch( err => callback(null,err));

}

