import express from 'express';
import passport from '../auth/passport.js';
import {
  renderLogin,
  renderSignup,
  login,
  register,
  logout,
  handleOAuthSuccess,
  handleOAuthFailure,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/login', renderLogin);
router.get('/signup', renderSignup);
router.get('/logout', logout);

router.post('/auth/login', login);
router.post('/auth/register', register);

// Google OAuth flow
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?oauth=failed', session: false }),
  handleOAuthSuccess
);

router.get('/auth/google/failure', handleOAuthFailure);

export default router;
