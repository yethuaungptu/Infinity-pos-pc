// Prisma Database Seed
// Populates the database with initial data for Agricultural POS System

import { PrismaClient } from '@prisma/client';
import {
  CustomerType,
  ProductType,
  StaffPosition,
  StaffDepartment,
  StaffPermission,
  PaymentMethod,
  CreditStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // ================================
    // STORE CONFIGURATION
    // ================================
    console.log('Creating store configuration...');

    const store = await prisma.store.upsert({
      where: { id: 'store_main' },
      update: {},
      create: {
        id: 'store_main',
        name: process.env.STORE_NAME || 'AgriSupply Store',
        address:
          process.env.STORE_ADDRESS ||
          '123 Farm Road, Agriculture Valley, CA 93444',
        phone: process.env.STORE_PHONE || '+1 (555) 123-4567',
        email: process.env.STORE_EMAIL || 'info@agrisupply.com',
        taxRate: parseFloat(process.env.STORE_TAX_RATE || '8.25'),
        currency: process.env.STORE_CURRENCY || 'USD',
        timezone: process.env.STORE_TIMEZONE || 'America/Los_Angeles',
        receiptHeader: 'Thank you for your business!',
        receiptFooter: 'Quality feed and supplies for your farm',
      },
    });

    // ================================
    // SYSTEM SETTINGS
    // ================================
    console.log('Creating system settings...');

    const settings = [
      {
        key: 'low_stock_threshold',
        value: '10',
        dataType: 'number',
        description: 'Default low stock alert threshold',
      },
      {
        key: 'auto_sync_enabled',
        value: 'true',
        dataType: 'boolean',
        description: 'Enable automatic data synchronization',
      },
      {
        key: 'sync_interval_minutes',
        value: '5',
        dataType: 'number',
        description: 'Sync interval in minutes',
      },
      {
        key: 'receipt_print_logo',
        value: 'true',
        dataType: 'boolean',
        description: 'Print store logo on receipts',
      },
      {
        key: 'auto_open_drawer',
        value: 'true',
        dataType: 'boolean',
        description: 'Automatically open cash drawer',
      },
      {
        key: 'default_payment_terms',
        value: '30',
        dataType: 'number',
        description: 'Default credit payment terms in days',
      },
      {
        key: 'max_credit_limit',
        value: '50000',
        dataType: 'number',
        description: 'Maximum credit limit for customers',
      },
      {
        key: 'hen_egg_default_price',
        value: '2.50',
        dataType: 'number',
        description: 'Default price per dozen hen eggs',
      },
      {
        key: 'duck_egg_default_price',
        value: '4.00',
        dataType: 'number',
        description: 'Default price per dozen duck eggs',
      },
    ];

    for (const setting of settings) {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

    // ================================
    // STAFF ACCOUNTS
    // ================================
    console.log('Creating staff accounts...');

    const adminStaff = await prisma.staff.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        employeeId: 'EMP001',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@agrisupply.com',
        username: 'admin',
        position: StaffPosition.ADMIN,
        department: StaffDepartment.ADMIN,
        hireDate: new Date(),
        salary: 60000,
        permissions: [
          StaffPermission.POS_SALES,
          StaffPermission.INVENTORY_MANAGE,
          StaffPermission.CUSTOMER_MANAGE,
          StaffPermission.EGG_COLLECTION,
          StaffPermission.VENDOR_MANAGE,
          StaffPermission.REPORTS_VIEW,
          StaffPermission.REPORTS_EXPORT,
          StaffPermission.CREDIT_APPROVE,
          StaffPermission.SETTINGS_MANAGE,
          StaffPermission.STAFF_MANAGE,
          StaffPermission.CASH_HANDLE,
          StaffPermission.REFUND_PROCESS,
        ],
        active: true,
      },
    });

    const managerStaff = await prisma.staff.create({
      data: {
        employeeId: 'EMP002',
        firstName: 'John',
        lastName: 'Manager',
        email: 'john.manager@agrisupply.com',
        username: 'john.manager',
        position: StaffPosition.MANAGER,
        department: StaffDepartment.MANAGEMENT,
        hireDate: new Date('2023-01-15'),
        salary: 50000,
        permissions: [
          StaffPermission.POS_SALES,
          StaffPermission.INVENTORY_MANAGE,
          StaffPermission.CUSTOMER_MANAGE,
          StaffPermission.REPORTS_VIEW,
          StaffPermission.REPORTS_EXPORT,
          StaffPermission.CREDIT_APPROVE,
          StaffPermission.CASH_HANDLE,
          StaffPermission.REFUND_PROCESS,
        ],
        active: true,
      },
    });

    const cashierStaff = await prisma.staff.create({
      data: {
        employeeId: 'EMP003',
        firstName: 'Sarah',
        lastName: 'Cashier',
        email: 'sarah.cashier@agrisupply.com',
        username: 'sarah.cashier',
        position: StaffPosition.CASHIER,
        department: StaffDepartment.SALES,
        hireDate: new Date('2023-03-20'),
        salary: 35000,
        permissions: [
          StaffPermission.POS_SALES,
          StaffPermission.CUSTOMER_MANAGE,
          StaffPermission.CASH_HANDLE,
        ],
        active: true,
      },
    });

    const collectorStaff = await prisma.staff.create({
      data: {
        employeeId: 'EMP004',
        firstName: 'Mike',
        lastName: 'Collector',
        email: 'mike.collector@agrisupply.com',
        username: 'mike.collector',
        position: StaffPosition.COLLECTOR,
        department: StaffDepartment.COLLECTION,
        hireDate: new Date('2023-05-10'),
        salary: 38000,
        permissions: [
          StaffPermission.EGG_COLLECTION,
          StaffPermission.CUSTOMER_MANAGE,
        ],
        totalCollections: 0,
        averageQuality: 0,
        onTimeRate: 100,
        active: true,
      },
    });

    // ================================
    // VENDORS
    // ================================
    console.log('Creating vendors...');

    const feedVendor = await prisma.vendor.create({
      data: {
        companyName: 'Premium Feed Co.',
        contactPerson: 'Robert Smith',
        email: 'robert@premiumfeed.com',
        phone: '+1 (555) 201-2001',
        address: {
          street: '456 Industrial Blvd',
          city: 'Feed Valley',
          state: 'CA',
          zipCode: '93445',
          country: 'US',
        },
        creditLimit: 200000,
        creditBalance: 0,
        paymentTerms: 45,
        earlyPaymentDiscount: 2.0,
        productTypes: [ProductType.FEED, ProductType.SUPPLIES],
        totalPurchases: 0,
        onTimePaymentRate: 100,
        active: true,
      },
    });

    const medicineVendor = await prisma.vendor.create({
      data: {
        companyName: 'AgriVet Solutions',
        contactPerson: 'Dr. Lisa Johnson',
        email: 'lisa@agrivet.com',
        phone: '+1 (555) 301-3001',
        address: {
          street: '789 Medical Drive',
          city: 'Vet City',
          state: 'CA',
          zipCode: '93446',
          country: 'US',
        },
        creditLimit: 150000,
        creditBalance: 0,
        paymentTerms: 60,
        earlyPaymentDiscount: 1.5,
        productTypes: [ProductType.MEDICINE],
        totalPurchases: 0,
        onTimePaymentRate: 100,
        active: true,
      },
    });

    const equipmentVendor = await prisma.vendor.create({
      data: {
        companyName: 'Farm Equipment Plus',
        contactPerson: 'Tom Wilson',
        email: 'tom@farmequipplus.com',
        phone: '+1 (555) 401-4001',
        creditLimit: 100000,
        creditBalance: 0,
        paymentTerms: 30,
        earlyPaymentDiscount: 2.5,
        productTypes: [ProductType.EQUIPMENT, ProductType.SUPPLIES],
        totalPurchases: 0,
        onTimePaymentRate: 100,
        active: true,
      },
    });

    // ================================
    // PRODUCTS
    // ================================
    console.log('Creating products...');

    // Feed Products
    const feedProducts = [
      {
        sku: 'FEED001',
        name: 'Premium Poultry Layer Feed',
        description: 'High-quality feed for laying hens, 16% protein',
        type: ProductType.FEED,
        category: 'poultry_feed',
        costPrice: 25.0,
        sellingPrice: 35.0,
        wholesalePrice: 32.0,
        stock: 150,
        unit: 'bags',
        minimumStock: 20,
        animalType: 'poultry',
        nutritionInfo: '16% protein, 3.5% fat, 7% fiber',
        primaryVendorId: feedVendor.id,
      },
      {
        sku: 'FEED002',
        name: 'Duck Grower Feed',
        description: 'Specialized feed for growing ducks',
        type: ProductType.FEED,
        category: 'duck_feed',
        costPrice: 28.0,
        sellingPrice: 38.0,
        wholesalePrice: 35.0,
        stock: 80,
        unit: 'bags',
        minimumStock: 15,
        animalType: 'poultry',
        nutritionInfo: '18% protein, 4% fat, 6% fiber',
        primaryVendorId: feedVendor.id,
      },
      {
        sku: 'FEED003',
        name: 'Cattle Feed Pellets',
        description: 'Complete nutrition for dairy and beef cattle',
        type: ProductType.FEED,
        category: 'cattle_feed',
        costPrice: 22.0,
        sellingPrice: 30.0,
        wholesalePrice: 28.0,
        stock: 200,
        unit: 'bags',
        minimumStock: 25,
        animalType: 'cattle',
        nutritionInfo: '14% protein, 2.5% fat, 12% fiber',
        primaryVendorId: feedVendor.id,
      },
    ];

    // Medicine Products
    const medicineProducts = [
      {
        sku: 'MED001',
        name: 'Poultry Antibiotic (Amoxicillin)',
        description: 'Broad spectrum antibiotic for poultry',
        type: ProductType.MEDICINE,
        category: 'antibiotics',
        costPrice: 15.0,
        sellingPrice: 25.0,
        stock: 45,
        unit: 'bottles',
        minimumStock: 10,
        requiresPrescription: true,
        activeIngredient: 'Amoxicillin',
        expiryDate: new Date('2025-12-31'),
        primaryVendorId: medicineVendor.id,
      },
      {
        sku: 'MED002',
        name: 'Vitamin Supplement',
        description: 'Multi-vitamin supplement for poultry health',
        type: ProductType.MEDICINE,
        category: 'supplements',
        costPrice: 8.0,
        sellingPrice: 15.0,
        stock: 60,
        unit: 'bottles',
        minimumStock: 15,
        requiresPrescription: false,
        activeIngredient: 'Multi-vitamins',
        expiryDate: new Date('2026-06-30'),
        primaryVendorId: medicineVendor.id,
      },
      {
        sku: 'MED003',
        name: 'Deworming Medicine',
        description: 'Effective deworming treatment for poultry',
        type: ProductType.MEDICINE,
        category: 'dewormers',
        costPrice: 12.0,
        sellingPrice: 20.0,
        stock: 35,
        unit: 'bottles',
        minimumStock: 8,
        requiresPrescription: true,
        activeIngredient: 'Levamisole',
        expiryDate: new Date('2025-09-15'),
        primaryVendorId: medicineVendor.id,
      },
    ];

    // Equipment Products
    const equipmentProducts = [
      {
        sku: 'EQUIP001',
        name: 'Automatic Poultry Feeder',
        description: 'Gravity-fed automatic feeder for chickens',
        type: ProductType.EQUIPMENT,
        category: 'feeders',
        costPrice: 45.0,
        sellingPrice: 75.0,
        stock: 20,
        unit: 'pieces',
        minimumStock: 5,
        primaryVendorId: equipmentVendor.id,
      },
      {
        sku: 'EQUIP002',
        name: 'Poultry Water Nipples',
        description: 'Automatic water nipples for chicken coops',
        type: ProductType.EQUIPMENT,
        category: 'waterers',
        costPrice: 2.5,
        sellingPrice: 5.0,
        stock: 100,
        unit: 'pieces',
        minimumStock: 25,
        primaryVendorId: equipmentVendor.id,
      },
    ];

    // Egg Products
    const eggProducts = [
      {
        sku: 'EGG001',
        name: 'Fresh Hen Eggs - Large',
        description: 'Fresh large hen eggs from local farms',
        type: ProductType.EGGS,
        category: 'hen_eggs',
        costPrice: 2.0,
        sellingPrice: 3.5,
        wholesalePrice: 3.0,
        stock: 200,
        unit: 'dozens',
        minimumStock: 50,
        primaryVendorId: feedVendor.id, // Represents collection from farmers
      },
      {
        sku: 'EGG002',
        name: 'Fresh Duck Eggs - Large',
        description: 'Fresh large duck eggs from local farms',
        type: ProductType.EGGS,
        category: 'duck_eggs',
        costPrice: 3.5,
        sellingPrice: 5.0,
        wholesalePrice: 4.5,
        stock: 80,
        unit: 'dozens',
        minimumStock: 20,
        primaryVendorId: feedVendor.id, // Represents collection from farmers
      },
    ];

    // Create all products
    for (const productData of [
      ...feedProducts,
      ...medicineProducts,
      ...equipmentProducts,
      ...eggProducts,
    ]) {
      await prisma.product.create({ data: productData });
    }

    // ================================
    // CUSTOMERS
    // ================================
    console.log('Creating customers...');

    // Farmer Customers
    const farmerCustomers = [
      {
        type: CustomerType.FARMER,
        businessName: 'Happy Hen Farm',
        contactPerson: 'John Farm',
        email: 'john@happyhenfarm.com',
        phone: '+1 (555) 501-5001',
        address: {
          street: '101 Farm Road',
          city: 'Farmville',
          state: 'CA',
          zipCode: '93447',
          country: 'US',
        },
        creditLimit: 15000,
        creditBalance: 0,
        paymentTerms: 30,
        creditStatus: CreditStatus.CURRENT,
        farmSize: 50,
        animalTypes: ['poultry'],
        dailyHenEggs: 120,
        dailyDuckEggs: 30,
        collectionSchedule: 'daily',
        totalPurchases: 0,
        totalEggSales: 0,
        active: true,
      },
      {
        type: CustomerType.FARMER,
        businessName: 'Golden Egg Ranch',
        contactPerson: 'Sarah Poultry',
        email: 'sarah@goldeneggranch.com',
        phone: '+1 (555) 502-5002',
        address: {
          street: '202 Ranch Way',
          city: 'Eggville',
          state: 'CA',
          zipCode: '93448',
          country: 'US',
        },
        creditLimit: 20000,
        creditBalance: 0,
        paymentTerms: 45,
        creditStatus: CreditStatus.CURRENT,
        farmSize: 75,
        animalTypes: ['poultry'],
        dailyHenEggs: 180,
        dailyDuckEggs: 45,
        collectionSchedule: 'daily',
        totalPurchases: 0,
        totalEggSales: 0,
        active: true,
      },
      {
        type: CustomerType.FARMER,
        businessName: 'Sunrise Dairy Farm',
        contactPerson: 'Bob Dairy',
        email: 'bob@sunrisedairy.com',
        phone: '+1 (555) 503-5003',
        creditLimit: 25000,
        creditBalance: 0,
        paymentTerms: 30,
        creditStatus: CreditStatus.CURRENT,
        farmSize: 120,
        animalTypes: ['cattle', 'poultry'],
        dailyHenEggs: 80,
        dailyDuckEggs: 0,
        collectionSchedule: 'alternate',
        totalPurchases: 0,
        totalEggSales: 0,
        active: true,
      },
    ];

    // Regular Customers
    const regularCustomers = [
      {
        type: CustomerType.REGULAR,
        contactPerson: 'Mary Smith',
        email: 'mary@email.com',
        phone: '+1 (555) 601-6001',
        creditLimit: 1000,
        creditBalance: 0,
        paymentTerms: 15,
        creditStatus: CreditStatus.CURRENT,
        isRetail: true,
        loyaltyPoints: 250,
        totalPurchases: 0,
        active: true,
      },
      {
        type: CustomerType.REGULAR,
        contactPerson: 'David Johnson',
        email: 'david@email.com',
        phone: '+1 (555) 602-6002',
        creditLimit: 500,
        creditBalance: 0,
        paymentTerms: 15,
        creditStatus: CreditStatus.CURRENT,
        isRetail: true,
        loyaltyPoints: 150,
        totalPurchases: 0,
        active: true,
      },
    ];

    // Wholesale Customers
    const wholesaleCustomers = [
      {
        type: CustomerType.WHOLESALE,
        businessName: 'City Market',
        contactPerson: 'Alice Wholesale',
        email: 'alice@citymarket.com',
        phone: '+1 (555) 701-7001',
        address: {
          street: '500 Market Street',
          city: 'City Center',
          state: 'CA',
          zipCode: '93449',
          country: 'US',
        },
        creditLimit: 8000,
        creditBalance: 0,
        paymentTerms: 30,
        creditStatus: CreditStatus.CURRENT,
        totalPurchases: 0,
        active: true,
      },
      {
        type: CustomerType.WHOLESALE,
        businessName: 'Restaurant Supply Co.',
        contactPerson: 'Chef Marco',
        email: 'marco@restsupply.com',
        phone: '+1 (555) 702-7002',
        creditLimit: 5000,
        creditBalance: 0,
        paymentTerms: 30,
        creditStatus: CreditStatus.CURRENT,
        totalPurchases: 0,
        active: true,
      },
    ];

    // Create all customers
    const allCustomers = [
      ...farmerCustomers,
      ...regularCustomers,
      ...wholesaleCustomers,
    ];
    const createdCustomers = [];

    for (const customerData of allCustomers) {
      const customer = await prisma.customer.create({ data: customerData });
      createdCustomers.push(customer);
    }

    // ================================
    // COLLECTION ROUTES
    // ================================
    console.log('Creating collection routes...');

    const route1 = await prisma.collectionRoute.create({
      data: {
        name: 'North Valley Route',
        description: 'Northern farms collection route',
        estimatedTime: 180, // 3 hours
        distance: 25.5,
        schedule: 'DAILY',
        staffId: collectorStaff.id,
        active: true,
      },
    });

    const route2 = await prisma.collectionRoute.create({
      data: {
        name: 'South County Route',
        description: 'Southern farms collection route',
        estimatedTime: 240, // 4 hours
        distance: 35.2,
        schedule: 'DAILY',
        staffId: collectorStaff.id,
        active: true,
      },
    });

    // Assign farmers to routes
    const farmers = createdCustomers.filter(
      (c) => c.type === CustomerType.FARMER,
    );

    // Assign first two farmers to route 1
    if (farmers.length >= 2) {
      await prisma.routeCustomer.create({
        data: {
          routeId: route1.id,
          customerId: farmers[0].id,
          sortOrder: 1,
          active: true,
        },
      });

      await prisma.routeCustomer.create({
        data: {
          routeId: route1.id,
          customerId: farmers[1].id,
          sortOrder: 2,
          active: true,
        },
      });
    }

    // Assign third farmer to route 2
    if (farmers.length >= 3) {
      await prisma.routeCustomer.create({
        data: {
          routeId: route2.id,
          customerId: farmers[2].id,
          sortOrder: 1,
          active: true,
        },
      });
    }

    // ================================
    // SAMPLE TRANSACTIONS
    // ================================
    console.log('Creating sample transactions...');

    // Sample transaction 1 - Cash sale to regular customer
    const transaction1 = await prisma.transaction.create({
      data: {
        receiptNumber: 'RCP-2024-001',
        type: 'SALE',
        customerId: createdCustomers.find(
          (c) => c.type === CustomerType.REGULAR,
        )?.id,
        staffId: cashierStaff.id,
        subtotal: 50.0,
        tax: 4.0,
        discount: 0,
        total: 54.0,
        paymentMethod: PaymentMethod.CASH,
        paidAmount: 54.0,
        balanceAmount: 0,
        status: 'COMPLETED',
        notes: 'Sample cash transaction',
        synced: true,
      },
    });

    // Add items to transaction 1
    await prisma.transactionItem.create({
      data: {
        transactionId: transaction1.id,
        productId: (await prisma.product.findUnique({
          where: { sku: 'FEED001' },
        }))!.id,
        productName: 'Premium Poultry Layer Feed',
        sku: 'FEED001',
        quantity: 1,
        unit: 'bags',
        unitPrice: 35.0,
        total: 35.0,
      },
    });

    await prisma.transactionItem.create({
      data: {
        transactionId: transaction1.id,
        productId: (await prisma.product.findUnique({
          where: { sku: 'MED002' },
        }))!.id,
        productName: 'Vitamin Supplement',
        sku: 'MED002',
        quantity: 1,
        unit: 'bottles',
        unitPrice: 15.0,
        total: 15.0,
      },
    });

    // Sample transaction 2 - Credit sale to farmer
    const farmerCustomer = createdCustomers.find(
      (c) => c.type === CustomerType.FARMER,
    );
    if (farmerCustomer) {
      const transaction2 = await prisma.transaction.create({
        data: {
          receiptNumber: 'RCP-2024-002',
          type: 'SALE',
          customerId: farmerCustomer.id,
          staffId: managerStaff.id,
          subtotal: 160.0,
          tax: 12.8,
          discount: 0,
          total: 172.8,
          paymentMethod: PaymentMethod.CREDIT,
          paidAmount: 0,
          balanceAmount: 172.8,
          status: 'COMPLETED',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: 'Credit sale to farmer',
          synced: true,
        },
      });

      // Add items to transaction 2
      await prisma.transactionItem.create({
        data: {
          transactionId: transaction2.id,
          productId: (await prisma.product.findUnique({
            where: { sku: 'FEED001' },
          }))!.id,
          productName: 'Premium Poultry Layer Feed',
          sku: 'FEED001',
          quantity: 5,
          unit: 'bags',
          unitPrice: 32.0, // Wholesale price
          total: 160.0,
        },
      });

      // Update farmer's credit balance
      await prisma.customer.update({
        where: { id: farmerCustomer.id },
        data: {
          creditBalance: 172.8,
          totalPurchases: 172.8,
        },
      });
    }

    // ================================
    // SAMPLE EGG COLLECTIONS
    // ================================
    console.log('Creating sample egg collections...');

    const henEggProduct = await prisma.product.findUnique({
      where: { sku: 'EGG001' },
    });
    const duckEggProduct = await prisma.product.findUnique({
      where: { sku: 'EGG002' },
    });

    if (farmers.length > 0 && henEggProduct && duckEggProduct) {
      const collection1 = await prisma.eggCollection.create({
        data: {
          farmerId: farmers[0].id,
          routeId: route1.id,
          staffId: collectorStaff.id,
          collectionDate: new Date(),
          henEggsSmall: 24,
          henEggsMedium: 48,
          henEggsLarge: 36,
          henEggsXL: 12,
          henEggsDamaged: 6,
          duckEggsSmall: 12,
          duckEggsMedium: 18,
          duckEggsLarge: 6,
          duckEggsDamaged: 2,
          henEggPrice: 2.5,
          duckEggPrice: 4.0,
          totalHenEggs: 120,
          totalDuckEggs: 36,
          totalValue: 37.0, // (120/12 * 2.50) + (36/12 * 4.00) = 25.00 + 12.00
          qualityScore: 4.2,
          qualityNotes: 'Good quality, minimal damage',
          paid: false,
          synced: true,
        },
      });

      // Update egg inventory
      await prisma.product.update({
        where: { id: henEggProduct.id },
        data: { stock: henEggProduct.stock + 10 }, // 120 eggs = 10 dozens
      });

      await prisma.product.update({
        where: { id: duckEggProduct.id },
        data: { stock: duckEggProduct.stock + 3 }, // 36 eggs = 3 dozens
      });
    }

    console.log('✅ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Store configuration: 1`);
    console.log(`- System settings: ${settings.length}`);
    console.log(`- Staff members: 4`);
    console.log(`- Vendors: 3`);
    console.log(
      `- Products: ${feedProducts.length + medicineProducts.length + equipmentProducts.length + eggProducts.length}`,
    );
    console.log(`- Customers: ${allCustomers.length}`);
    console.log(`- Collection routes: 2`);
    console.log(`- Sample transactions: 2`);
    console.log(`- Sample egg collections: 1`);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
