import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialDomains = [
  { name: "bowood.org", dkimSelector: "jarrang" },
  { name: "thecornishhamperstore.co.uk", dkimSelector: "jarrang" },
  { name: "dashvansales.co.uk", dkimSelector: "jarrang" },
  { name: "dashexpress.co.uk", dkimSelector: "jarrang" },
  { name: "email.dege-skinner.co.uk", dkimSelector: "jarrang" },
  { name: "edenhotelcollection.com", dkimSelector: "jarrang" },
  { name: "exclusive.co.uk", dkimSelector: "jarrang" },
  { name: "islesofscilly-travel.co.uk", dkimSelector: "jarrang" },
  { name: "keycurrency.co.uk", dkimSelector: "jarrang" },
  { name: "lucknampark.co.uk", dkimSelector: "jarrang" },
  { name: "networkcollective.co.uk", dkimSelector: "jarrang" },
  { name: "parkkenmare.com", dkimSelector: "jarrang" },
  { name: "scillyflowers.co.uk", dkimSelector: "jarrang" },
  { name: "travelsmith.co.uk", dkimSelector: "jarrang" },
  { name: "trelowarren.com", dkimSelector: "jarrang" },
  { name: "trewithendairy.co.uk", dkimSelector: "jarrang" },
  { name: "wildcard.co.uk", dkimSelector: "jarrang" },
  { name: "adventureline.co.uk", dkimSelector: "jarrang" },
  { name: "belgravegallery.com", dkimSelector: "jarrang" },
  { name: "macmillan.org.uk", dkimSelector: "jarrang" },
  { name: "cornwallchristmasfair.com", dkimSelector: "jarrang" },
  { name: "flowersbyclowance.co.uk", dkimSelector: "jarrang" },
  { name: "harlandaccountants.co.uk", dkimSelector: "jarrang" },
  { name: "icetrikes.co", dkimSelector: "jarrang" },
  { name: "newlynartschool.co.uk", dkimSelector: "jarrang" },
  { name: "wwfp.net", dkimSelector: "jarrang" }
];

async function main() {
  console.log('Start seeding...');
  
  // Clean existing data
  await prisma.domain.deleteMany();
  
  for (const domain of initialDomains) {
    const result = await prisma.domain.create({
      data: domain,
    });
    console.log(`Created domain: ${result.name}`);
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });