const mongoose = require("mongoose");


const checkEmptyBody = (obj) => { return Object.keys(obj).length > 0 }


//-------------------Value Validation--------------------------->>
const isEmpty = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

//<<----------------Validation for Email --------------------->>
const isValidEmail = function (email) {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

//--------------------ObjectId----------------------------------->>
const isValidObjectId = (objectId) => {
  return mongoose.Types.ObjectId.isValid(objectId);
};

const streetValidation = function (street) {
  const streetRegex = /^[a-z \, A-Z \d]+$/;
  return streetRegex.test(street);
};

//--------------------validation for city--------------------------->>

const cityValidation = function (city) {
  const cityRegex = /^[a-z A-Z]+$/;
  return cityRegex.test(city);
};
//----------------------validation for pin code-------------------->>

const pincodeValidation = function (pincode) {
  const pinRegex = /^[\d]{6}$/;
  return pinRegex.test(pincode);
};




// ----------------Name Validation-------------------------->>
const isValidName = function (name) {
  const nameRegex = /^[a-zA-Z ]+$/;
  return nameRegex.test(name);
};
//<<----------------Validation for Phone No. ---------------->>

const isValidPhone = function (phone) {
  return /^((\+91)?|91)?[6789][0-9]{9}$/.test(phone);
};


//------------------ Password Validation----------------------->>
const isValidPassword = function (password) {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,15}$/;
  return passwordRegex.test(password);
};

//* PRODUCT VALIDATIONS *//

//------------------ size Validation----------------------->>
const isValidSize = (sizes) => {
  return ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizes);
}

//------------------ price Validation----------------------->>
const isValidPrice = (price) => { return /^[\d]+$/.test(price) }

//------------------ installment Validation----------------------->>
const isValidInstallments = (installments) => { return /^[\d]+$/.test(installments) }

//------------------ number Validation----------------------->>
const isValidNum = (num) => { return /^[0-9]*[1-9]+$|^[1-9]+[0-9]*$/.test(num); }

//------------------ style Validation----------------------->>
const isValidStyle = (style) => { return /^[a-z A-Z]*$/.test(style); }


//------------------ boolean Validation----------------------->>
const isValidBoolean = (value) => {
  if (!(typeof value === "boolean")) return false
  return true
}



module.exports = {
  checkEmptyBody,
  isEmpty,
  pincodeValidation,
  cityValidation,
  streetValidation,
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  isValidName,
  isValidPassword,
  isValidSize,
  isValidPrice,
  isValidInstallments,
  isValidNum,
  isValidStyle,
  isValidBoolean

};
