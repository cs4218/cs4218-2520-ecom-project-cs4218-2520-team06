// Constructor
const userModel = jest.fn(function (user) {
    Object.assign(this, user);
});

userModel.findOne = jest.fn();
userModel.prototype.save = jest.fn(function () {
    return Promise.resolve(this);
});

export default userModel;
