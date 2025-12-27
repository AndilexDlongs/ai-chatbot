import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  findUserByProvider,
  findUserByEmail,
  createOAuthUser,
} from '../services/user.service.js';

const {
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  GOOGLE_CALLBACK_URL = 'http://localhost:8787/auth/google/callback',
} = process.env;

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const provider = 'google';
        const providerSub = profile.id;
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google'));

        let user = findUserByProvider(provider, providerSub);
        if (!user) {
          // If user exists by email (local) you could link; for now, reuse existing email if present.
          const existingEmailUser = findUserByEmail(email);
          if (existingEmailUser) {
            user = existingEmailUser;
          } else {
            user = createOAuthUser({ provider, providerSub, email });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
