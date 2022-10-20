const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const cartModel = require('../models/cartModel');

const { checkEmptyBody, isEmpty, isValidObjectId } = require("../validation/validation");


const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        userId = userId.trim();
        let bodyData = req.body;

        // validating userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: `userId: ${userId} is invalid.` });

        // fetching userData from DB
        const isPresentUser = await userModel.findById(userId);
        if (!isPresentUser) return res.status(404).send({ status: false, message: "user is not exist." });

        // Authorizing user
        if (userId !== req.userId) return res.status(403).send({ status: false, msg: 'unauthorized User access !!' });

        if (!checkEmptyBody(bodyData)) return res.status(400).send({ status: false, message: "request Body cant be empty" });

        let { cartId, cancellable, status } = bodyData;

        if (!isEmpty(cartId)) return res.status(400).send({ status: false, message: "cartId must be present" });
        if (typeof cartId != "string") return res.status(400).send({ status: false, message: " Enter cartId in valid (String) format!!! " });

        cartId = cartId.trim();
        
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: `Invalid cartId: ${cartId} provided.` });

        // finding the user's cart
        let cartData = await cartModel.findOne({ _id: cartId }).select({ _id: 0, userId: 1, items: 1, totalPrice: 1, totalItems: 1 }).lean();
        if (!cartData) return res.status(404).send({ status: false, message: " cart not found" });

        if (cartData.totalItems == 0) return res.status(400).send({ status: false, message: `there is no product available in your cart.` });

        if (userId != cartData.userId) return res.status(400).send({ status: false, message: `you are not authorized to initiate order in another person's cart.` });


        let items = cartData.items

        let totalQuantity = 0;
        for (let i = 0; i < items.length; i++) {
            let product = items[i]
            totalQuantity = totalQuantity + product.quantity
        }

        let finalDataObj = {
            ...cartData,
            totalQuantity: totalQuantity
        }

        if (status) {
            status = status.trim().toLowerCase();
            if (typeof status != "string") return res.status(400).send({ status: false, message: "Status is in Invalid format." });
            if (status !== "pending") return res.status(400).send({ status: false, message: "Status field should be pending while creating an order" })
            finalDataObj.status = status;
        }

        if (isEmpty(cancellable)) {
            if (typeof cancellable != "boolean") return res.status(400).send({ status: false, message: "Cancellable should be of Boolean type" })
            finalDataObj.cancellable = cancellable;
        }

        const orderCreated = await orderModel.create(finalDataObj);

        let deleteCartObject = { items: [], totalPrice: 0, totalItems: 0 }
        let deletedCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            deleteCartObject,
            { new: true }
        );

        return res.status(201).send({ status: true, message: "Success", data: orderCreated })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const updateOrder = async (req, res) => {
    try {
        // taking userId from path param
        let userId = req.params.userId.trim();
        let body = req.body;

        // validating userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: `userId: ${userId} is invalid.` });

        // fetching userData from DB
        const isPresent = await userModel.findById(userId);
        if (!isPresent) return res.status(404).send({ status: false, message: `user with this userId: ${userId} id not exist` });

        // Authorizing user
        if (userId !== req.userId) return res.status(403).send({ status: false, msg: 'unauthorized User access !!' });


        if (!checkEmptyBody(body)) return res.status(400).send({ status: false, message: "empty body ..." });


        let { orderId, status } = body;

        if (!isEmpty(orderId)) return res.status(400).send({ status: false, message: `orderId required.` });
        orderId = orderId.trim();
        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: `orderId: ${orderId} is invalid.` });


        let findOrder = await orderModel.findOne({ _id: orderId, isDeleted: false });
        if (!findOrder) return res.status(404).send({ status: false, message: "order not found for this user !!" });

        if (findOrder.userId != userId) return res.status(403).send({ status: false, message: "ACCESS DENIED !!! order does not belong to user" });


        if (!isEmpty(status)) return res.status(400).send({ status: false, message: "status required to update." });
        if (typeof status != "string") return res.status(400).send({ status: false, message: "Status should be in string format" });

        if (['completed', 'canceled'].indexOf(status) == -1) return res.status(400).send({ status: false, message: "status is invalid, please provide status between >> completed, canceled" });

        if (findOrder.status == 'canceled' || findOrder.status == 'completed') return res.status(400).send({ status: false, message: "this order is already canceled or completed, can't update further from there." });

        if (status == 'cancelled') {
            if (findOrder.cancellable == false) return res.status(400).send({ status: false, message: "this order is already cancelled !!!" });
        }

        findOrder.status = status;
        findOrder.save();

        return res.status(200).send({ status: true, message: "Success", data: findOrder })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { createOrder, updateOrder }