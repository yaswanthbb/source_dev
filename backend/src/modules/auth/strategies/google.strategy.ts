import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>(
        'GOOGLE_CLIENT_ID',
        'placeholder_client_id',
      ),
      clientSecret: configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
        'placeholder_client_secret',
      ),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email =
      profile.emails && profile.emails[0] ? profile.emails[0].value : '';
    const photo =
      profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    const name =
      profile.displayName ||
      `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
      'Google User';

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email: email.toLowerCase().trim(),
      name,
      photo,
    };

    done(null, oauthProfile);
  }
}
