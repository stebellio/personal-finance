export interface IPrismaRepository<PrismaModel, DomainModel> {
  prismaModelToDomainModel(prismaModel: PrismaModel): DomainModel;
}
