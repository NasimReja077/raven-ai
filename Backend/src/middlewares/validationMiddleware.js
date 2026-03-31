import ApiError from "../utils/ApiError.js";
import {validationResult} from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(new ApiError(400, errorMessages.join(', ')));
  }
  next();
};

export default validate;