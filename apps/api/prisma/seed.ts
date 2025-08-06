import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // First, try to find the company by name
    let company = await prisma.company.findFirst({
        where: { name: 'Isar Aerospace' },
    });

    // If company doesn't exist, create it
    if (!company) {
        company = await prisma.company.create({
            data: { 
                name: 'Isar Aerospace', 
                source: 'greenhouse', 
                baseUrl: 'https://isaraerospace.com' 
            },
        });
    }

    await prisma.jobPost.upsert({
        where: { url: 'https://example.com/jobs/werkstudent-data' },
        update: {},
        create: {
            companyId: company.id,
            title: 'Werkstudent:in Data Engineering',
            url: 'https://example.com/jobs/werkstudent-data',
            location: 'München',
            seniority: 'Working Student',
            postedAt: new Date(),
            rawText: 'Data Pipelines mit Python/SQL, Airflow nice-to-have.',
        },
    });
}

main().finally(() => prisma.$disconnect());
