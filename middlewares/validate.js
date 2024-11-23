const { validationResult } = require("express-validator");
const { validateRes } = require("../helper/baseResponse");

const validate = (validator) => {
    return async (req, res, next) => {
        for (let validation of validator) {
            await validation?.run(req);
        }

        const errors = validationResult(req);
        let tmp = [];
        let errs = errors.array().filter((error) => {
            if (tmp.includes(error.param)) {
                return false;
            }
            tmp.push(error.param);
            return true;
        })
        if (errors.isEmpty()) {
            return next();
        }
        return res.status(422).json(validateRes(errs[0].msg));
    }
}


module.exports = {
    validate,
}