import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { refreshSource } from './generate-refreshed-app.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const original = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8')
const refreshed = refreshSource(original)

const required = [
  ['ARP boundary', 'Layer 2 / Layer 2.5 boundary'],
  ['TLS nuance', 'does not fit perfectly into a single OSI layer'],
  ['TCP reliability', 'Reliable, acknowledged delivery with retransmission while the connection is viable'],
  ['DNS TCP nuance', 'response is too large/truncated'],
  ['POP3 nuance', 'may be configured to leave copies on the server'],
  ['NFV', 'Network Functions Virtualization'],
  ['VPC', 'Virtual Private Cloud'],
  ['security groups', 'Security group'],
  ['network ACLs', 'Network ACL / security list'],
  ['cloud gateways', 'NAT gateway'],
  ['scalability', 'Scalability vs. elasticity'],
  ['multitenancy', 'Multitenancy'],
  ['GRE', 'Generic Routing Encapsulation'],
  ['IPsec AH', 'Authentication Header'],
  ['IPsec ESP', 'Encapsulating Security Payload'],
  ['IKE', 'Internet Key Exchange'],
  ['anycast', 'Anycast'],
  ['VLSM', 'Variable Length Subnet Mask'],
  ['dual stack', 'Dual stack'],
  ['NAT64', 'NAT64'],
  ['FHRP', 'First Hop Redundancy Protocol'],
  ['VIP', 'virtual IP (VIP)'],
  ['subinterfaces', 'Subinterface'],
  ['MTU', 'Maximum Transmission Unit'],
  ['jumbo frames', 'Jumbo frames'],
  ['ESSID', 'ESSID'],
  ['802.11h', '802.11h'],
  ['lightweight AP', 'lightweight AP'],
  ['MDF', 'Main Distribution Frame'],
  ['IDF', 'Intermediate Distribution Frame'],
  ['IPAM', 'IP Address Management'],
  ['EOL', 'End of Life'],
  ['EOS', 'End of Support'],
  ['active-active', 'Active-active'],
  ['active-passive', 'Active-passive'],
  ['tabletop', 'Tabletop exercise'],
]

const forbidden = [
  ['ARP as clean Layer 3 trap', '"ARP operates at?" → **Layer 3** (Network)'],
  ['TCP guaranteed delivery table', '| Reliability | Guaranteed delivery | Best-effort |'],
  ['ICMP diagnostics-only absolute', 'Used for **diagnostics only** — NOT data transfer.'],
  ['DNS UDP/TCP absolute', 'UDP for queries, TCP for zone transfers.'],
  ['POP3 always deletes', 'POP3 (110) downloads and deletes.'],
  ['RPO means backup schedule', 'backups must run at least every 30 minutes.'],
]

let failures = 0
for (const [label, needle] of required) {
  if (!refreshed.includes(needle)) {
    console.error(`FAIL required curriculum missing: ${label} -> ${needle}`)
    failures++
  }
}

for (const [label, needle] of forbidden) {
  if (refreshed.includes(needle)) {
    console.error(`FAIL stale doctrine remains: ${label} -> ${needle}`)
    failures++
  }
}

if (refreshed === original) {
  console.error('FAIL refresh produced no changes')
  failures++
}

if (failures > 0) {
  console.error(`Curriculum refresh regression test failed with ${failures} issue(s).`)
  process.exit(1)
}

console.log(`PASS curriculum refresh: ${required.length} required concepts present; ${forbidden.length} stale patterns absent.`)
