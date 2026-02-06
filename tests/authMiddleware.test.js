import { makeRes } from "../helpers/utils.test.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware";
import {
  ADMIN_USER_ID,
  NON_ADMIN_USER_ID,
  NON_EXISTENT_USER_ID,
} from "../models/__mocks__/userModel.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("jsonwebtoken");

describe("requireSignIn middleware", () => {
  const res = makeRes();
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("valid token allows access", async () => {
    const user = { _id: "validUserId" };
    JWT.verify.mockReturnValue(user);
    const req = {
      headers: {
        authorization: "validToken",
      },
    };

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith(
      "validToken",
      process.env.JWT_SECRET
    );
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  test("invalid token denies access", async () => {
    JWT.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });
    const req = {
      headers: {
        authorization: "invalidToken",
      },
    };
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith(
      "invalidToken",
      process.env.JWT_SECRET
    );
    expect(consoleSpy).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("isAdmin Middleware", () => {
  let req;

  const res = makeRes();

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("malformed request returns 400 error", async () => {
    req = { body: {} };
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await isAdmin(req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("non-existent user returns 401 error", async () => {
    req = {
      user: {
        _id: NON_EXISTENT_USER_ID,
      },
    };

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("user with non-admin role is not be authorised", async () => {
    req = {
      user: {
        _id: NON_ADMIN_USER_ID,
      },
    };

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("user with admin role is authorised", async () => {
    req = {
      user: {
        _id: ADMIN_USER_ID,
      },
    };

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
