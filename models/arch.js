let fs = require('fs-extra');
let archiver = require('archiver');
const admin = require("firebase-admin");
const firebase = require("firebase");
let db = admin.firestore();
const officegen = require('officegen');
const path = require('path');
const os = require('os');
const docDir = path.join(os.tmpdir(), "/docsFolder");
module.exports = class Arch {
    constructor(docName) {
        this.docName = docName;
    }


    getArch(callback) {

        // Get every single documents from db and add to archive
        db.collection(`/users/faq@gmail.com/readyDocs/${this.docName}/collection`).get().then(docs => {
            if (docs.size === 0) {
                callback("Not exists", null);
            } else {

                let id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                let archId = id + ".zip";
                let pathToArch = path.join(docDir, archId);

                fs.ensureDir(docDir, err => {
                    if (err) console.log("can't ensure");
                    else {
                        let output = fs.createWriteStream(pathToArch);

                        let archive = archiver('zip', {
                            zlib: {level: 9} // Sets the compression level.
                        });
                        archive.on('error', function (err) {
                            callback(err, pathToArch);
                        });

                        //Archive was created, we can delete docx files
                        output.on('close', function () {
                            console.log("Done make arch");
                            callback(null, pathToArch);
                            fs.remove(path.join(docDir, id), err => {
                                if (err) throw err;
                            })

                        });

                        archive.on('warning', function (err) {
                            if (err.code === 'ENOENT') {
                                console.log("we have warnings from ahrcive ", err);
                            } else {
                                // throw error
                                console.log("Error! ", err);
                                throw err;
                            }
                        });
                        archive.pipe(output);

                        fs.ensureDir(path.join(docDir, id), err => {
                            if (err) callback(err);
                            else {

                                //add all docs to folder
                                for (let i = 0; i < docs.size; i++) {
                                    let docx = officegen('docx');
                                    let docName = `Документ ${i + 1}.docx`;
                                    let out = fs.createWriteStream(path.join(docDir, id, docName));


                                    // create event on last document and make arch from folder
                                    if (docs.size - i === 1) {
                                        out.on('finish', () => {
                                            console.log("finish last outPut");
                                            archive.directory(path.join(docDir, id), false);
                                            archive.finalize();
                                        })
                                    }

                                    let p = docx.createP();
                                    p.addText(docs.docs[i].data().text);
                                    docx.generate(out);

                                }
                            }

                        })
                    }
                })

            }

        })

    }
}