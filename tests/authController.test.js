import {
  registerController,
  testController,
  loginController,
  forgotPasswordController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  updateProfileController,
} from "../controllers/authController.js";
import { makeRes } from "../helpers/utils.test.js";
import {
  NON_ADMIN_USER_EMAIL,
  NON_ADMIN_USER_ID,
  NON_ADMIN_USER,
} from "../models/__mocks__/userModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");

jest.mock("../helpers/authHelper.js", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashedPassword"),
  comparePassword: jest.fn((password, hashedPassword) => {
    if (password === "correctPassword" && hashedPassword === "hashedPassword") {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
}));

jest.mock("jsonwebtoken");

describe("registerController", () => {
  let req;

  const res = makeRes();

  const userInfo = Object.freeze({
    name: "Bob",
    email: "abc@gmail.com",
    password: "password",
    phone: "1234567890",
    address: "123 Street",
    answer: "Answer",
  });
  const email = userInfo.email;

  beforeEach(() => {
    req = {
      body: {
        ...userInfo,
      },
    };

    jest.clearAllMocks();
  });

  test("missing name returns 400", async () => {
    delete req.body.name;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("missing email returns 400", async () => {
    delete req.body.email;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("missing password returns 400", async () => {
    delete req.body.password;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("missing phone returns 400", async () => {
    delete req.body.phone;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("missing address returns 400", async () => {
    delete req.body.address;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("missing answer returns 400", async () => {
    delete req.body.answer;

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
    expect(userModel).not.toHaveBeenCalled();
  });

  test("malformed request is handled correctly", async () => {
    req = {};
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await registerController(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
    expect(userModel).not.toHaveBeenCalled();
  });

  test("does not allow registration of existing user", async () => {
    req.body.email = NON_ADMIN_USER_EMAIL;

    await registerController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: NON_ADMIN_USER_EMAIL,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: expect.any(String),
    });
    expect(userModel.mock.instances.length).toBe(0);
  });

  test("successful registration of new user", async () => {
    const expectedUser = {
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      address: userInfo.address,
      password: "hashedPassword",
      answer: userInfo.answer,
    };

    await registerController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email });
    expect(userModel).toHaveBeenCalledWith({
      ...expectedUser,
    });
    expect(userModel.mock.instances[0].save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: expect.any(String),
      user: expectedUser,
    });
  });
});

test("testController returns correct response", () => {
  const req = {};
  const res = makeRes();

  testController(req, res);

  expect(res.send).toHaveBeenCalledWith("Protected Routes");
});

describe("loginController", () => {
  let req;
  const res = makeRes();

  beforeEach(() => {
    req = {
      body: {
        email: "abc@gmail.com",
        password: "password",
      },
    };
    jest.clearAllMocks();
  });

  test("fails when no email is provided", async () => {
    delete req.body.email;

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("fails when no password is provided", async () => {
    delete req.body.password;

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("non-existent user returns 401", async () => {
    req.body.email = "nonexistent@gmail.com";

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("incorrect password returns 401", async () => {
    req.body = { email: NON_ADMIN_USER_EMAIL, password: "wrongPassword" };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("handles DB errors gracefully", async () => {
    const err = new Error("DB failure");
    userModel.findOne.mockImplementationOnce(() => {
      throw err;
    });

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: err,
      })
    );
  });

  test("successful login returns user and token", async () => {
    JWT.sign.mockReturnValueOnce("mocked-jwt-token");
    req.body = { email: NON_ADMIN_USER_EMAIL, password: "correctPassword" };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        user: expect.any(Object),
        token: "mocked-jwt-token",
      })
    );
  });
});

describe("forgotPasswordController", () => {
  let req;
  const res = makeRes();

  beforeEach(() => {
    req = {
      body: {
        email: "user@email.com",
        answer: "user's answer",
        newPassword: "newPassword123",
      },
    };
    jest.clearAllMocks();
  });

  test("errors when email is missing", async () => {
    delete req.body.email;

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("errors when answer is missing", async () => {
    delete req.body.answer;

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("errors when newPassword is missing", async () => {
    delete req.body.newPassword;

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  test("returns 404 when no matching user-answer pair", async () => {
    userModel.findOne.mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: req.body.email,
      answer: req.body.answer,
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("handles DB errors gracefully", async () => {
    const err = new Error("DB failure");
    userModel.findOne.mockImplementationOnce(() => {
      throw err;
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: err,
      })
    );
  });

  test("successful password reset", async () => {
    userModel.findOne.mockResolvedValueOnce(NON_ADMIN_USER);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: req.body.email,
      answer: req.body.answer,
    });
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      NON_ADMIN_USER._id,
      { password: "hashedPassword" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });
});

// Jabez Tho, A0273312N
describe("getOrdersController", () => {
  const res = makeRes();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 500 when DB fails", async () => {
    const err = new Error("DB failure");
    orderModel.find.mockImplementationOnce(() => {
      throw err;
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const req = { user: { _id: "user123" } };

    await getOrdersController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: err,
    });
  });

  test("successfully returns order data for specific buyer", async () => {
    const mockOrders = [
      {
        _id: "order1",
        products: [{ _id: "prod1", name: "Laptop" }],
        buyer: { _id: "user123", name: "John Doe" },
        status: "Processing",
        payment: { method: "card" },
      },
      {
        _id: "order2",
        products: [{ _id: "prod2", name: "Mouse" }],
        buyer: { _id: "user123", name: "John Doe" },
        status: "Shipped",
        payment: { method: "card" },
      },
    ];

    orderModel.find.mockImplementationOnce(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      then: jest.fn((callback) => Promise.resolve(callback(mockOrders))),
    }));

    const req = { user: { _id: "user123" } };

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });
});

// Jabez Tho, A0273312N
describe("getAllOrdersController", () => {
  const res = makeRes();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 500 when DB fails", async () => {
    const err = new Error("DB failure");
    orderModel.find.mockImplementationOnce(() => {
      throw err;
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const req = {};

    await getAllOrdersController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: err,
    });
  });

  test("successfully returns orders", async () => {
    const mockOrders = [
      {
        _id: "order1",
        products: [{ _id: "prod1", name: "Laptop" }],
        buyer: { _id: "user1", name: "John Doe" },
        status: "Processing",
        payment: { method: "card" },
        createdAt: new Date("2024-01-02"),
      },
      {
        _id: "order2",
        products: [{ _id: "prod2", name: "Mouse" }],
        buyer: { _id: "user2", name: "Jane Smith" },
        status: "Shipped",
        payment: { method: "card" },
        createdAt: new Date("2024-01-01"),
      },
    ];

    orderModel.find.mockImplementationOnce(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      then: jest.fn((callback) => Promise.resolve(callback(mockOrders))),
    }));

    const req = {};

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });
});

// Jabez Tho, A0273312N
describe("orderStatusController", () => {
  const res = makeRes();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 500 when DB fails", async () => {
    const err = new Error("DB failure");
    orderModel.findByIdAndUpdate.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const req = {
      params: { orderId: "order1" },
      body: { status: "Shipped" },
    };

    await orderStatusController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updateing Order",
      error: err,
    });
  });

  test("successfully returns order update status", async () => {
    const mockUpdatedOrder = {
      _id: "order1",
      status: "Delivered",
      products: [{ _id: "prod1", name: "Laptop" }],
      buyer: { _id: "user1", name: "John Doe" },
      payment: { method: "card" },
    };

    // Override the mock to return custom data
    orderModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedOrder);

    const req = {
      params: { orderId: "order1" },
      body: { status: "Delivered" },
    };

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order1",
      { status: "Delivered" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });
});

// Jabez Tho, A0273312N
describe("updateProfileController", () => {
  let req;
  const res = makeRes();
  const existingUser = {
    name: "Old Name",
    phone: "9876543210",
    address: "Old Address",
    password: "oldHashedPassword",
  };

  const existingUserWithId = {
    _id: NON_ADMIN_USER_ID,
    ...existingUser,
  };

  const { hashPassword } = jest.requireMock("../helpers/authHelper.js");

  beforeEach(() => {
    req = {
      user: { _id: NON_ADMIN_USER_ID },
      body: {},
    };
    jest.clearAllMocks();
  });

  test("password less than 6 characters returns error", async () => {
    req.body = { password: "12345" };

    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("partial update preserves other fields", async () => {
    userModel.findById.mockResolvedValueOnce(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...existingUserWithId,
      name: "New Name",
    });

    req.body = { name: "New Name" };

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      NON_ADMIN_USER_ID,
      {
        ...existingUser,
        name: "New Name",
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser: expect.objectContaining({
          ...existingUserWithId,
          name: "New Name",
        }),
      })
    );
  });

  test("password update calls hashPassword and updates correctly", async () => {
    userModel.findById.mockResolvedValueOnce(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...existingUserWithId,
      password: "hashedPassword",
    });

    req.body = { password: "newPass123" };

    await updateProfileController(req, res);

    expect(hashPassword).toHaveBeenCalledWith("newPass123");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      NON_ADMIN_USER_ID,
      expect.objectContaining({
        ...existingUser,
        password: "hashedPassword",
      })
    );
  });

  test("multiple fields update correctly", async () => {
    userModel.findById.mockResolvedValueOnce(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...existingUser,
      name: "New Name",
      phone: "2222222222",
      address: "New Address",
    });

    req.body = {
      name: "New Name",
      phone: "2222222222",
      address: "New Address",
    };

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      NON_ADMIN_USER_ID,
      {
        ...existingUser,
        name: "New Name",
        phone: "2222222222",
        address: "New Address",
      }
    );
  });

  test("no password update does not call hashPassword", async () => {
    userModel.findById.mockResolvedValueOnce(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce(existingUser);

    req.body = { name: "Updated Name" };

    await updateProfileController(req, res);

    expect(hashPassword).not.toHaveBeenCalled();
  });

  test("empty strings clear fields to blank", async () => {
    const existingUser = {
      _id: NON_ADMIN_USER_ID,
      name: "Old Name",
      phone: "9876543210",
      address: "Old Address",
      password: "hashedPassword",
    };
    userModel.findById.mockResolvedValueOnce(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...existingUser,
      name: "",
      phone: "",
      address: "",
    });

    req.body = {
      name: "",
      phone: "",
      address: "",
    };

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      NON_ADMIN_USER_ID,
      {
        name: "",
        password: "hashedPassword",
        phone: "",
        address: "",
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handles DB error gracefully", async () => {
    const err = new Error("DB failure");
    userModel.findById.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    req.body = { name: "New Name" };

    await updateProfileController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while Update profile",
      error: err,
    });
  });
});
