// authRoutes.js

import express from 'express';
import passport from 'passport';
import { Signin } from '../models/signinSchema.js';
const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// after Google redirects back to your app
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/google/failure',
  }),
  (req, res) => {
    res.redirect('http://localhost:3000/home');
    // credentials are stored in session, you can access them via req.user
    const userSession = req.user;
    Signin.create({
      id: userSession.id,
      displayName: userSession.displayName,
      email: userSession.emails[0].value,
      profilePicture: userSession.photos[0].value,
    });
    console.log('User signed in:', userSession);
    // You can also send user data back to the client if needed
    const user = req.user;
    console.log('User authenticated:', user);
  }
);

router.get('/google/failure', (req, res) => {
  res.send('Google authentication failed');
});

export default router;
