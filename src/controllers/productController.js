const productModel = require("../models/productModel");
const mongoose = require("mongoose")
const isObjectId = mongoose.Types.ObjectId.isValid
const userModel = require("../models/userModel")
const bcrypt = require("bcrypt");
const { uploadFile } = require("../controllers/AWSController");
const jwt = require("jsonwebtoken")
// const { findByIdAndUpdate } = require("../models/userModel");

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
    isValidPassword, isValidSize,
    isValidPrice,
    isValidInstallments,
    isValidNum,
    isValidStyle,
    isValidBoolean
} = require("../validation/validation");


//----------------------create Product Details--------------------------->>>>>>>>>>>

const createProducts = async (req, res) => {
    try {
        // taking data from body
        let data = req.body;

        // taking image from body
        let files = req.files;

        // checking if body is empty or not
        if (!checkEmptyBody(data)) return res.status(400).send({ status: false, message: "please provide data to create product !!!" });

        // destructuring fields from data
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments, style, isFreeShipping } = data;

        // checking the title
        if (!isEmpty(title)) return res.status(400).send({ status: false, message: "title required" });

        // checking duplicate title
        let duplicateTitle = await productModel.findOne({ title: title });
        if (duplicateTitle) return res.status(400).send({ status: false, message: "title already exist in use" });

        // checking for description
        if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description required" });

        // checking price
        if (!isEmpty(price)) return res.status(400).send({ status: false, message: "price required" });
        if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "Invalid price" });

        // checking currencyId
        if (!isEmpty(currencyId)) return res.status(400).send({ status: false, message: "currencyId required" });
        if (currencyId != 'INR') return res.status(400).send({ status: false, message: "only indian currencyId INR accepted" });

        //checking for currencyFormat
        if (!isEmpty(currencyFormat)) return res.status(400).send({ status: false, message: "currency format required" });
        if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "only indian currency ₹ accepted " });

        // getting aws link for image and setting it to body data
        if (files && files.length > 0) {
            let image = await uploadFile(files[0]);   // get to know line 68 to 84
            data.productImage = image;
        } else {
            return res.status(400).send({ status: false, message: "please provide the productImage" });
        }

        //checking for available Sizes of the products
        if (!isEmpty(availableSizes)) return res.status(400).send({ status: false, message: "availableSizes required" });

        // taking size as array of string 
        let sizesList = availableSizes.toUpperCase().split(",")
        if (Array.isArray(sizesList)) {
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
            for (let i = 0; i < sizesList.length; i++) {
                if (!arr.includes(sizesList[i])) return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " });
                data.availableSizes = sizesList;
            }
        }

        // if any non mandatory fields are present in input

        if (style) {
            if (!isEmpty(style) || !isValidStyle(style)) return res.status(400).send({ status: false, message: "please enter valid style" });
        }

        // if (currencyFormat) {
        //     if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "please enter valid currencyFormat" });
        // }

        // if (currencyId) {
        //     if (currencyId != 'INR') return res.status(400).send({ status: false, message: "please enter valid currencyId" });
        // }

        if (isFreeShipping) {
            if (!(isFreeShipping == 'true' || isFreeShipping == 'false')) return res.status(400).send({ status: false, message: "isFreeShipping value should be only true or false " });
        }

        if (installments) {
            if (!isValidInstallments(installments)) return res.status(400).send({ status: false, message: 'please enter installments as number' });
        }

        // creating product
        const createdProduct = await productModel.create(data);
        res.status(201).send({ status: true, message: 'Success', data: createdProduct });

    } catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}


//----------------------Get Product Details --------------------------->>>>>>>>>>>

const getProductsWithFilter = async (req, res) => {

    try {// taking query
        const queryParams = req.query;
        // console.log(JSON.parse(queryParams))
        const filterQueryData = { isDeleted: false };

        // destructuring the data got from query
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams;

        // checking if fields present then checking & adding values in query data
        if (size) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) == -1) return res.status(400).send({ status: false, message: 'Size should be between ["S", "XS", "M", "X", "L", "XXL", "XL"]' });
            filterQueryData['availableSizes'] = size;
        }
        if (name) {
            if (!isEmpty(name)) return res.status(400).send({ status: false, message: 'name is invalid' });
            filterQueryData['title'] = name;
        }

        // all type of price filter
        if (priceGreaterThan && priceLessThan) {

            if ((!isValidNum(priceGreaterThan)) || (!isValidNum(priceLessThan))) return res.status(400).send({ status: false, message: 'please provide priceGreaterThan && priceLessThan as number' });
            filterQueryData['price'] = { $gt: priceGreaterThan, $lt: priceLessThan };
        }
        if (priceGreaterThan) {
            if (!isValidNum(priceGreaterThan)) return res.status(400).send({ status: false, message: 'please provide priceGreaterThan as number' });
            filterQueryData['price'] = { $gt: priceGreaterThan };
        }
        if (priceLessThan) {
            if (!isValidNum(priceLessThan)) return res.status(400).send({ status: false, message: 'please provide priceLessThan as number' });
            filterQueryData['price'] = { $lt: priceLessThan };
        }

        // checking priceSort to fetch data in ascending or descending order from DB 
        if (priceSort) {
            if (priceSort == 1) {
                let foundProduct = await productModel.find(filterQueryData).sort({ price: 1 });
                if (!checkEmptyBody(foundProduct)) return res.status(404).send({ status: false, message: 'no product found' });
                return res.status(200).send({ status: true, message: 'Success', data: foundProduct });
            } else if (priceSort == -1) {
                let foundProduct = await productModel.find(filterQueryData).sort({ price: -1 });
                if (!checkEmptyBody(foundProduct)) return res.status(404).send({ status: false, message: 'no product found' });
                return res.status(200).send({ status: true, message: 'Success', data: foundProduct });
            } else {
                return res.status(400).send({ status: false, message: 'please provide priceSort (1 or -1)' });
            }
        };

        // querying in Db with filterData
        const finalData = await productModel.find(filterQueryData);
        if (finalData.length == 0) return res.status(404).send({ status: false, message: 'no product found' });
        return res.status(200).send({ status: true, message: 'Success', data: finalData });
    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


//----------------------Get Product Details--------------------------->>>>>>>>>>>

const getProductProfile = async function (req, res) {
    try {

        let data = req.params.productId;

        if (!isValidObjectId(data)) return res.status(400).send({ staus: false, message: "Please provide valid ProductId" })

        let getProduct = await productModel.findById({ _id: data })

        if (!getProduct)
            return res.status(404).send({ status: false, message: "no Product found with this query" })

        if (getProduct.isDeleted == true)
            return res.status(404).send({ staus: true, message: "Product is already deleted" })

        return res.status(200).send({ status: true, message: 'Product details successfully fetch', data: getProduct });

    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


//----------------------update Product Details--------------------------->>>>>>>>>>>

const updateProduct = async function (req, res) {

    try {

        let product_id = req.params.productId
        if (!isObjectId(product_id)) return res.status(400).send({ status: false, message: "product id is invalid" })

        let isPresent = await productModel.findOne({ _id: product_id, isDeleted: false })

        if (!isPresent) return res.status(404).send({ status: false, message: "product not found" })

        let body = req.body

        let files = (req.files)

        if (!checkEmptyBody(body) && (files.length == 0)) return res.status(400).send({ status: false, message: "plz enter the field which you want to update" })

        // destructuring fields from data
        let { title, description, price, currencyId, currencyFormat, productImage, availableSizes, installments, style, isFreeShipping } = body;

        // checking the title
        if (title)
            if (!isEmpty(title)) return res.status(400).send({ status: false, message: "title required" });

        // checking duplicate title
        let duplicateTitle = await productModel.findOne({ title: title });
        if (duplicateTitle) return res.status(400).send({ status: false, message: "title already exist in use" });

        // checking for description
        if (description)
            if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description required" });

        // checking price
        if (price) {
            if (!isEmpty(price)) return res.status(400).send({ status: false, message: "price required" });
            if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "Invalid price" });
        }  

        // checking currencyId
        if (currencyId) {
            if (!isEmpty(currencyId)) return res.status(400).send({ status: false, message: "currencyId required" });
            if (currencyId != 'INR') return res.status(400).send({ status: false, message: "only indian currencyId INR accepted" });
        }

        //checking for currencyFormat
        if (currencyFormat) {
            if (!isEmpty(currencyFormat)) return res.status(400).send({ status: false, message: "currency format required" });
            if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "only indian currency ₹ accepted " });
        }
        // getting aws link for image and setting it to body data
        // let files = req.files
        if (files && files.length > 0) {
            let image = await uploadFile(files[0]);
            // body.productImage = image;
            productImage = image
        }

        //checking for available Sizes of the products
        if (availableSizes) {
            if (!isEmpty(availableSizes)) return res.status(400).send({ status: false, message: "availableSizes required" });

            // taking size as array of string 
            let sizesList = availableSizes.toUpperCase().split(",")
            if (Array.isArray(sizesList)) {
                let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
                for (let i = 0; i < sizesList.length; i++) {
                    if (!arr.includes(sizesList[i])) return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " });

                    // data.availableSizes = sizesList;
                }
                let db = isPresent.availableSizes
                for (let i = 0; i < sizesList.length; i++) {
                    let flag = 0
                    for (let j = 0; j < db.length; j++) {
                        if (sizesList[i] == db[j]) {
                            flag = 1
                        }
                    }
                    if (flag == 0) {
                        db.push(sizesList[i])
                    } else {
                        let index = db.indexOf(sizesList[i])
                        db.splice(index, 1)
                        console.log(index)
                    }
                }
                console.log(db, sizesList)
                availableSizes = db
            }
        }
        // if any non mandatory fields are present in input

        if (style) {
            if (!isEmpty(style) || !isValidStyle(style)) return res.status(400).send({ status: false, message: "please enter valid style" });
        }
        if (currencyFormat) {
            if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "please enter valid currencyFormat" });
        }
        if (currencyId) {
            if (currencyId != 'INR') return res.status(400).send({ status: false, message: "please enter valid currencyId" });
        }
        if (isFreeShipping) {
            if (!(isFreeShipping == 'true' || isFreeShipping == 'false')) return res.status(400).send({ status: false, message: "isFreeShipping value should be only true or false " });
        }
        if (installments) {
            if (!isValidInstallments(installments)) return res.status(400).send({ status: false, message: 'please enter installments as number' });
        }

        let updatedProduct = await productModel.findOneAndUpdate({ _id: product_id }, { $set: { title: title, description: description, price: price, currencyId: currencyId, currencyFormat: currencyFormat, isFreeShipping: isFreeShipping, productImage: productImage, style: style, availableSizes: availableSizes, installments: installments } }, { new: true })

        return res.status(200).send({ status: true, message: updatedProduct })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


//----------------------delelete Product Details-------------------------->>>>>>>>

const deleleteProductDetails = async function (req, res) {
    try {
        let data = req.params.productId;

        if (!isValidObjectId(data)) return res.status(400).send({ staus: false, message: "Please provide valid productId" })

        let productData = await productModel.findById(data);

        if (!productData) return res.status(404).send({ status: false, message: 'No product details found with this productId' });

        if (productData.isDeleted == true) return res.status(400).send({ staus: false, message: 'This product is already deleted' });

        let deleleteProduct = await productModel.findOneAndUpdate(
            { _id: data }, { isDeleted: true, deletedAt: new Date() }, { new: true });

        return res.status(200).send({ status: true, message: "product is deleted successfully", });
    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { createProducts, getProductProfile, updateProduct, deleleteProductDetails, getProductsWithFilter }