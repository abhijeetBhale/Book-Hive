import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { processGoogleAvatar, getDefaultAvatar } from '../utils/avatarHelpers.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔧 Initializing Google OAuth with:');
  console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('   Callback URL: /api/auth/google/callback');
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback', // This must exactly match your Google API Console settings
        proxy: true
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Google Profile Data:', {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photos: profile.photos?.map(photo => photo.value)
        });

        // Process Google profile photo to get high quality version
        let avatarUrl = processGoogleAvatar(profile.photos);
        
        // If no Google photo available, generate a default avatar
        if (!avatarUrl) {
          avatarUrl = getDefaultAvatar(profile.displayName, profile.emails[0].value);
          console.log('📸 No Google photo found, using default avatar');
        } else {
          console.log('📸 Using Google profile photo:', avatarUrl);
          
          // Validate the Google avatar URL to ensure it's accessible
          try {
            const response = await fetch(avatarUrl, { method: 'HEAD' });
            if (!response.ok) {
              console.log('📸 Google avatar not accessible, using default');
              avatarUrl = getDefaultAvatar(profile.displayName, profile.emails[0].value);
            }
          } catch (error) {
            console.log('📸 Error validating Google avatar, using default');
            avatarUrl = getDefaultAvatar(profile.displayName, profile.emails[0].value);
          }
        }

        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log('👤 Existing user found, checking for updates...');
          
          // Update existing user's avatar and name in case they changed it on Google
          let hasUpdates = false;
          
          if (user.avatar !== avatarUrl) {
            console.log('🖼️ Updating user avatar from:', user.avatar, 'to:', avatarUrl);
            user.avatar = avatarUrl;
            hasUpdates = true;
          }
          
          if (user.name !== profile.displayName) {
            console.log('📝 Updating user name from:', user.name, 'to:', profile.displayName);
            user.name = profile.displayName;
            hasUpdates = true;
          }

          // Save updates if any
          if (hasUpdates) {
            await user.save();
            console.log('✅ User profile updated successfully');
          } else {
            console.log('ℹ️ No updates needed for existing user');
          }
          
          return done(null, user);
        } else {
          console.log('🆕 Creating new user with Google profile data...');
          
          // If the user doesn't exist, create a new one
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: avatarUrl,
            location: {
              type: 'Point',
              coordinates: [0, 0], // Default coordinates, will be updated by client
              address: 'Location not set'
            }
          });
          
          await newUser.save();
          console.log('✅ New user created successfully with avatar:', avatarUrl);
          return done(null, newUser);
        }
      } catch (err) {
        console.error("❌ Error in Passport Google Strategy:", err);
        return done(err, false);
      }
    }
  )
);
} else {
  console.log('⚠️ Google OAuth credentials not found. Google login will be disabled.');
  console.log('💡 To enable Google login, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
}