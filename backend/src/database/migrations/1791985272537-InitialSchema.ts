import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791985272537 implements MigrationInterface {
    name = 'InitialSchema1791985272537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "budgets" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "monthYear" date NOT NULL, "week" integer NOT NULL, "plannedValue" decimal(12,2) NOT NULL, CONSTRAINT "UQ_24ac1bbbd88da1e4ae840713fda" UNIQUE ("monthYear", "week"))`);
        await queryRunner.query(`CREATE TABLE "sectors" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "segment_id" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "segments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "type" varchar CHECK( "type" IN ('PROJECT','STANDARD') ) NOT NULL, CONSTRAINT "UQ_3dfbc88ab8243f9d3bd0b75d6d9" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "status" varchar CHECK( "status" IN ('ACTIVE','COMPLETED','CANCELLED') ) NOT NULL DEFAULT ('ACTIVE'), "startDate" date NOT NULL, "forecastEndDate" date NOT NULL, "realEndDate" date, "budget" decimal(12,2) NOT NULL, "realCost" decimal(12,2) NOT NULL DEFAULT ('0'), "segment_id" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "displayName" varchar(120) NOT NULL, "corporateName" varchar(200) NOT NULL, "cnpj" varchar(14) NOT NULL, CONSTRAINT "UQ_fce20fe3509933fa1931ae7cdad" UNIQUE ("cnpj"))`);
        await queryRunner.query(`CREATE TABLE "purchase_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderNumber" integer NOT NULL, "issueDate" date NOT NULL, "resource" varchar(200), "description" text NOT NULL, "requester" varchar(120) NOT NULL, "serviceType" varchar CHECK( "serviceType" IN ('PURCHASE','SERVICE') ) NOT NULL, "authorizationDate" date, "initialValue" decimal(12,2) NOT NULL, "finalValue" decimal(12,2) NOT NULL, "status" varchar CHECK( "status" IN ('PENDING','AUTHORIZED','DELIVERED','INVOICED','CANCELLED') ) NOT NULL DEFAULT ('PENDING'), "invoiceNumber" integer, "paymentCondition" varchar CHECK( "paymentCondition" IN ('ANTECIPATED','DD15','DD30','DD45','DD60') ), "deliveryDeadline" integer NOT NULL, "deliveryDate" date, "segment_id" integer NOT NULL, "sector_id" integer, "supplier_id" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "order_project" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "project_id" integer NOT NULL, CONSTRAINT "UQ_13fdbf1579d3d50bbf91075aee4" UNIQUE ("order_id", "project_id"))`);
        await queryRunner.query(`CREATE TABLE "temporary_sectors" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "segment_id" integer NOT NULL, CONSTRAINT "FK_4ab45269018008e71bb224f1802" FOREIGN KEY ("segment_id") REFERENCES "segments" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sectors"("id", "name", "segment_id") SELECT "id", "name", "segment_id" FROM "sectors"`);
        await queryRunner.query(`DROP TABLE "sectors"`);
        await queryRunner.query(`ALTER TABLE "temporary_sectors" RENAME TO "sectors"`);
        await queryRunner.query(`CREATE TABLE "temporary_projects" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "status" varchar CHECK( "status" IN ('ACTIVE','COMPLETED','CANCELLED') ) NOT NULL DEFAULT ('ACTIVE'), "startDate" date NOT NULL, "forecastEndDate" date NOT NULL, "realEndDate" date, "budget" decimal(12,2) NOT NULL, "realCost" decimal(12,2) NOT NULL DEFAULT ('0'), "segment_id" integer NOT NULL, CONSTRAINT "FK_a5f745bc39ac6afd07711cb43e7" FOREIGN KEY ("segment_id") REFERENCES "segments" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_projects"("id", "name", "status", "startDate", "forecastEndDate", "realEndDate", "budget", "realCost", "segment_id") SELECT "id", "name", "status", "startDate", "forecastEndDate", "realEndDate", "budget", "realCost", "segment_id" FROM "projects"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`ALTER TABLE "temporary_projects" RENAME TO "projects"`);
        await queryRunner.query(`CREATE TABLE "temporary_purchase_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderNumber" integer NOT NULL, "issueDate" date NOT NULL, "resource" varchar(200), "description" text NOT NULL, "requester" varchar(120) NOT NULL, "serviceType" varchar CHECK( "serviceType" IN ('PURCHASE','SERVICE') ) NOT NULL, "authorizationDate" date, "initialValue" decimal(12,2) NOT NULL, "finalValue" decimal(12,2) NOT NULL, "status" varchar CHECK( "status" IN ('PENDING','AUTHORIZED','DELIVERED','INVOICED','CANCELLED') ) NOT NULL DEFAULT ('PENDING'), "invoiceNumber" integer, "paymentCondition" varchar CHECK( "paymentCondition" IN ('ANTECIPATED','DD15','DD30','DD45','DD60') ), "deliveryDeadline" integer NOT NULL, "deliveryDate" date, "segment_id" integer NOT NULL, "sector_id" integer, "supplier_id" integer NOT NULL, CONSTRAINT "FK_96055ee51c211b8539b43779073" FOREIGN KEY ("segment_id") REFERENCES "segments" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_16b49bf0c3fd2d0f78116211eec" FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d16a885aa88447ccfd010e739b0" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchase_orders"("id", "orderNumber", "issueDate", "resource", "description", "requester", "serviceType", "authorizationDate", "initialValue", "finalValue", "status", "invoiceNumber", "paymentCondition", "deliveryDeadline", "deliveryDate", "segment_id", "sector_id", "supplier_id") SELECT "id", "orderNumber", "issueDate", "resource", "description", "requester", "serviceType", "authorizationDate", "initialValue", "finalValue", "status", "invoiceNumber", "paymentCondition", "deliveryDeadline", "deliveryDate", "segment_id", "sector_id", "supplier_id" FROM "purchase_orders"`);
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase_orders" RENAME TO "purchase_orders"`);
        await queryRunner.query(`CREATE TABLE "temporary_order_project" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "project_id" integer NOT NULL, CONSTRAINT "UQ_13fdbf1579d3d50bbf91075aee4" UNIQUE ("order_id", "project_id"), CONSTRAINT "FK_4fd183d75d9a923954af4b14f2c" FOREIGN KEY ("order_id") REFERENCES "purchase_orders" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5de6a78aeed653426e27544b0ff" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_order_project"("id", "order_id", "project_id") SELECT "id", "order_id", "project_id" FROM "order_project"`);
        await queryRunner.query(`DROP TABLE "order_project"`);
        await queryRunner.query(`ALTER TABLE "temporary_order_project" RENAME TO "order_project"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_project" RENAME TO "temporary_order_project"`);
        await queryRunner.query(`CREATE TABLE "order_project" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order_id" integer NOT NULL, "project_id" integer NOT NULL, CONSTRAINT "UQ_13fdbf1579d3d50bbf91075aee4" UNIQUE ("order_id", "project_id"))`);
        await queryRunner.query(`INSERT INTO "order_project"("id", "order_id", "project_id") SELECT "id", "order_id", "project_id" FROM "temporary_order_project"`);
        await queryRunner.query(`DROP TABLE "temporary_order_project"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" RENAME TO "temporary_purchase_orders"`);
        await queryRunner.query(`CREATE TABLE "purchase_orders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "orderNumber" integer NOT NULL, "issueDate" date NOT NULL, "resource" varchar(200), "description" text NOT NULL, "requester" varchar(120) NOT NULL, "serviceType" varchar CHECK( "serviceType" IN ('PURCHASE','SERVICE') ) NOT NULL, "authorizationDate" date, "initialValue" decimal(12,2) NOT NULL, "finalValue" decimal(12,2) NOT NULL, "status" varchar CHECK( "status" IN ('PENDING','AUTHORIZED','DELIVERED','INVOICED','CANCELLED') ) NOT NULL DEFAULT ('PENDING'), "invoiceNumber" integer, "paymentCondition" varchar CHECK( "paymentCondition" IN ('ANTECIPATED','DD15','DD30','DD45','DD60') ), "deliveryDeadline" integer NOT NULL, "deliveryDate" date, "segment_id" integer NOT NULL, "sector_id" integer, "supplier_id" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "purchase_orders"("id", "orderNumber", "issueDate", "resource", "description", "requester", "serviceType", "authorizationDate", "initialValue", "finalValue", "status", "invoiceNumber", "paymentCondition", "deliveryDeadline", "deliveryDate", "segment_id", "sector_id", "supplier_id") SELECT "id", "orderNumber", "issueDate", "resource", "description", "requester", "serviceType", "authorizationDate", "initialValue", "finalValue", "status", "invoiceNumber", "paymentCondition", "deliveryDeadline", "deliveryDate", "segment_id", "sector_id", "supplier_id" FROM "temporary_purchase_orders"`);
        await queryRunner.query(`DROP TABLE "temporary_purchase_orders"`);
        await queryRunner.query(`ALTER TABLE "projects" RENAME TO "temporary_projects"`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "status" varchar CHECK( "status" IN ('ACTIVE','COMPLETED','CANCELLED') ) NOT NULL DEFAULT ('ACTIVE'), "startDate" date NOT NULL, "forecastEndDate" date NOT NULL, "realEndDate" date, "budget" decimal(12,2) NOT NULL, "realCost" decimal(12,2) NOT NULL DEFAULT ('0'), "segment_id" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "projects"("id", "name", "status", "startDate", "forecastEndDate", "realEndDate", "budget", "realCost", "segment_id") SELECT "id", "name", "status", "startDate", "forecastEndDate", "realEndDate", "budget", "realCost", "segment_id" FROM "temporary_projects"`);
        await queryRunner.query(`DROP TABLE "temporary_projects"`);
        await queryRunner.query(`ALTER TABLE "sectors" RENAME TO "temporary_sectors"`);
        await queryRunner.query(`CREATE TABLE "sectors" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(120) NOT NULL, "segment_id" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "sectors"("id", "name", "segment_id") SELECT "id", "name", "segment_id" FROM "temporary_sectors"`);
        await queryRunner.query(`DROP TABLE "temporary_sectors"`);
        await queryRunner.query(`DROP TABLE "order_project"`);
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "segments"`);
        await queryRunner.query(`DROP TABLE "sectors"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
    }

}
