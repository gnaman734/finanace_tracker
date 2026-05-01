import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { User } from '../models/index.js';
import { seedDefaultCategories } from '../services/seedDefaultCategories.js';

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('Google profile missing email'), null);
          }

          let user = await User.findOne({ where: { google_id: googleId } });
          let created = false;

          if (!user && email) {
            user = await User.findOne({ where: { email } });
          }

          if (!user) {
            user = await User.create({
              name: profile.displayName || 'Google User',
              email,
              google_id: googleId,
              avatar_url: profile.photos?.[0]?.value
            });
            created = true;
          } else if (!user.google_id) {
            await user.update({ google_id: googleId });
          }

          if (!user.is_active) {
            return done(new Error('Account disabled'), null);
          }

          if (created) {
            await seedDefaultCategories(user.id);
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export default passport;
