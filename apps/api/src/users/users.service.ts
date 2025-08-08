import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: { email: string; name?: string; passwordHash: string }) {
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

    // profile update
    async upsertProfile(userId: number, payload: any) {
        // simple merge (replace arrays)
        const { headline, summary, skills, projects = [], experiences = [] } = payload ?? {};
        const profile = await this.prisma.profile.upsert({
            where: { userId },
            create: { userId, headline, summary, skills },
            update: { headline, summary, skills },
        });
        // replace nested
        await this.prisma.project.deleteMany({ where: { profileId: profile.id } });
        await this.prisma.experience.deleteMany({ where: { profileId: profile.id } });
        if (projects.length)
            await this.prisma.project.createMany({ data: projects.map((p:any) => ({ ...p, profileId: profile.id })) });
        if (experiences.length)
            await this.prisma.experience.createMany({ data: experiences.map((e:any) => ({ ...e, profileId: profile.id })) });

        return this.getMe(userId);
    }
}
