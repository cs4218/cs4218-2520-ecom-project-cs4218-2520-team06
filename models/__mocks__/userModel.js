export const NON_EXISTENT_USER_ID = "nonExistentUserId";
export const NON_ADMIN_USER_ID = "nonAdminUserId";
export const ADMIN_USER_ID = "adminUserId";
export const NON_ADMIN_USER_EMAIL = "nonadmin@me.com";
export const ADMIN_USER_EMAIL = "admin@me.com";

export const NON_ADMIN_USER = {
  _id: NON_ADMIN_USER_ID,
  name: "Non Admin User",
  email: NON_ADMIN_USER_EMAIL,
  password: "hashedPassword",
  phone: "1234567890",
  address: "123 Street",
  answer: "Answer",
  role: 0,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

export const ADMIN_USER = {
  _id: ADMIN_USER_ID,
  name: "Admin User",
  email: ADMIN_USER_EMAIL,
  password: "hashedPassword",
  phone: "0987654321",
  address: "456 Avenue",
  answer: "AdminAnswer",
  role: 1,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

// Constructor
const userModel = jest.fn(function (user) {
  Object.assign(this, user);
});

userModel.findOne = jest.fn(({ email }) => {
  switch (email) {
    case ADMIN_USER_EMAIL:
      return Promise.resolve(ADMIN_USER);
    case NON_ADMIN_USER_EMAIL:
      return Promise.resolve(NON_ADMIN_USER);
  }
  return null;
});

userModel.prototype.save = jest.fn(function () {
  return Promise.resolve(this);
});
userModel.findById = jest.fn((id) => {
  switch (id) {
    case NON_EXISTENT_USER_ID:
      return null;
    case NON_ADMIN_USER_ID:
      return Promise.resolve({ ...NON_ADMIN_USER });
    case ADMIN_USER_ID:
      return Promise.resolve({ ...ADMIN_USER });
    default:
      return null;
  }
});

export default userModel;
