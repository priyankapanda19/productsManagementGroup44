//-----------------------      Importing required modules and packages       ----------------------------//
const express= require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const mw = require("../middleware/auth")


//-----------------------       user Api's-1       ---------------------------->>>>>>>>>>>
router.post("/register", userController.createUser);                                                            

router.post("/login", userController.loginUser);                                                                //>>>>>>>>>> post api (user Login)

router.get("/user/:userId/profile",mw.Authentication, userController.getUserProfile);                           //>>>>>>>>>>>>> Get User Profile

router.put("/user/:userId/profile",mw.Authentication, mw.Authorization, userController.updateUserProfile);      //>>>>>>>>>>> user Profile update



//-----------------------       product Api's-2        ---------------------------->>>>>>>>>>>
router.post("/products",productController.createProducts);                                                      //>>>>>>>>> create product details

router.get("/products/:productId",productController.getProductProfile);                                         //>>>>>>>>> get product details

router.get("/products",productController.getProductsWithFilter);                                                //>>>>>>>>> get product details filter apply

router.put("/products/:productId",productController.updateProduct);                                             //>>>>>>>>> update product details

router.delete("/products/:productId", productController.deleteProductDetails);                                  //>>>>>>>>> delete product details



//-----------------------       cart Api's-3        ---------------------------->>>>>>>>>>>
router.post("/users/:userId/cart",mw.Authentication, cartController.createCartDetails);       //>>>>>>>>> create product details

router.put("/users/:userId/cart",mw.Authentication,cartController.updateCart);                                  //>>>>>>>>> update product details

router.get("/users/:userId/cart",mw.Authentication, cartController.getCart);                                    //>>>>>>>>> get product details

router.delete("/users/:userId/cart",mw.Authentication, cartController.deleteCart);            //>>>>>>>>> delete product details



//-----------------------       order Api's-4        ---------------------------->>>>>>>>>>>
router.post("/users/:userId/orders",mw.Authentication, orderController.createOrder);          //>>>>>>>>> create order

router.put("/users/:userId/orders",mw.Authentication, orderController.updateOrder);                             //>>>>>>>>> update order



//-----------------------       limiting url path        ---------------------------->>>>>>>>>>>
router.all('/*',async function(req,res){
    return res.status(404).send({status:false,message:"Page Not Found"});
})

// exporting router
module.exports= router;