import { registerController } from '../controllers/authController.js';
import userModel from '../models/userModel.js';

jest.mock('../models/userModel.js');

jest.mock('../helpers/authHelper.js', () => ({
    hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('registerController', () => {
    let req;

    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
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

    test('error when name is missing', async () => {
        delete req.body.name;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: 'Name is Required' });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('error when email is missing', async () => {
        delete req.body.email;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: 'Email is Required' });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('error when password is missing', async () => {
        delete req.body.password;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({
            message: 'Password is Required',
        });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('error when phone is missing', async () => {
        delete req.body.phone;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({
            message: 'Phone no is Required',
        });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('error when address is missing', async () => {
        delete req.body.address;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({
            message: 'Address is Required',
        });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('error when answer is missing', async () => {
        delete req.body.answer;

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({
            message: 'Answer is Required',
        });
        expect(userModel).not.toHaveBeenCalled();
    });

    test('malformed request handling', async () => {
        req = {};

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Errro in Registeration',
            }),
        );
        expect(userModel).not.toHaveBeenCalled();
    });

    test('does not allow registration of existing user', async () => {
        userModel.findOne.mockResolvedValue({ name: userInfo.name });

        await registerController(req, res);

        expect(userModel.findOne).toHaveBeenCalledWith({
            email: userInfo.email,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Already Register please login',
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
            message: 'User Register Successfully',
            user: expectedUser,
        });
    });
});
