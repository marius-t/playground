import { Log, Prisma } from '@prisma/client';

import { prisma } from '../prisma';

export default class LogProvider {
  public async getLogs(): Promise<Log[]> {
    return prisma.log.findMany();
  }

  public async getLog(id: number): Promise<Log | null> {
    return prisma.log.findUnique({ where: { id } });
  }

  public async createLog(data: Prisma.LogUncheckedCreateInput): Promise<Log> {
    return prisma.log.create({ data });
  }

  public async updateLog(
    id: number,
    data: Prisma.LogUncheckedUpdateInput,
  ): Promise<Log> {
    return prisma.log.update({ where: { id }, data });
  }

  public async deleteLog(id: number): Promise<Log> {
    return prisma.log.delete({ where: { id } });
  }
}
