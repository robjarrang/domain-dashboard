import { PrismaClient } from '@prisma/client';
import { checkDKIM, checkSPF, checkDMARC } from '../utils/dns.js';

const prisma = new PrismaClient();

async function updateDomainRecords() {
  try {
    const domains = await prisma.domain.findMany();
    
    for (const domain of domains) {
      const [dkimResult, spfResult, dmarcResult] = await Promise.all([
        checkDKIM(domain.name, domain.dkimSelector),
        checkSPF(domain.name),
        checkDMARC(domain.name),
      ]);

      await prisma.domain.update({
        where: { id: domain.id },
        data: {
          dkim: dkimResult.details ? `${dkimResult.value} (${dkimResult.details})` : dkimResult.value,
          spf: spfResult.details ? `${spfResult.value} (${spfResult.details})` : spfResult.value,
          dmarc: dmarcResult.details ? `${dmarcResult.value} (${dmarcResult.details})` : dmarcResult.value,
          lastChecked: new Date(),
        },
      });
      
      console.log(`Updated records for ${domain.name}`);
    }
    console.log('DNS records updated successfully');
  } catch (error) {
    console.error('Error updating DNS records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update every 15 minutes
const INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
setInterval(updateDomainRecords, INTERVAL);
updateDomainRecords(); // Run once immediately
console.log('DNS record update service started');