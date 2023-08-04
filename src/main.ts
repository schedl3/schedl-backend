import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-session';
import * as connectMongoDbSession from 'connect-mongodb-session';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as fs from 'fs';
import { config } from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
  });

  const MongoDBStore = connectMongoDbSession(session);

  app.use(session({
    secret: process.env.SECRET,
    store: new MongoDBStore({
      uri: 'mongodb://localhost:27017/cats', // use 127.0.0.1 to force ipv4
      collection: 'sessions'
    }),
    resave: false,
    // enabling the saveUninitialized option Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. Choosing false is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing false will also help with race conditions where a client makes multiple parallel requests without a session
    saveUninitialized: false,
    cookie: {
      secure: true, // Set to true if using HTTPS, false for HTTP
      sameSite: 'none', // Needs secure
      httpOnly: false, // Allow client-side JavaScript to access the cookie
    }
  }));
  app.enableCors({
    origin: 'https://localhost:3130',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  const usersService = app.get(UsersService);
  // await usersService.createSampleUsers();
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
