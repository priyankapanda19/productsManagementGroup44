const JWT = require('jsonwebtoken');
const { isValidObjectId } = require('../validation/validation')
const userModel = require("../models/userModel");



const Authentication = async (req, res, next) => {
    try {
        // accessing token from headers
        let token = req.headers.authorization;
        if (!token) return res.status(401).send({ status: false, message: 'TOKEN is missing !!!' });

        // console.log({ token: token })

        let user = token.split(' ');

        // console.log({ token: user })

        JWT.verify(
            user[1],
            " ~ functionUp--project-5--product-management-group-44 ~ ",
            (error, decodedToken) => {
                if (error) return res.status(400).send({ status: false, message: error.message })
                req.userId = decodedToken.userId
                next()
            });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const Authorization = async (req, res, next) => {
    try {
        // taking userId from params
        let userId = req.params.userId

        // validating id
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "User id not valid" });

        // finding user in DB
        let checkUser = await userModel.findById(userId)
        if (!checkUser) return res.status(404).send({ status: false, message: "User not found" })

        // authorizing the user
        if (userId != req.userId) return res.status(403).send({ status: false, message: "user not authorized" })

        // sending whole user document to global
        req.checkUser = checkUser;
        next();
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { Authentication, Authorization };