import { Prisma, User } from '@prisma/client';

import { prisma } from '../prisma';

export default class UserProvider {
  public async getUsers(): Promise<User[]> {
    return prisma.user.findMany();
  }

  public async getUser(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  public async createUser(
    data: Prisma.UserUncheckedCreateInput,
  ): Promise<User> {
    return prisma.user.create({ data });
  }

  public async updateUser(
    id: number,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  public async deleteUser(id: number): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }
}
