import {
    registerController,
    testController,
} from '../controllers/authController.js';
import { makeRes } from '../helpers/utils.test.js';
import {
    NON_ADMIN_USER,
    NON_ADMIN_USER_EMAIL,
} from '../models/__mocks__/userModel.js';
import userModel from '../models/userModel.js';

jest.mock('../models/userModel.js');

jest.mock('../helpers/authHelper.js', () => ({
    hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('registerController', () => {
    let req;

    const res = makeRes();

    const userInfo = Object.freeze({
        name: 'Bob',
        email: 'abc@gmail.com',
        password: 'password',
        phone: '1234567890',
        address: '123 Street',
        answer: 'Answer',
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

    test('missing name returns 400', async () => {
        delete req.body.name;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('missing email returns 400', async () => {
        delete req.body.email;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('missing password returns 400', async () => {
        delete req.body.password;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('missing phone returns 400', async () => {
        delete req.body.phone;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('missing address returns 400', async () => {
        delete req.body.address;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('missing answer returns 400', async () => {
        delete req.body.answer;

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: expect.any(String) });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('malformed request is handled correctly', async () => {
        req = {};

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            }),
        );
        expect(userModel).not.toHaveBeenCalled();
    });

    test('does not allow registration of existing user', async () => {
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

    test('successful registration of new user', async () => {
        const expectedUser = {
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            address: userInfo.address,
            password: 'hashedPassword',
            answer: userInfo.answer,
        };
        userModel.findOne.mockResolvedValue(null);

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

test('testController returns correct response', () => {
    const req = {};
    const res = makeRes();

    testController(req, res);

    expect(res.send).toHaveBeenCalledWith('Protected Routes');
});
