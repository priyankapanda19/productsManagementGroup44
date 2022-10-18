const aws = require("aws-sdk");


aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
})


let uploadFile = async (file) => {
    
    return new Promise(function (resolve, reject) {

        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });              // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  
            Key: "plutonium/project-5/bookCoverData/" + file.originalname, 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            // console.log(data)
            // console.log("file uploaded successfully")
            return resolve(data.Location)
        })
    })
}

const file = async function (req, res) {
    try {
        let files = req.files

        if (files && files.length > 0) {

            let uploadedFileURL = await uploadFile(files[0])
            res.status(201).send({ msg: "file uploaded succesfully", data: uploadedFileURL })
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

    } catch (error) {
        res.status(500).send({ msg: error.message })
    }

}


module.exports = { uploadFile };