const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
// const ObjectId = mongoose.Schema.Types.ObjectId


const { isValidObjectId } = require("../validation/validation");

//----------------------create cart--------------------------->>>>>>>>>>>


const createCartdetails = async function (req, res) {
  try {
    let { cartId, productId } = req.body
    let userId = req.params.userId

    let productObj = {
      productId: productId,
      quantity: 1
    }

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter valid user id" })
    let checkUser = await userModel.findOne({ _id: userId })
    if (!checkUser) return res.status(404).send({ status: false, message: "user not found" })

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please enter valid product id" })
    let checkProduct = await productModel.findOne({ isDeleted: false, _id: productId })
    if (!checkProduct) return res.status(404).send({ status: false, message: "product not found" })
    let productPrice = checkProduct.price

    if (cartId) {
      if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "please enter valid cartId id" })
      let cardDetails = await cartModel.findOne({ _id: cartId })
      if (!cardDetails) return res.status(404).send({ status: false, message: "cart not found" })
      if (cardDetails) { if (userId != cardDetails.userId) { return res.status(400).send({ status: false, message: "cartId doesnot belong to this user" }) } }
    }
    let checkCart = await cartModel.findOne({ userId: userId })
    // console.log(checkCart);

    if (checkCart) {

      let checkProductId = checkCart.items.map(x => x.productId.toString())

      if (checkProductId.includes(productId)) {
        let array = checkCart.items
        for (let i = 0; i < array.length; i++) {
          if (checkCart.items[i].productId == productId) {
            array[i].quantity = array[i].quantity + 1
          }
        }
        let increaseQuantity = await cartModel.findOneAndUpdate({ userId: userId }, { items: array, totalPrice: checkCart.totalPrice + productPrice }, { new: true })
        return res.status(200).send({ status: true, message: "items added successfully", data: increaseQuantity })

      } else {
        let addProduct = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: productObj }, $inc: { totalItems: 1, totalPrice: productPrice } }, { new: true })
        return res.status(200).send({ status: true, message: "items added successfully", data: addProduct })
      }

    }

    // create cart
    let createCartObject = {
      userId: userId,
      items: [productObj],
      totalItems: 1,
      totalPrice: productPrice
    }

    let savedData = await cartModel.create(createCartObject)

    return res.status(201).send({ status: true, message: "Success", data: savedData })
  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}



//----------------------update cart--------------------------->>>>>>>>>>>


const updateCart = async (req, res) => {
  try {

    const userIdFromParams = req.params.userId;             // taking :userId from params
    const bodyData = req.body;                              // accessing data found from body

    // checking userId is a correct id
    if (!isValidObjectId(userIdFromParams)) return res.status(400).send({ status: false, message: `userId: ${userIdFromParams}, is not a valid object id.` });
    // checking non empty body
    if (!checkEmptyBody(bodyData)) return res.status(400).send({ status: false, message: "please provide data in request body to update." });

    // searching for user document in DB
    const userData = await userModel.findById(userIdFromParams);
    if (!userData) return res.status(400).send({ status: false, msg: `user with id (${userIdFromParams}), does not exist.` });

    // authorizing user with token's userId
    if (userIdFromParams !== req.userId) return res.status(403).send({ status: false, message: "Unauthorized user access." });


    // destructuring fields from body
    const { cartId, productId, removeProduct } = bodyData;

    // checking and validating fields
    if (!isValid(cartId)) return res.status(400).send({ status: false, msg: "cartId is required." });
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: `cartId: ${cartId}, is invalid.` });

    if (!isValid(productId)) return res.status(400).send({ status: false, msg: "productId is required.." });
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: `productId: ${productId}, is invalid.` });

    // searching data in cart collection
    const searchCart = await cartModel.findById(cartId);
    if (!searchCart) return res.status(404).send({ status: false, msg: `cart does not exist.` });

    // searching data in product collection
    const searchProduct = await productModel.findById(productId);
    if (!searchProduct) return res.status(404).send({ status: false, msg: `product does not exist.` });

    if (searchProduct['isDeleted'] == true) return res.status(400).send({ status: false, msg: `product has already been deleted.` });

    if (!(removeProduct == 0 || removeProduct == 1)) return res.status(400).send({ status: false, msg: `invalid removeProduct: ${removeProduct}, it must be either 0 or 1.` });

    const cart = searchCart.items;
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].productId == productId) {
        const priceChange = cart[i].quantity * searchProduct.price;

        if (removeProduct == 0) {
          const removeProduct = await cartModel.findOneAndUpdate(
            { _id: cartId },
            { $pull: { items: { productId: productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 },
            { new: true }
          );
          return res.status(200).send({ status: true, message: 'Success', data: removeProduct });
        }

        if (removeProduct == 1) {
          if (cart[i].quantity == 1 && removeProduct == 1) {
            const updatedPrice = await cartModel.findOneAndUpdate(
              { _id: cartId },
              {
                $pull: { items: { productId: productId } },
                totalPrice: cartSearch.totalPrice - priceChange, totalItems: cartSearch.totalItems - 1
              },
              { new: true }
            );
            return res.status(200).send({ status: true, message: 'Success', data: updatedPrice });
          }

          cart[i].quantity = cart[i].quantity - 1;
          const updatedCart = await cartModel.findByIdAndUpdate(
            { _id: cartId },
            { items: cart, totalPrice: cartSearch.totalPrice - productSearch.price },
            { new: true }
          );
          return res.status(200).send({ status: true, message: 'Success', data: updatedCart });
        }
      }
      return res.status(400).send({ status: false, message: "Product does not found in the cart" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Error", error: error.message });
  }
}


//----------------------get cart--------------------------->>>>>>>>>>>

const getCart = async function (req, res) {
  try {
    let userId = req.params.userId

    // validation for userId
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });
    }

    let checkUserId = await userModel.findOne({ _id: userId })
    if (!checkUserId) {
      return res.status(404).send({ status: false, message: `User details are not found with this userId ${userId}` })
    }

    //authorization
    if (req.decodedToken != userId)
      return res.status(403).send({ status: false, message: "You are not an Authorized Person" });

    let getData = await cartModel.findOne({ userId });
    if (getData.items.length == 0)
      return res.status(400).send({ status: false, message: "Items Is empty " });

    if (!getData) {
      return res.status(404).send({ status: false, message: `Cart does not Exist with this userId :${userId}` })
    }

    res.status(200).send({ status: true, message: 'Success', data: getData })

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};


//--------------------------------delete API--------------------------//
const deleteCart = async function (req, res) {
  try {

    // Validate params
    userId = req.params.userId
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` })
    }

    //  To check user is present or not
    const userSearch = await userModel.findById({ _id: userId })
    if (!userSearch) {
      return res.status(404).send({ status: false, message: `User details are not found with this userId ${userId}` })
    }

    // AUTHORISATION
    if (req.decodedToken != userId)
      return res.status(403).send({ status: false, message: "You are not an authorized Person" })

    // To check cart is present or not
    const cartSearch = await cartModel.findOne({ userId })
    if (!cartSearch) {
      return res.status(404).send({ status: false, message: "Cart details are not found " })
    }

    const cartDelete = await cartModel.findOneAndUpdate({ userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })
    return res.status(204).send({ status: true, message: 'Success', data: "Cart is deleted successfully" })

  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}
module.exports = { createCartdetails, updateCart, getCart, deleteCart }