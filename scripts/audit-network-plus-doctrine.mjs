import fs from 'node:fs';

const appPath = new URL('../src/App.jsx', import.meta.url);
const source = fs.readFileSync(appPath, 'utf8');

const checks = [
  {
    id: 'arp-osi',
    severity: 'error',
    description: 'Avoid teaching ARP as cleanly Layer 3; describe it as bridging IPv4 Layer 3 addressing to Layer 2 MAC addressing.',
    badPatterns: [/ARP operates at\?"?\s*→\s*\*\*Layer 3/i, /ARP, Routers \| Logical addressing, routing/i],
  },
  {
    id: 'tls-osi',
    severity: 'warning',
    description: 'Avoid presenting TLS as literally and exclusively OSI Layer 6; note that Layer 6 is a certification-model association rather than a clean TCP\/IP layer mapping.',
    badPatterns: [/TLS operates at\?"?\s*→\s*\*\*Layer 6/i, /SSL\/TLS, JPEG, ASCII \| Format, encrypt, compress/i],
  },
  {
    id: 'tcp-guarantee',
    severity: 'warning',
    description: 'Describe TCP as reliable, acknowledged delivery with retransmission rather than absolute guaranteed delivery.',
    badPatterns: [/\| Reliability \| Guaranteed delivery \|/i],
  },
  {
    id: 'pop3-delete',
    severity: 'warning',
    description: 'POP3 may delete server copies, but deletion is client-configurable. IMAP is the protocol designed for server-side synchronization.',
    badPatterns: [/POP3 \(110\) downloads and deletes/i],
  },
];

const coverageTerms = {
  '1.3 cloud': ['NFV', 'VPC', 'network security groups', 'cloud gateway', 'multitenancy'],
  '1.4 protocols': ['GRE', 'AH', 'ESP', 'IKE', 'anycast'],
  '1.5 media': ['twinax', 'Fibre Channel', 'MPO'],
  '1.6 architecture': ['spine', 'collapsed core', 'north-south', 'east-west'],
  '1.7 addressing': ['VLSM'],
  '1.8 modern networking': ['NAT64', 'dual stack', 'SSE'],
  '2.1 routing': ['FHRP', 'VIP', 'subinterface'],
  '2.2 switching': ['MTU', 'jumbo frame', 'SVI', 'voice VLAN'],
  '2.3 wireless': ['802.11h', 'BSSID', 'ESSID', 'lightweight access point'],
  '2.4 physical installs': ['IDF', 'MDF', 'power load', 'port-side exhaust'],
  '3.1 operations': ['IPAM', 'EOL', 'EOS', 'heat map', 'golden configuration'],
  '3.2 monitoring': ['API integration', 'port mirroring', 'network discovery'],
  '3.3 disaster recovery': ['active-active', 'active-passive', 'tabletop'],
};

let errors = 0;
console.log('N10-009 doctrine audit');
console.log('=======================');

for (const check of checks) {
  const hits = check.badPatterns.filter((pattern) => pattern.test(source));
  if (hits.length) {
    console.log(`[${check.severity.toUpperCase()}] ${check.id}: ${check.description}`);
    if (check.severity === 'error') errors += 1;
  } else {
    console.log(`[PASS] ${check.id}`);
  }
}

console.log('\nCoverage keyword probe');
console.log('----------------------');
for (const [objective, terms] of Object.entries(coverageTerms)) {
  const missing = terms.filter((term) => !source.toLowerCase().includes(term.toLowerCase()));
  if (missing.length) {
    console.log(`[REVIEW] ${objective}: missing or not obviously covered -> ${missing.join(', ')}`);
  } else {
    console.log(`[PASS] ${objective}: probe terms found`);
  }
}

if (process.argv.includes('--strict') && errors > 0) {
  process.exitCode = 1;
}
