const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const { uploadFile } = require("../controllers/AWSController");
const jwt = require("jsonwebtoken")

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

    const passEncryption = async function(pass){

        const salt = await bcrypt.genSalt(10);
        let Encryptedpassword = await bcrypt.hash(pass, salt);

        return Encryptedpassword
    }

//------------------------User Create------------------->>>>>

const createUser = async function (req, res) {
    try {
        let body = req.body;
        if (!checkEmptyBody(body)) return res.status(400).send({ status: false, message: "please provide data in request body" });

        let { fname, lname, email, profileImage, phone, password, address, ...rest } = body;
        // if (rest)return res(400).send({status: false, message: "please provide required details only"})

        body.address = JSON.parse(address)

        if (!isEmpty(fname)) return res.status(400).send({ status: false, message: "fname is required" });
        if (!isValidName(fname)) return res.status(400).send({ status: false, message: "fname is invalid" });

        if (!isEmpty(lname)) return res.status(400).send({ status: false, message: "lname is required" })
        if (!isValidName(lname)) return res.status(400).send({ status: false, message: "lname is invalid" })

        if (!isEmpty(email)) return res.status(400).send({ status: false, message: "email is required" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "email is invalid" })

        let isPresentEmail = await userModel.findOne({email})
        if(isPresentEmail) return res.status(409).send({ status: false, message: "Email is already present.." })


        // if(!profileImage) return res.status(400).send({status: false, message: "profileImage is required"})
        let files = req.files;
        if (!files || files.length == 0) return res.status(400).send({ status: false, message: "please provide file" })
        let imageUrl = await uploadFile(files[0])
        body.profileImage = imageUrl;
    
        if (!isEmpty(phone)) return res.status(400).send({ status: false, message: "phone is required" })
        if (!isValidPhone(phone)) return res.status(400).send({ status: false, message: "phone is invalid" })

        let isPresentPhone = await userModel.findOne({phone})
        if(isPresentPhone) return res.status(409).send({ status: false, message: "Phone No. is already present.." })

        if (!isEmpty(password)) return res.status(400).send({ status: false, message: "password is required" })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "password is invalid" })


        //validate address

        address = JSON.parse(address)   // here you can call stack And execution
        
        if (!address) return res.status(400).send({ status: false, message: "address is required" })
        
        if (typeof body.address !== "object") return res.status(400).send({ status: false, message: "address should be in object format" })
        
        if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "please enter a valid address" })
        
        if (!address.shipping) return res.status(400).send({ status: false, message: "please enter shipping address and it should be in object also." })
        else {

            let { street, city, pincode } = address.shipping;

            if (!isEmpty(street)) return res.status(400).send({ status: false, message: "enter shipping street" })
            if (!streetValidation(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })

            if (!isEmpty(city)) return res.status(400).send({ status: false, message: "enter Shipping city" })
            if (!cityValidation(city.trim())) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })

            if (!isEmpty(pincode)) return res.status(400).send({ status: false, message: "enter Shipping Pincode" })
            if (!pincodeValidation(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
        }


        if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object also." })

        let { street, city, pincode } = address.billing;

        if (!isEmpty(street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })
        if (!streetValidation(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

        if (!isEmpty(city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
        if (!cityValidation(city.trim())) return res.status(400).send({ status: false, message: "provide a Billing City Name" })

        if (!isEmpty(pincode)) return res.status(400).send({ status: false, message: "Enter Billing Pincode" })
        if (!pincodeValidation(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })


        // const salt = await bcrypt.genSalt(10);
        // let pass = await bcrypt.hash(password, salt);

        let pass =await passEncryption(password)
        body.password = pass
        // console.log(pass)

//    console.log(body)
        const createdUser = await userModel.create(body);
        return res.status(201).send({ status: true, message: "User created successfully", data: createdUser });
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}   
      
//----------------User Login------------------------>>>>>
const loginUser = async function (req, res) {
    try {

        let data = req.body;

        // checking if user does not enters any data
        if (!checkEmptyBody(data)) return res.status(400).send({ status: false, message: "please provide email & password" });

        // checking for email
        if (!isEmpty(data.email)) return res.status(400).send({ status: false, message: "please enter email" });
        if (!isValidEmail(data.email)) return res.status(400).send({ status: false, message: "please enter valid email" });

        // checking for password
        if (!data.password) return res.status(400).send({ status: false, message: "please enter password" });
        if (!isValidPassword(data.password)) return res.status(400).send({ status: false, message: 'provided password is not valid (required at least: 8-15 characters with at least one capital letter, one special character & one number)' });

        // searching in DB
        let findUser = await userModel.findOne({ email: data.email });
        if (!findUser) return res.status(404).send({ status: false, message: "email is incorrect" });

        // checking password with bcrypt's compare
        let ValidPassword = await bcrypt.compare(data.password, findUser.password);
        if (!ValidPassword) return res.status(404).send({ status: false, message: "password is incorrect" });

        // defining issuingTime
        let issuingTime = Math.floor(Date.now() / 1000)
        let payLoad = {
            userId: findUser._id.toString(),
            iat: issuingTime,
            // exp: issuingTime + 6000 // 100 minutes
        }

        // creating token
        let token = jwt.sign( payLoad , " ~ functionUp--project-5--product-management-group-44 ~ ")

        res.header('Authorization', token);
        return res.status(201).send({ status: true, message: 'Success', data: { userId: `${findUser._id}`, token: token } });
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


//----------------------Get User Profile---------------------------->>>>>>>>>>>
const getUserProfile = async function (req, res) {
    try {

        let data = req.params.userId;

        if(!isValidObjectId(data)) return res.status(400).send({staus:false,message:"Please provide valid userId"})
     
         let getUserData = await userModel.findById({_id:data});
     
         if (!getUserData) return res.status(404).send({ status: false, message: 'No user details found with this userId' });
     
        //  if (getUserData.isDeleted == true) return res.status(400).send({staus:false,message:'This user is already deleted'});
     
        //  let {fname, lname, email, profileImage, phone, password, address} = getUserData
     
         return res.status(200).send({ status: true, message: 'User profile details successfully fetch', data:getUserData, });
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}

//----------------------User Profile update-------------------------->>>>>>>>

const updateUserProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please Provide Valid userid " })
        }

        let data = req.body
        let image = req.files
        if (image && image.length > 0) {

            let img =await uploadFile(image[0])
            data.profileImage = img
        }

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please  provide Some field to update,its totally blank" })
        }
        let { fname, lname, email, phone, password, address,profileImage  } = data

        //------------------------------------------update address---------------------------------------------------------

        let findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(400).send({ status: false, message: "please enter Valid user id Which Present in Database" })
        }
        let add = findUser.address

        // if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "please Provide address Fields,its Totally blank" })

        if (address) {

            address = JSON.parse(address)

            if (typeof (address) != "object") {
                return res.status(400).send({ status: false, message: "please enter address in Object format to update" })
            }
            if (address.shipping == "") {
                return res.status(400).send({ status: false, message: "please enter shipping address to update" })
            }
            if (address.billing == "") {
                return res.status(400).send({ status: false, message: "please enter billing address to update" })
            }
            if (address.shipping) {
                if (typeof (address.shipping) != "object") {
                    return res.status(400).send({ status: false, message: "please enter shpping address in valid format to update" })
                }
                if (address.shipping.street) {
                    add.shipping.street = address.shipping.street
                }
                if (address.shipping.city) {
                    add.shipping.city = address.shipping.city
                }
                if (address.shipping.pincode) {
                    add.shipping.pincode = address.shipping.pincode
                }
            }
            if (address.billing) {
                if (typeof (address.billing) != "object") {
                    return res.status(400).send({ status: false, message: "please enter billing address in valid format to update" })
                }
                if (address.billing.street) {
                    add.billing.street = address.billing.street
                }
                if (address.billing.city) {
                    add.billing.city = address.billing.city
                }
                if (address.billing.pincode) {
                    add.billing.pincode = address.billing.pincode
                }
            }        
        }
        
        // if (!isEmpty(fname)) return res.status(400).send({ status: false, message: "fname is Mandatory,Please provide some input" });
        if (fname&&!isValidName(fname)) return res.status(400).send({ status: false, message: "fname is Not valid" });

        // if (!isEmpty(lname)) return res.status(400).send({ status: false, message: "lname is Mandatory,Please Provide some input" })
        if (lname&&!isValidName(lname)) return res.status(400).send({ status: false, message: "lname is Not valid" })

        // if (!isEmpty(email)) return res.status(400).send({ status: false, message: "email is Mandatory,please provide some input" })
        if (email&&!isValidEmail(email)) return res.status(400).send({ status: false, message: "email is Not  valid" })

            const uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) {
                return res.status(400).send({ status: false, message: "email to update is already In Database,please give some unique email id." })
            }
        
    // if (!isEmpty(phone)) return res.status(400).send({ status: false, message: "phone is Mandatory" })
    if (phone&&!isValidPhone(phone)) return res.status(400).send({ status: false, message: "phone is Not  valid,please provide unique phone no" })

            let uniquePhone = await userModel.findOne({ phone: phone })
            if (uniquePhone) {
                return res.status(400).send({ status: false, message: "phone already exist " })
            }
            if(password && !isValidPassword) return res.status(400).send({ status: false, message: "Password is not valid" })
            if (password && isValidPassword) {
            var pass = await passEncryption(password)           
        }

        let update = await userModel.findByIdAndUpdate({ _id: userId }, { $set: { fname: fname, lname: lname, email: email, phone: phone, password: pass, address: add, image: profileImage  } }, { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: update })
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


module.exports.createUser = createUser
module.exports.loginUser = loginUser;
module.exports.getUserProfile = getUserProfile;
module.exports.updateUserProfile = updateUserProfile;
