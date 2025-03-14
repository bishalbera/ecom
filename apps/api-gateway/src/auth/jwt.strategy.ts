import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    interface JwtFromRequest {
      (req: Request): string;
    }

    const jwtFromRequest: JwtFromRequest = (req) => {
      const authHeader: string | undefined = req.headers['authorization'] as
        | string
        | undefined;
      console.log(authHeader);
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header not found');
      }
      const [bearer, token]: string[] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid token format');
      }
      console.log('token', token);
      return token;
    };

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt_secret'),
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, name: payload.name, email: payload.email };
  }
}
