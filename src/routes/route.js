const express= require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const mw = require("../middleware/auth")


//-----------------------user Api's-1---------------------------->>>>>>>>>>>

//-----------------------user creation---------------------->>>>>>>>>
router.post("/register", userController.createUser);

//-----------------------post api (user Login)------------------------>>>>>>>>>>
router.post("/login", userController.loginUser);

//---------------------Get User Profile-------------------->>>>>>>>>>>>>
router.get("/user/:userId/profile",mw.Authentication, userController.getUserProfile);

//-----------------------user Profile update----------------------------->>>>>>>>>>>
router.put("/user/:userId/profile",mw.Authentication, mw.Authorization, userController.updateUserProfile);



//-----------------------product Api's-2---------------------------->>>>>>>>>>>

//-----------------------create product details---------------------->>>>>>>>>
router.post("/products",productController.createProducts);

//-----------------------get product details---------------------->>>>>>>>>
router.get("/products/:productId",productController.getProductProfile);

//----------------------get product details filter apply---------->>>>>>>>>
router.get("/products",productController.getProductsWithFilter);


//-----------------------update product details---------------------->>>>>>>>>
router.put("/products/:productId",productController.updateProduct);

//-----------------------delete product details---------------------->>>>>>>>>
router.delete("/products/:productId", productController.deleleteProductDetails);


//-----------------------cart Api's-3---------------------------->>>>>>>>>>>

//-----------------------create product details---------------------->>>>>>>>>
router.post("/users/:userId/cart", cartController.createCartdetails);

//-----------------------update product details---------------------->>>>>>>>>
router.put("/users/:userId/cart", cartController.updateCart);

//-----------------------get product details---------------------->>>>>>>>>
router.get("/users/:userId/cart", cartController.getCart);

//-----------------------delete product details---------------------->>>>>>>>>
router.delete("/users/:userId/cart", cartController.deleteCart);



//-----------------------order Api's-4---------------------------->>>>>>>>>>>

//----------------------create order--------------------------->>>>>>>>>>>
router.post("/users/:userId/orders", orderController.createOrder);

//----------------------update order--------------------------->>>>>>>>>>>
router.put("/users/:userId/orders", orderController.updateOrder);


router.all('/*',async function(req,res){
    return res.status(404).send({status:false,message:"Page Not Found"});
})
module.exports= router;