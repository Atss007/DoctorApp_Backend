module.exports.validateRes = (errors) => {
    return {
        message: errors,
        errors: true,
        code: 422
    }
}


