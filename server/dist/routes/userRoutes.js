"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const userRepository_1 = require("../repositories/userRepository");
const repository = new userRepository_1.UserRepository();
exports.userRouter = (0, express_1.Router)();
const registrationSchema = zod_1.z.object({
    username: zod_1.z.string().min(2),
    email: zod_1.z.string().email()
});
const oauthSchema = zod_1.z.object({
    serviceName: zod_1.z.string().min(2)
});
exports.userRouter.post('/register', async (req, res, next) => {
    try {
        const payload = registrationSchema.parse(req.body);
        const user = await repository.registerUser(payload.username, payload.email);
        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            otp: user.otp,
            services: user.services
        });
    }
    catch (error) {
        next(error);
    }
});
exports.userRouter.get('/:username', async (req, res, next) => {
    try {
        const username = req.params.username;
        const user = await repository.findByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            services: user.services
        });
    }
    catch (error) {
        next(error);
    }
});
exports.userRouter.post('/:username/oauth', async (req, res, next) => {
    try {
        const username = req.params.username;
        const payload = oauthSchema.parse(req.body);
        const user = await repository.connectService(username, payload.serviceName);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            username: user.username,
            services: user.services
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=userRoutes.js.map