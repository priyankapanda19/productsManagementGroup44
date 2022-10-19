const orderModel = require('../models/orderModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')

const {
    checkEmptyBody,
    isEmpty,
    pincodeValidation,
    cityValidation,
    streetValidation,
    isValidEmail,
    isValidPhone,
    isValidObjectId,
    isValidName,
    isValidPassword } = require("../validation/validation");


const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })

        const isPresent = await userModel.findById(userId)

        if (!isPresent) return res.status(404).send({ status: false, message: "userId id not exist" })

        let cartData = await cartModel.findOne({ userId: userId }).select({ createdAt: 0, updatedAt: 0 }).lean()

        let cartIdFromBody = req.body.cartId

        if(cartIdFromBody){
            if(!isValidObjectId(cartIdFromBody)) return res.status(400).send({ status: false, message: "cartId is invalid" })

            let isPresentCart = await cartModel.findById(cartIdFromBody)

            if(!isPresentCart)  return res.status(400).send({ status: false, message: "cartId is not presnt in DB .." })

            if(cartIdFromBody != cartData._id) return res.status(400).send({ status: false, message: "credetial are incorrect" })
        }

        let items = cartData.items

        let totalQuantity = 0

        for (let i = 0; i < items.length; i++) {
            let product = items[i]
            totalQuantity = totalQuantity + product.quantity
        }

        let finaldata = {
            ...cartData,
            totalQuantity: totalQuantity
        }

        const orderCreated = await orderModel.create(finaldata)

        let cartUpdate = await cartModel.findByIdAndUpdate({_id:cartData._id}, {$set:{items:[], totalPrice:0,totalItems:0 } }, {new:true})

        return res.status(201).send({ status: true, message: "Succeess", data: orderCreated  })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })

        const isPresent = await userModel.findById(userId)

        if (!isPresent) return res.status(404).send({ status: false, message: "userId id not exist" })

        let body = req.body

        if (Object.keys(body).length == 0) {
            return res.status(400).send({ status: false, message: "empty body ..." })
        }


        // if(!(body.status == pending || body.status == completed || body.status == cancled ) )
        // return res.status(400).send({ status: false, message: "status invalid" })

        if (["pending", "completed", "cancled"].indexOf(body.status) == -1)
            return res.status(400).send({ status: false, message: "status invalid" })

        let orderId = body.orderId

        if(!isEmpty(orderId)) return res.status(400).send({ status: false, message: "order id is mandatory" })

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "order id is invalid" })

        let order = await orderModel.findById(orderId)//.lean()

        if(!order) return res.status(404).send({ status: false, message: "order is not exist" })

        if (order.userId != userId) return res.status(403).send({ status: false, message: "order does not belong to user" })

        // if (order.cancellable != true) return res.status(403).send({ status: false, message: "this is not cancellable item" })

        // const orderUpdated = await orderModel.findByIdAndUpdate(orderId, { $set: { status: body.status} }, { new: true })

        if(order.cancellable == true){
            const orderUpdated = await orderModel.findByIdAndUpdate(orderId, { $set: { status: body.status} }, { new: true })
            return res.status(200).send({ status: true, message: "Succeess", data: orderUpdated })

        }else{
            if(body.status == "cancled") return res.status(400).send({ status: false, message: "this is not cancellable item" })
            const orderUpdated = await orderModel.findByIdAndUpdate(orderId, { $set: { status: body.status} }, { new: true })
            return res.status(200).send({ status: true, message: "Succeess", data: orderUpdated })
        }

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

module.exports = { createOrder, updateOrder }