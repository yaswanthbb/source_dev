import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>(
        'GITHUB_CLIENT_ID',
        'placeholder_client_id',
      ),
      clientSecret: configService.get<string>(
        'GITHUB_CLIENT_SECRET',
        'placeholder_client_secret',
      ),
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3000/auth/github/callback',
      ),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ): Promise<void> {
    let email = '';
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    }

    // Handle GitHub private email setting by calling the GitHub emails API
    if (!email && accessToken) {
      try {
        const res = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'KnowledgeIsPower-App',
          },
        });
        if (res.ok) {
          const emails: Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }> = await res.json();
          const primaryEmail =
            emails.find((e) => e.primary && e.verified) ||
            emails.find((e) => e.verified) ||
            emails[0];
          if (primaryEmail) {
            email = primaryEmail.email;
          }
        }
      } catch {
        // Continue with whatever email we have
      }
    }

    const photo =
      profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    const name = profile.displayName || profile.username || 'GitHub User';

    const oauthProfile: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email: email.toLowerCase().trim(),
      name,
      photo,
    };

    done(null, oauthProfile);
  }
}
