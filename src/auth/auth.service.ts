import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  private users: User[] = [];
  private tokens = new Map<string, string>();

  register(body: { name?: string; email?: string; password?: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = this.users.find((user) => user.email === body.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user: User = {
      id: Date.now().toString() + Math.random().toString(),
      name: body.name || 'User',
      email: body.email,
      password: body.password,
    };

    this.users.push(user);

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  login(body: { email?: string; password?: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = this.users.find(
      (item) => item.email === body.email && item.password === body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = `token-${user.id}-${Date.now()}`;
    this.tokens.set(token, user.id);

    return {
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  validateToken(token: string) {
    const userId = this.tokens.get(token);

    if (!userId) {
      return null;
    }

    return this.users.find((user) => user.id === userId) || null;
  }
}