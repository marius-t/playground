import { Candidate, Prisma } from '@prisma/client';

import { prisma } from '../prisma';

export default class CandidateProvider {
  public async getCandidates(): Promise<Candidate[]> {
    return prisma.candidate.findMany();
  }

  public async getCandidate(id: number): Promise<Candidate | null> {
    return prisma.candidate.findUnique({ where: { id } });
  }

  public async createCandidate(
    data: Prisma.CandidateUncheckedCreateInput,
  ): Promise<Candidate> {
    return prisma.candidate.create({ data });
  }

  public async updateCandidate(
    id: number,
    data: Prisma.CandidateUncheckedUpdateInput,
  ): Promise<Candidate> {
    return prisma.candidate.update({ where: { id }, data });
  }

  public async deleteCandidate(id: number): Promise<Candidate> {
    return prisma.candidate.delete({ where: { id } });
  }
}
