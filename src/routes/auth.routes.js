import express from 'express';
import {
  renderLogin,
  renderSignup,
  login,
  register,
  logout,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/login', renderLogin);
router.get('/signup', renderSignup);
router.get('/logout', logout);

router.post('/auth/login', login);
router.post('/auth/register', register);

export default router;
