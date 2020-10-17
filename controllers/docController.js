const Doc = require("../models/document");
const firebase = require("firebase");
const Arch = require("../models/arch");
const readyDoc = require("../models/readyDoc");
const fs = require('fs-extra');
const textract = require('textract');
const Busboy = require('busboy');
const os = require('os');
const path = require('path');
const docxParser = require('docx-parser');





exports.addDoc = function (req, res) {

    res.render("doc/add", {host: global.host});
};

exports.postUpload = function (req, res) {

try{
    let busboy = new Busboy({
        headers: req.headers

    });

    let id, filepath, filename;
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log("have a file event");
        if (mimetype === "text/plain" ||
            mimetype === "application/msword" ||
            mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimetype === "text/rtf" ||
            mimetype === "application/pdf"){


            // original id for temporary file
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            file.on('data', function (data) {



                textract.fromBufferWithMime(mimetype, Buffer.from(data),{preserveLineBreaks:true}, function( error, text ) {
                    if(error) res.render(error);
                    else {
                        let name = filename.slice(0, filename.lastIndexOf("."));
                        res.render("doc/add", {text: text, name: name});
                    }


                })

            });


        } else {

            res.send("Неизвестный формат документа")
        }
    });


    busboy.on('finish', function () {
        console.log("busboy finished");
    });
    busboy.end(req.rawBody);
} catch (e) {
    console.log('we have e ' + e )
}


}
exports.download = function (req, res) {
    let docId = req.query["id"];
    let docName = req.params["name"];
    if (docId == null) {
        res.send("Документ не найден")
    } else {
        readyDoc.downloadById(docName, docId, (path,err) => {
            if(!err){

                res.download(path, docId + ".docx", function (err) {
                    if (err) {
                        // Handle error, but keep in mind the response may be partially-sent
                        // so check res.headersSent
                        console.log("have er " + err)
                    } else {
                        // decrement a download credit, etc.
                        fs.unlink(path, err => {
                            if (err) throw err;
                            console.log(docId + " was deleted");
                        })
                    }
                })
            } else {
                res.send("Error while get file from DB")
            }

        })
    }


}
exports.delete = function (req, res) {
    let docName = req.params['name'];
    let id = req.query['id'];
    let doc = new Doc();
    if (id == null) {
        doc.deleteByName(docName, err => {
            if (err == null) {
                res.redirect(global.host + '/doc/get');
            } else {
                res.send("Fail do delete document " + err);
            }
        })
    } else {
        doc.deleteById(docName, id, err => {
            if (err == null) {
                res.redirect(global.host + '/doc/get');
            } else {
                res.send("Fail do delete document " + err);
            }
        });


    }
}
exports.getDoc = function (req, res) {
    let doc = new Doc();
    doc.getDocuments(function (docs) {
        res.render("doc/list", {
            documents: docs,
            host: global.host
        });
    });
};
exports.getListByName = function (req, res) {
    let docName = req.params['name'];
    let docId = req.query.id;
    if (docId == null) {
        readyDoc.getByName(docName, (err, list) => {
            if (err) {
                console.log(err);
            } else {
                res.render("doc/docIdList", {
                    docName: docName,
                    documents: list,
                    host: global.host,
                    uniq: true
                });
            }

        });
    } else {
        readyDoc.getById(docName, docId, (err, text) => {
            if (err == null) {
                res.render("doc/unique", {
                    text: text,
                    name: docName,
                    docId: docId,
                    host: global.host,
                });
            } else {
                console.log("Fail to render html " + err);
                res.send("Ошибка")
            }
        });
    }
};

exports.getList = function (req, res) {
    readyDoc.getList((err, list) => {
        if (err) {
            console.log(err);
        }
        res.render("doc/readyDocList", {
            documents: list,
            host: global.host
        });
    })
};

exports.getDocsArchive = function (req, res) {
    let docName = req.params['name'];
    let arch = new Arch(docName);
    arch.getArch((err, id) => {
        if (err != null) {
            res.send(err)
        } else {
            res.download(id, docName + ".zip", err => {
                if (err) {
                    res.send("Ошибка при загрузке файла! " + err );
                }
                fs.remove(id, err => {
                    if(err) console.log('did not delete ' +err);
                    else console.log("deleted " + id);
                });


            });
        }

    })

}
exports.postAddDoc = function (req, res) {
    console.log("we have post form");
    let name = req.body.name;
    let text = req.body.docText;
    let er = checkText(text);
    if (er == null) {
        let doc = new Doc(name, text);
        doc.save(function (saveEr) {
            if (saveEr != null) {
                res.render("doc/add", {
                    name: name,
                    text: text,
                    failName: true,
                    error: saveEr,
                    host: global.host
                });
            } else {

                res.render("doc/add", {
                    success: true,
                    host: global.host
                });
            }
        });

    } else {
        er === 1 ? er = "Где то пропустили символ {}" : er = "Добавьте {}";
        res.render("doc/add", {
            name: name,
            text: text,
            failText: true,
            error: er,
            host: global.host
        });
    }
};
exports.change = function (req, res) {
    let doc = new Doc();


    doc.getById(req.query.id, d => {
        if (d != null) {

            let publicId = d.data()['publicId'];
            res.render("doc/change", {
                id: publicId,
                name: d.id,
                text: d.data()['text'],
                host: global.host
            });

        } else {
            res.send("Документ не найден");
        }

    })

};
exports.changePost = function (req, res) {
    let name = req.body.name;
    let newName = req.body.newName;
    let text = req.body.docText;
    let er = checkText(text);
    if (er == null) {
        let doc = new Doc(name, text);
        doc.change(name, newName, (er, publicId) => {
            if (er != null) {
                res.render("doc/change", {
                    id: publicId,
                    name: name,
                    text: text,
                    failName: true,
                    error: er,
                    host: global.host
                });

            } else {

                res.render("doc/change", {
                    id: publicId,
                    name: newName,
                    text: text,
                    success: true,
                    host: global.host
                })
            }

        });


    } else {
        er === 1 ? er = "Где то пропустили символ {}" : er = "Добавьте {}";
        res.render("doc/add", {
            name: name,
            text: text,
            failText: true,
            error: er,
            host: global.host
        });
    }

};

function checkText(text) {
    let error;
    if (!text.includes("{")) {
        error = 0;
    } else {
        let num1 = 0;
        let num2 = 0;
        let start = 0;
        while (text.indexOf("{", start) !== -1) {
            num1++;
            start = (text.indexOf("{", start)) + 1;
        }
        start = 0;
        while (text.indexOf("}", start) !== -1) {
            num2++;
            start = (text.indexOf("}", start)) + 1;
        }
        if (!(num1 === num2 && (num1 + num2) % 2 === 0)) {
            error = 1
        }

    }
    return error;
}
