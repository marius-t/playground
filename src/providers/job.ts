import { Job, Prisma } from '@prisma/client';

import { prisma } from '../prisma';

export default class JobProvider {
  public async getJobs(): Promise<Job[]> {
    return prisma.job.findMany();
  }

  public async getJob(id: number): Promise<Job | null> {
    return prisma.job.findUnique({ where: { id } });
  }

  public async createJob(data: Prisma.JobUncheckedCreateInput): Promise<Job> {
    return prisma.job.create({ data });
  }

  public async updateJob(
    id: number,
    data: Prisma.JobUncheckedUpdateInput,
  ): Promise<Job> {
    return prisma.job.update({ where: { id }, data });
  }

  public async deleteJob(id: number): Promise<Job> {
    return prisma.job.delete({ where: { id } });
  }
}
