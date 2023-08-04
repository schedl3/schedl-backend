import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { config } from 'dotenv';
import { TwitterProfile, TwitterProfileSchema } from './twitter-profile.schema';

config();

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
    constructor(
        @InjectModel(TwitterProfile.name) private readonly twitterProfileModel: Model<TwitterProfile>,
        private usersService: UsersService,
    ) {
        super({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: process.env.TWITTER_CALLBACK_URL,
            passReqToCallback: true, // works? `passReqToCallback`     when `true`, `req` is the first argument to the verify callback (default: `false`)
            // session: true,
        });
    }

    async validate(request: any, token: string, tokenSecret: string, profile: any): Promise<User> {
        // console.log('session', request.session);
        await this.twitterProfileModel.create({ profile_raw: profile._raw });
        // console.log('screen_name', profile.screen_name);
        // console.log('display', profile.displayName);
        console.log('username', profile.username);

        let user = await this.usersService.setTwitterUsername(request.session['idAddress'], profile.username);
        return user;
    }
}
