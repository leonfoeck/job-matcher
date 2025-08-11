import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { UpdateProfileDto, ProjectDto, ExperienceDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: {
    email: string;
    name?: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash: data.passwordHash,
        profile: { create: {} },
      },
    });
  }

  getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { projects: true, experiences: true } } },
    });
  }

  async upsertProfile(userId: number, payload: UpdateProfileDto) {
    const {
      headline,
      summary,
      skills,
      projects = [],
      experiences = [],
    } = payload ?? {};

    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.upsert({
        where: { userId },
        create: { userId, headline, summary, skills },
        update: { headline, summary, skills },
      });

      await tx.project.deleteMany({ where: { profileId: profile.id } });
      await tx.experience.deleteMany({ where: { profileId: profile.id } });

      const mapProject = (p: ProjectDto) => ({
        profileId: profile.id,
        name: p.name,
        link: p.link ?? null,
        tech: p.tech ?? null,
        description: p.description ?? null,
      });
      const mapExperience = (e: ExperienceDto) => ({
        profileId: profile.id,
        company: e.company,
        title: e.title,
        start: e.start ?? null,
        end: e.end ?? null,
        description: e.description ?? null,
        tech: e.tech ?? null,
      });

      if (projects.length) {
        await tx.project.createMany({ data: projects.map(mapProject) });
      }
      if (experiences.length) {
        await tx.experience.createMany({ data: experiences.map(mapExperience) });
      }
    });

    return this.getMe(userId);
  }
}
