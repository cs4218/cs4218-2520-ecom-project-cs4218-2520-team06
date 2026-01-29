export const NON_EXISTENT_USER_ID = 'nonExistentUserId';
export const NON_ADMIN_USER_ID = 'nonAdminUserId';
export const ADMIN_USER_ID = 'adminUserId';

// Constructor
const userModel = jest.fn(function (user) {
    Object.assign(this, user);
});

userModel.findOne = jest.fn();
userModel.prototype.save = jest.fn(function () {
    return Promise.resolve(this);
});
userModel.findById = jest.fn((id) => {
    switch (id) {
        case NON_EXISTENT_USER_ID:
            return null;
        case NON_ADMIN_USER_ID:
            return Promise.resolve({ _id: id, role: 0 });
        case ADMIN_USER_ID:
            return Promise.resolve({ _id: id, role: 1 });
        default:
            return null;
    }
});

export default userModel;
