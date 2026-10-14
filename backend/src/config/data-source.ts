import 'reflect-metadata';
import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Budget } from '../database/entities/budget.entity';
import { OrderProject } from '../database/entities/order-project.entity';
import { Project } from '../database/entities/project.entity';
import { PurchaseOrder } from '../database/entities/purchase-order.entity';
import { Sector } from '../database/entities/sector.entity';
import { Segment } from '../database/entities/segment.entity';
import { Supplier } from '../database/entities/supplier.entity';

const databaseFile = resolve(process.env.DATABASE_FILE ?? 'data/app.sqlite');
mkdirSync(resolve(databaseFile, '..'), { recursive: true });

export const dataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: databaseFile,
  entities: [Segment, Sector, Project, Supplier, PurchaseOrder, OrderProject, Budget],
  // __dirname resolves to src/config under ts-node (CLI) and dist/config at runtime,
  // so the correct compiled migrations are always picked up.
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  migrationsRun: true,
  synchronize: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
