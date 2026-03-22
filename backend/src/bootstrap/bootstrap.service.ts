import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onApplicationBootstrap() {
    const enabled = this.configService.get<string>(
      'SEED_CONSOLE_USERS',
      'true',
    );
    if (enabled.toLowerCase() !== 'true') {
      return;
    }

    await this.ensureUser({
      email: this.configService.get<string>(
        'SEED_ADMIN_EMAIL',
        'admin@learn.local',
      ),
      password: this.configService.get<string>(
        'SEED_ADMIN_PASSWORD',
        'Admin12345!',
      ),
      role: Role.ADMIN,
      firstName: this.configService.get<string>(
        'SEED_ADMIN_FIRST_NAME',
        'Platform',
      ),
      lastName: this.configService.get<string>('SEED_ADMIN_LAST_NAME', 'Admin'),
    });

    await this.ensureUser({
      email: this.configService.get<string>(
        'SEED_INSTRUCTOR_EMAIL',
        'instructor@learn.local',
      ),
      password: this.configService.get<string>(
        'SEED_INSTRUCTOR_PASSWORD',
        'Instructor12345!',
      ),
      role: Role.INSTRUCTOR,
      firstName: this.configService.get<string>(
        'SEED_INSTRUCTOR_FIRST_NAME',
        'Course',
      ),
      lastName: this.configService.get<string>(
        'SEED_INSTRUCTOR_LAST_NAME',
        'Author',
      ),
    });
  }

  private async ensureUser(input: {
    email: string | undefined;
    password: string | undefined;
    role: Role;
    firstName?: string | undefined;
    lastName?: string | undefined;
  }) {
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();
    if (!email || !password) {
      return;
    }

    const passwordHash = await hash(password, 10);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role: input.role,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });
      this.logger.log(`Seeded ${input.role} user: ${email}`);
      return;
    }

    if (user.role !== input.role) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: input.role },
      });
      this.logger.log(`Updated role to ${input.role} for: ${email}`);
    }
  }
}
