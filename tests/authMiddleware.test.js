import { isAdmin } from '../middlewares/authMiddleware';
import {
    ADMIN_USER_ID,
    NON_ADMIN_USER_ID,
    NON_EXISTENT_USER_ID,
} from '../models/__mocks__/userModel.js';
import userModel from '../models/userModel.js';

jest.mock('../models/userModel.js');

describe('isAdmin Middleware', () => {
    let req;

    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('malformed request should error', async () => {
        req = {};

        await isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Error in admin middleware',
            error: expect.any(Error),
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('non-existent user should return 401 error', async () => {
        req = {
            user: {
                _id: NON_EXISTENT_USER_ID,
            },
        };

        await isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Error in admin middleware',
            error: expect.any(Error),
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('user with non-admin role should not be authorised', async () => {
        req = {
            user: {
                _id: NON_ADMIN_USER_ID,
            },
        };

        await isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'UnAuthorized Access',
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('user with admin role should be authorised', async () => {
        req = {
            user: {
                _id: ADMIN_USER_ID,
            },
        };

        await isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
