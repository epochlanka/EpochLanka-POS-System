import { prisma } from "../src/lib/prisma";


async function main() {
  console.log("Seeding started...");

  // 1. Create Roles
  const roles = [
    {
      name: "Owner",
      permissions: {
        "admin.access": true,
        "products.create": true,
        "products.edit": true,
        "products.delete": true,
        "sales.create": true,
        "reports.view": true,
      },
    },
    {
      name: "Manager",
      permissions: {
        "admin.access": false,
        "products.create": true,
        "products.edit": true,
        "products.delete": false,
        "sales.create": true,
        "reports.view": true,
      },
    },
    {
      name: "Cashier",
      permissions: {
        "admin.access": false,
        "products.create": false,
        "products.edit": false,
        "products.delete": false,
        "sales.create": true,
        "reports.view": false,
      },
    },
    {
      name: "Staff",
      permissions: {
        "admin.access": false,
        "products.create": false,
        "products.edit": false,
        "products.delete": false,
        "sales.create": false,
        "reports.view": false,
      },
    },
  ];

  const createdRoles = [];
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: {
        name: role.name,
        permissions: role.permissions,
      },
    });
    createdRoles.push(createdRole);
    console.log(`Role ${createdRole.name} created/updated.`);
  }

  // Find the Owner role to link to the admin user
  const ownerRole = createdRoles.find((r) => r.name === "Owner");
  if (!ownerRole) {
    throw new Error("Owner role not created.");
  }

  // 2. Create Default User (Admin/Owner)
  // Password hash for 'admin123'
  // Using a pre-hashed string for 'admin123' (bcrypt hash)
  const defaultAdmin = await prisma.user.upsert({
    where: { email: "admin@epochlanka.com" },
    update: {},
    create: {
      name: "Default Admin",
      email: "admin@epochlanka.com",
      passwordHash: "$2b$10$WjKkK/AmvD4zZV0HvXL3iOylbBWHbgsQZ.t7Vr9zSxJ2MJFIWHHZ2", // verified bcrypt hash for 'admin123'
      roleId: ownerRole.id,
      isActive: true,
    },
  });

  console.log(`Default admin user created: ${defaultAdmin.email}`);

  // 3. Create default Branches + Warehouses (multi-branch stock needs at least one of each)
  const branchSeeds = [
    { name: "Main Branch", address: "Kandy, Sri Lanka", warehouseName: "Main Warehouse" },
    { name: "Colombo Branch", address: "Colombo, Sri Lanka", warehouseName: "Colombo Warehouse" },
  ];

  for (const b of branchSeeds) {
    let branch = await prisma.branch.findFirst({ where: { name: b.name } });
    if (!branch) {
      branch = await prisma.branch.create({ data: { name: b.name, address: b.address } });
    }
    const existingWarehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
    if (!existingWarehouse) {
      await prisma.warehouse.create({ data: { name: b.warehouseName, branchId: branch.id } });
    }
    console.log(`Branch "${b.name}" with warehouse ready.`);
  }

  // 4. Create default Units of Measure + one conversion pair
  const unitSeeds = [
    { name: "Piece", symbol: "pc" },
    { name: "Kilogram", symbol: "kg" },
    { name: "Box", symbol: "box" },
  ];
  const createdUnits: Record<string, { id: string }> = {};
  for (const u of unitSeeds) {
    const unit = await prisma.unit.upsert({
      where: { name: u.name },
      update: { symbol: u.symbol },
      create: u,
    });
    createdUnits[u.name] = unit;
  }
  const box = createdUnits["Box"];
  const piece = createdUnits["Piece"];
  const existingConversion = await prisma.unitConversion.findUnique({
    where: { fromUnitId_toUnitId: { fromUnitId: box.id, toUnitId: piece.id } },
  });
  if (!existingConversion) {
    await prisma.unitConversion.create({
      data: { fromUnitId: box.id, toUnitId: piece.id, factor: 12 }, // 1 Box = 12 Piece
    });
  }
  console.log("Default units of measure ready.");

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  });
