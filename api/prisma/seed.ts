import { PrismaClient } from "../generated/prisma";
import { faker } from "@faker-js/faker";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Create Default User
  const email = "user@example.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Clean existing users if any (though reset already cleared the DB, this is safe)
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  console.log(`Created default user: ${email} (Password: ${password})`);

  // 2. Create Accounts
  const accountData = [
    {
      name: "Conto Corrente",
      type: "checking",
      currency: "EUR",
      initialBalance: 2500,
    },
    {
      name: "Conto Deposito Risparmio",
      type: "saving",
      currency: "EUR",
      initialBalance: 10000,
    },
    {
      name: "Portafoglio Investimenti",
      type: "investment",
      currency: "EUR",
      initialBalance: 15000,
    },
  ];

  const accounts: any[] = [];
  for (const acc of accountData) {
    const account = await prisma.account.create({
      data: {
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        balance: acc.initialBalance, // We will update this later after summing transactions
        userId: user.id,
      },
    });
    accounts.push({ ...account, initialBalance: acc.initialBalance });
    console.log(`Created account: ${account.name}`);
  }

  // 3. Generate Transactions for the last 12 months
  const now = new Date();
  const startDate = new Date();
  startDate.setFullYear(now.getFullYear() - 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Group transactions by account to calculate balances and closures
  const transactionsToCreate: {
    accountId: number;
    amount: number;
    date: Date;
    note: string;
  }[] = [];

  for (const account of accounts) {
    let runningBalance = account.initialBalance;

    // We loop month by month
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11

      // Transactions list for this month
      const monthlyTransactions: { amount: number; date: Date; note: string }[] = [];

      if (account.type === "checking") {
        // Salary on the 27th
        monthlyTransactions.push({
          amount: 2200.0,
          date: new Date(year, month, 27, 10, 0),
          note: "Stipendio mensile",
        });

        // Rent on the 1st
        monthlyTransactions.push({
          amount: -750.0,
          date: new Date(year, month, 1, 9, 0),
          note: "Affitto casa",
        });

        // Transfer to savings on the 28th
        monthlyTransactions.push({
          amount: -400.0,
          date: new Date(year, month, 28, 11, 0),
          note: "Giroconto risparmi",
        });

        // ETF purchase on the 15th
        monthlyTransactions.push({
          amount: -300.0,
          date: new Date(year, month, 15, 14, 0),
          note: "PAC Investimenti ETF",
        });

        // 4 Groceries (one per week)
        for (let week = 1; week <= 4; week++) {
          const day = week * 7 - faker.number.int({ min: 1, max: 3 });
          monthlyTransactions.push({
            amount: -faker.number.float({ min: 45, max: 110, fractionDigits: 2 }),
            date: new Date(year, month, day, 18, 30),
            note: `Spesa supermercato ${faker.helpers.arrayElement(["Esselunga", "Coop", "Conad", "Lidl"])}`,
          });
        }

        // Bills (Bollette) every 2 months
        if (month % 2 === 0) {
          monthlyTransactions.push({
            amount: -faker.number.float({ min: 60, max: 140, fractionDigits: 2 }),
            date: new Date(year, month, faker.number.int({ min: 5, max: 10 }), 10, 0),
            note: `Bolletta ${faker.helpers.arrayElement(["Luce", "Gas", "Internet WiFi"])}`,
          });
        }

        // Restaurant & leisure (4-8 times a month)
        const leisureCount = faker.number.int({ min: 4, max: 8 });
        for (let i = 0; i < leisureCount; i++) {
          monthlyTransactions.push({
            amount: -faker.number.float({ min: 15, max: 70, fractionDigits: 2 }),
            date: new Date(year, month, faker.number.int({ min: 2, max: 28 }), 21, 0),
            note: faker.helpers.arrayElement([
              "Cena ristorante",
              "Cinema e svago",
              "Aperitivo amici",
              "Acquisto Amazon",
              "Rifornimento Carburante",
            ]),
          });
        }
      } else if (account.type === "saving") {
        // Receives 400 from checking on the 28th
        monthlyTransactions.push({
          amount: 400.0,
          date: new Date(year, month, 28, 11, 5),
          note: "Giroconto da Conto Corrente",
        });

        // Small monthly interest
        monthlyTransactions.push({
          amount: faker.number.float({ min: 2, max: 8, fractionDigits: 2 }),
          date: new Date(year, month, 30, 23, 59),
          note: "Interessi maturati",
        });
      } else if (account.type === "investment") {
        // Receives 300 from checking on the 15th
        monthlyTransactions.push({
          amount: 300.0,
          date: new Date(year, month, 15, 14, 5),
          note: "Deposito PAC ETF",
        });

        // Market fluctuation (-2% to +4%)
        const fluctuation = runningBalance * faker.number.float({ min: -0.02, max: 0.04, fractionDigits: 4 });
        if (Math.abs(fluctuation) > 10) {
          monthlyTransactions.push({
            amount: parseFloat(fluctuation.toFixed(2)),
            date: new Date(year, month, 28, 17, 30),
            note: fluctuation >= 0 ? "Rendimento portafoglio" : "Variazione mercato",
          });
        }
      }

      // Add to main transactions array and calculate balance
      for (const t of monthlyTransactions) {
        // Only add transactions if the date is in the past or today
        if (t.date <= now) {
          transactionsToCreate.push({
            accountId: account.id,
            amount: t.amount,
            date: t.date,
            note: t.note,
          });
          runningBalance += t.amount;
        }
      }

      // 4. Create Closure for this month (1-indexed month)
      // Closures are recorded as the total balance at the end of the month
      if (currentDate <= now) {
        await prisma.closure.create({
          data: {
            year,
            month: month + 1,
            amount: parseFloat(runningBalance.toFixed(2)),
            accountId: account.id,
            note: `Chiusura automatica ${month + 1}/${year}`,
          },
        });
      }

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 5. Update Account final balance in database
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: parseFloat(runningBalance.toFixed(2)) },
    });
    console.log(`Updated final balance for ${account.name} to €${runningBalance.toFixed(2)}`);
  }

  // Bulk create all transactions
  console.log(`Inserting ${transactionsToCreate.length} transactions...`);
  await prisma.transaction.createMany({
    data: transactionsToCreate,
  });

  console.log("Seeding completed successfully! 🎉");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
