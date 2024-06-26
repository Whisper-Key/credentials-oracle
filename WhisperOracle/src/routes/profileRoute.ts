// routes/profileRoute.ts
import express, { Router } from 'express';
import { getProfile, addOrUpdateProfile } from '../controllers/profileController.js';

export const profileRouter = express.Router();

profileRouter.post('/', addOrUpdateProfile);
profileRouter.get('/', getProfile);