import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmailWithPassword(
      dto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const userWithPassword = await this.usersService.findOneByEmailWithPassword(
      dto.email,
    );
    if (!userWithPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      userWithPassword.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sanitizedUser = { ...userWithPassword };
    delete (sanitizedUser as Record<string, unknown>).passwordHash;
    const payload = {
      sub: sanitizedUser.id,
      email: sanitizedUser.email,
      role: sanitizedUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: sanitizedUser,
      accessToken,
    };
  }
}
