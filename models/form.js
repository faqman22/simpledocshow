const firebase = require("firebase");
const admin = require("firebase-admin");
let db = admin.firestore();


module.exports = class Form {
    constructor(id){
        this.id = id;
    }
    getForm(callback){
        db.collection("public").doc(this.id).get().then(doc =>{
            let text = doc.data()['text'];
            this.getField(text,callback);
        })
    }
    getField(text,callback){
        let begin = 0;
        let end = 0;
        let start = 0;
        let mass = [];
        // let wordText="";
        // let fields = ["s","ss","sss"];

        while (text.indexOf("{", start) !== -1) {
            begin =  text.indexOf("{", start);
            end = text.indexOf("}", start);
            // wordText += text.slice(start,begin) + fields[0];
            let field = text.slice(begin+1, end);
            mass.push(field);
            start = (text.indexOf("}", start)) + 1;
        }
        callback(mass);
    }
    getWordDoc(fields,callback){
        db.collection("public").doc(this.id).get().then(doc =>{
            let text = doc.data()['text'];
            let begin = 0;
            let end = 0;
            let start = 0;
            let wordText ="";
            let nArg = 0;

            while (text.indexOf("{", start) !== -1) {
                begin =  text.indexOf("{", start);
                end = text.indexOf("}", start);
                wordText += text.slice(start,begin) + fields[nArg];
                nArg ++;
                start = (text.indexOf("}", start)) + 1;
            }
            wordText += text.slice(start);
            callback(wordText);

        })
    }


}