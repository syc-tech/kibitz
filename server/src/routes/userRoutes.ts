import { Router } from 'express';
import { z } from 'zod';
import { UserRepository } from '../repositories/userRepository';

const repository = new UserRepository();
export const userRouter = Router();

const registrationSchema = z.object({
  username: z.string().min(2),
  email: z.string().email()
});

const oauthSchema = z.object({
  serviceName: z.string().min(2)
});

userRouter.post('/register', async (req, res, next) => {
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
  } catch (error) {
    next(error);
  }
});

userRouter.get('/:username', async (req, res, next) => {
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
  } catch (error) {
    next(error);
  }
});

userRouter.post('/:username/oauth', async (req, res, next) => {
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
  } catch (error) {
    next(error);
  }
});
