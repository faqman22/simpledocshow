const admin = require("firebase-admin");
const firebase = require("firebase");
let db = admin.firestore();


function sameName(docDb, user, text, name, callback) {

    let publicId;
    db.collection("users/" + user.email + "/documents").doc(name).get().then(d => {
        publicId = d.data()['publicId'];

        db.collection("public").doc(publicId).update({
            text: text,
            user: user.email,
            name: name
        }).then(() =>{
            docDb.update({
                text: text
            }).then(r => {
                callback(null, publicId)
            });
        });
    });

}


function newDoc(docDb, user, name, newName, text, callback) {
    let oldId;
    let er;

    db.collection("users/" + user.email + "/documents").doc(name).get().then(oldD => {
        oldId = oldD.data()['publicId'];
        db.collection("public").doc(oldId).delete();
        db.collection("public").add({
            text: text,
            user: user.email,
            name: newName
        }).then(ref => {
            docDb.set({
                publicId: ref.id,
                text: text
            }).then(() => {
                    db.collection("users/" + user.email + "/documents").doc(name).delete();
                    console.log(ref.id);
                    callback(null, ref.id);
                }
            )
                .catch(err => {
                    er = "Ошибка при сохранении";
                    callback(er);
                });
        })
    });
}

module.exports = class Document {
    constructor(name, doc) {
        this.name = name;
        this.doc = doc;
    }


    getDocuments(callback) {
        let user = firebase.auth().currentUser;
        let mass = [];
        db.collection("users/" + user.email + "/documents").get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    mass.push(doc.id);
                });
                callback(mass);
            }).catch(err => {
            console.log(err);
        });
    };

    getById(id, callback) {
        let user = firebase.auth().currentUser;
        db.collection("users/" + user.email + "/documents").doc(id).get().then(doc => {
            doc.exists ? callback(doc) : callback(null);
        });
    }


    change(name, newName, callback) {
        let user = firebase.auth().currentUser;
        let er;
        if (user != null) {
            let docDb = db.collection("users/" + user.email + "/documents").doc(newName);
            docDb.get()
                .then(d => {
                    if (newName === name) {
                        sameName(docDb, user, this.doc, name, callback);
                    } else if (d.exists && d.id !== name) {
                        db.collection("users/" + user.email + "/documents").doc(name).get().then(d => {
                            let publicId = d.data()['publicId'];
                            er = "Документ с таким именем уже существует";
                            callback(er, publicId);

                        })

                    } else {
                        newDoc(docDb, user, name, newName, this.doc, callback);
                    }
                    ;
                })
        }
    }

    saveReadyDoc(publicId, text, callback) {
        db.collection("public").doc(publicId).get().then(doc => {
            let user = doc.data()['user'];
            let name = doc.data()['name'];
            let id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            console.log(id);
            db.collection("users/" + user + "/readyDocs").doc(name).set({0:1}).then( () => {
            db.collection("users/" + user + "/readyDocs" + `/${name}/collection`).doc(id).set({
                text: text
            }).then(
                callback(null))
                .catch(err => {
                    let er = "Ошибка при сохранении готового документа";
                    callback(er);
                });
            }).catch(err =>{
                let er = "Ошибка при сохранении готового документа";
                callback(er);
            });


        })

    }


    save(callback) {
        let er;
        let user = firebase.auth().currentUser;
        if (user != null) {

            let docDb = db.collection("users/" + user.email + "/documents").doc(this.name);
            docDb.get()
                .then(d => {
                    if (d.exists) {
                        er = "Документ с таким именем уже существует";
                        callback(er);
                    } else {
                        db.collection("public").add({
                            text: this.doc,
                            user: user.email,
                            name: this.name
                        }).then(ref => {

                            docDb.set({
                                publicId: ref.id,
                                text: this.doc
                            }).then(
                                callback(null))
                                .catch(err => {
                                    er = "Ошибка при сохранении";
                                    callback(er);
                                });
                        })

                    }

                });

        } else {
            console.log("empty user");
            er = "Empty user";
            callback(er);
        }
    };

    // todo transactions

    deleteByName(docName, callback) {
        let user = firebase.auth().currentUser;
        db.collection("users/" + user.email + "/documents").doc(docName).get().then(oldD => {
            let id = oldD.data()['publicId'];
            db.collection("public").doc(id).delete().then(() => {
                db.collection("users/" + user.email + "/documents").doc(docName).delete().then(() => callback(null)
                ).catch(err => callback(err));
            }).catch(err => callback(err));
        })

    }

    deleteById(docName, id, callback){
        let user = firebase.auth().currentUser;
        let doc = db.collection(`users/${user.email}/readyDocs/${docName}/collection`).doc(id).delete()
            .then(callback(null))
            .catch(err => callback(err));

    }



};

