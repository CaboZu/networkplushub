import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'src', 'App.jsx')
const outputPath = path.join(root, 'src', 'App.refreshed.jsx')

function replaceOnce(source, from, to, label) {
  const first = source.indexOf(from)
  if (first === -1) throw new Error(`Curriculum refresh anchor missing: ${label}`)
  if (source.indexOf(from, first + from.length) !== -1) {
    throw new Error(`Curriculum refresh anchor is not unique: ${label}`)
  }
  return source.slice(0, first) + to + source.slice(first + from.length)
}

function appendLessonContent(source, lessonId, addition) {
  const lessonAnchor = `id:"${lessonId}"`
  const lessonIndex = source.indexOf(lessonAnchor)
  if (lessonIndex === -1) throw new Error(`Lesson not found: ${lessonId}`)
  if (source.indexOf(lessonAnchor, lessonIndex + lessonAnchor.length) !== -1) {
    throw new Error(`Lesson id is not unique: ${lessonId}`)
  }

  const contentStart = source.indexOf('content:`', lessonIndex)
  if (contentStart === -1) throw new Error(`Lesson has no content template: ${lessonId}`)

  const nextLesson = source.indexOf('\n      {\n        id:"', lessonIndex + lessonAnchor.length)
  const searchEnd = nextLesson === -1 ? source.length : nextLesson

  const practiceClose = source.indexOf('`,\n        practiceQuestions:', contentStart)
  const simpleClose = source.indexOf('`\n      }', contentStart)
  const candidates = [practiceClose, simpleClose].filter(i => i !== -1 && i < searchEnd)
  if (candidates.length === 0) throw new Error(`Could not locate content end for lesson: ${lessonId}`)

  const closeIndex = Math.min(...candidates)
  return source.slice(0, closeIndex) + `\n\n${addition}` + source.slice(closeIndex)
}

export function refreshSource(original) {
  let source = original

  // Technical precision corrections. Keep the exam mental model while avoiding false absolutes.
  source = replaceOnce(
    source,
    '| 3 | **Network** | Packet | IP, ICMP, ARP, Routers | Logical addressing, routing |\n| 2 | **Data Link** | Frame | Ethernet, Switches | Physical addressing, frames |',
    '| 3 | **Network** | Packet | IP, ICMP, Routers | Logical addressing, routing |\n| 2 | **Data Link** | Frame | Ethernet, ARP*, Switches | Physical addressing, frames |\n\n*ARP resolves an IPv4 address to a Layer 2 MAC address. It sits at the Layer 2/Layer 3 boundary and is often described as Layer 2 or “Layer 2.5,” rather than cleanly belonging to Layer 3.*',
    'ARP OSI mapping'
  )

  source = replaceOnce(
    source,
    '- "TLS operates at?" → **Layer 6** (Presentation)\n- "Adds port numbers?" → **Layer 4** (Transport)\n- "ARP operates at?" → **Layer 3** (Network)',
    '- "Where does TLS map in the OSI study model?" → **Commonly Layer 6 (Presentation)** because it provides encryption/representation functions, but real TCP/IP stacks do not map TLS perfectly to one OSI layer.\n- "Adds port numbers?" → **Layer 4** (Transport)\n- "Where does ARP fit?" → **Layer 2 / Layer 2.5 boundary** — it maps Layer 3 IPv4 addresses to Layer 2 MAC addresses.',
    'OSI exam traps'
  )

  source = replaceOnce(
    source,
    'Layer 6 (Presentation) handles formatting, encryption, and compression. SSL/TLS lives here. Layer 7 is the user-facing application service layer — it uses Layer 6 for encryption but doesn\'t perform it.',
    'Layer 6 (Presentation) is the OSI layer associated with formatting, encryption, and compression. For certification study, TLS is commonly mapped here because it performs encryption/representation functions; in real TCP/IP implementations TLS does not fit perfectly into a single OSI layer.',
    'TLS explanation'
  )

  source = replaceOnce(
    source,
    '- Acknowledgment — receiver ACKs every segment',
    '- Acknowledgment — receiver confirms received sequence data; TCP acknowledgments can be cumulative and are not necessarily one ACK per segment',
    'TCP acknowledgment wording'
  )

  source = replaceOnce(
    source,
    '| Reliability | Guaranteed delivery | Best-effort |',
    '| Reliability | Reliable, acknowledged delivery with retransmission while the connection is viable | Best-effort |',
    'TCP reliability wording'
  )

  source = replaceOnce(
    source,
    'ICMP is at Layer 3. Used for **diagnostics only** — NOT data transfer.',
    'ICMP is a Layer 3 control and error-reporting protocol. Tools such as ping and traceroute use it for diagnostics; it is not an application-data transport like TCP or UDP.',
    'ICMP role wording'
  )

  source = replaceOnce(
    source,
    'DNS translates hostnames to IP addresses. UDP for queries, TCP for zone transfers.',
    'DNS translates hostnames to IP addresses. Most ordinary queries begin over UDP; TCP is used for zone transfers and can also be used when a response is too large/truncated or when the resolver/server chooses TCP.',
    'DNS transport wording'
  )

  source = replaceOnce(
    source,
    'POP3 vs IMAP: which stays on the server?", a:"IMAP (143) stays on server and syncs. POP3 (110) downloads and deletes.',
    'POP3 vs IMAP: which is designed for server-side sync?", a:"IMAP (143) keeps the mailbox on the server and synchronizes state across clients. POP3 (110) primarily downloads messages for local storage and may be configured to leave copies on the server.',
    'POP3 flashcard wording'
  )

  source = replaceOnce(
    source,
    'Syslog use?", a:"Port 514 UDP',
    'Syslog use?", a:"Port 514 is the Network+ exam port. Traditional syslog commonly uses UDP 514, but TCP 514 is also used; TLS-secured syslog commonly uses 6514.',
    'Syslog flashcard wording'
  )

  source = replaceOnce(
    source,
    'RPO=30 min means backups must run at least every 30 minutes.',
    'RPO=30 min means the organization must be able to restore to a recovery point no more than 30 minutes old; backups, replication, snapshots, or log shipping can satisfy that objective.',
    'RPO wording'
  )

  // Objective 1.3 and 1.8: cloud, virtualization, and modern networking.
  source = appendLessonContent(source, 'cloud', `### N10-009 Cloud & Virtual Networking Addendum

**NFV (Network Functions Virtualization):** Runs network functions such as routers, firewalls, load balancers, and WAN appliances as software instead of requiring a dedicated physical appliance. NFV is about virtualizing the function; SDN is about programmable control of forwarding behavior.

**VPC (Virtual Private Cloud):** A logically isolated network inside a public cloud. You define subnets, routes, gateways, and security policy while the provider owns the physical infrastructure.

**Cloud traffic controls:**
- **Security group** — stateful policy commonly attached to an instance/interface or workload.
- **Network ACL / security list** — subnet/network-level policy; implementations may be stateless depending on provider.
- **Internet gateway** — provides a path between eligible VPC resources and the public internet.
- **NAT gateway** — lets private-addressed workloads initiate outbound access without accepting unsolicited inbound internet connections.
- **VPN vs. dedicated connection** — VPN uses encrypted tunnels over a shared network; services such as Direct Connect/ExpressRoute provide dedicated private connectivity.

**Scalability vs. elasticity:** Scalability is the ability to add capacity as demand grows. Elasticity is the ability to add and remove capacity dynamically as demand changes.

**Multitenancy:** Multiple customers share provider infrastructure while logical controls isolate their workloads and data.

**Modern IPv6 compatibility:** Organizations may use tunneling, **dual stack** (IPv4 and IPv6 together), or **NAT64** (IPv6 clients reaching IPv4 services through translation) during migration.`)

  // Objective 1.4: GRE/IPsec and traffic types.
  source = appendLessonContent(source, 'tcp', `### GRE, IPsec & Traffic Types — N10-009

**GRE (Generic Routing Encapsulation):** A tunneling protocol that can carry many Layer 3 protocol types inside IP. GRE provides encapsulation, not confidentiality by itself, so GRE is often paired with IPsec when encryption is required.

**IPsec:** A suite for protecting IP traffic.
- **AH (Authentication Header):** integrity/authentication for the packet; does not provide payload encryption.
- **ESP (Encapsulating Security Payload):** provides encryption and can also provide integrity/authentication.
- **IKE (Internet Key Exchange):** negotiates security associations and cryptographic keys for IPsec peers.

**Traffic types:**
- **Unicast** — one sender to one destination.
- **Broadcast** — one sender to all hosts in a local broadcast domain (IPv4 concept; IPv6 does not use broadcast).
- **Multicast** — one sender to a subscribed group.
- **Anycast** — the same destination address is announced from multiple locations; routing delivers the client to a nearby/best instance.`)

  // Objective 1.7 / 1.8: VLSM and IPv6 migration.
  source = appendLessonContent(source, 'ipv4', `### VLSM — Variable Length Subnet Mask
VLSM uses different prefix lengths inside the same addressing plan so each subnet receives a size appropriate to its host requirement. This conserves address space compared with giving every subnet the same mask.

**Example:** A /24 could be divided into a /25 for a large LAN, /27s for smaller LANs, and /30 or /31 point-to-point links when supported. Allocate the largest requirements first to avoid overlap.

### IPv6 Transition Concepts
- **Dual stack:** A host/network runs IPv4 and IPv6 at the same time.
- **Tunneling:** Carries one protocol through another network during transition.
- **NAT64:** Translates between IPv6 clients and IPv4 services. It is a compatibility mechanism, not ordinary IPv4 PAT.

**Exam distinction:** IPv4 subnetting/VLSM remains a core skill even as IPv6 reduces dependence on address conservation.`)

  // Objective 2.1: first-hop redundancy, VIP, and subinterfaces.
  source = appendLessonContent(source, 'routing', `### FHRP, VIPs & Subinterfaces — N10-009

**FHRP (First Hop Redundancy Protocol):** Lets multiple routers provide a resilient default-gateway service. Hosts use a **virtual IP (VIP)** as their gateway while the participating routers coordinate which device actively forwards traffic. Examples in the industry include HSRP, VRRP, and GLBP; Network+ focuses on the purpose more than vendor command syntax.

**Subinterface:** A logical interface created under one physical router interface. Subinterfaces are commonly associated with VLAN tags so one physical link can provide Layer 3 gateways for multiple VLANs (router-on-a-stick).

**Failure thinking:** If the physical router interface is up but one VLAN gateway fails, check the VLAN tag/subinterface configuration before assuming the entire link is down.`)

  // Objective 2.2: MTU and jumbo frames.
  source = appendLessonContent(source, 'vlans', `### MTU & Jumbo Frames — N10-009

**MTU (Maximum Transmission Unit):** The largest Layer 3 packet payload that a link can carry without fragmentation at that layer. Standard Ethernet commonly uses a 1500-byte IP MTU.

**Jumbo frames:** Ethernet frames with payloads larger than the standard size (often around 9000 bytes, depending on vendor). Every device along the path must support a compatible size. An MTU mismatch can cause fragmentation, drops, or “works for small packets but fails for large packets” symptoms.

**Troubleshooting clue:** If pings with small payloads succeed but large packets or VPN/application transfers fail, investigate path MTU and encapsulation overhead.`)

  // Objective 2.3: wireless identifiers, regulatory behavior, and AP architectures.
  source = appendLessonContent(source, 'wireless', `### Wireless Details Added for N10-009

**SSID / BSSID / ESSID:**
- **SSID** is the human-readable wireless network name.
- **BSSID** identifies a specific basic service set/AP radio, typically using a MAC address.
- **ESSID** is the network name used across an extended service set where multiple APs provide the same logical WLAN for roaming.

**Autonomous vs. lightweight APs:** An autonomous AP contains its own control/configuration logic. A lightweight AP relies heavily on a centralized wireless LAN controller for policy, management, and often control-plane functions.

**802.11h regulatory impact:** Adds mechanisms such as dynamic frequency selection (DFS) and transmit-power control in applicable 5 GHz environments to reduce interference with radar and comply with regional rules.

**Exam mindset:** Channel width, non-overlapping channels, regulatory constraints, band steering, antenna choice, authentication mode, and AP architecture all affect a wireless design — not just signal strength.`)

  // Objective 3.x: operations, documentation, lifecycle, facilities, and recovery exercises.
  source = appendLessonContent(source, 'monitoring', `### Operations Documentation & Lifecycle — N10-009

**MDF vs. IDF:** The **MDF (Main Distribution Frame)** is the primary building distribution point, often where carrier/service entrance and core connectivity terminate. An **IDF (Intermediate Distribution Frame)** serves a floor or area and uplinks back toward the MDF/core.

**IPAM (IP Address Management):** Tracks address allocations, subnets, reservations, and often DNS/DHCP relationships. IPAM reduces duplicate-address mistakes and makes growth/change planning auditable.

**Lifecycle:**
- **EOL (End of Life):** Product is retired from the vendor portfolio/lifecycle.
- **EOS (End of Support):** Vendor support/patching ends. Keeping unsupported network devices in production increases operational and security risk.

**Physical operations:** Capacity planning includes rack space, power load, cooling/airflow, UPS/runtime, and environmental monitoring — not just CPU and bandwidth dashboards.`)

  source = appendLessonContent(source, 'hadr', `### HA Modes & Recovery Exercises — N10-009

**Active-active:** Multiple nodes actively serve production traffic. It improves utilization and can provide fast failover, but state synchronization and load distribution are more complex.

**Active-passive:** One node serves traffic while a standby waits to take over. It is simpler to reason about but leaves some capacity idle during normal operation.

**Tabletop exercise:** A discussion-based disaster-recovery/security exercise where participants walk through a scenario, decisions, communications, dependencies, and escalation paths without causing a real outage. It validates the plan before an actual incident.

**Failover vs. recovery:** High availability keeps a service running through component failure; disaster recovery restores service after a larger disruption. RTO and RPO measure different business limits and should drive architecture decisions.`)

  return source
}

export function generateRefreshedApp() {
  const original = fs.readFileSync(sourcePath, 'utf8')
  const refreshed = refreshSource(original)
  fs.writeFileSync(outputPath, refreshed)
  return { sourcePath, outputPath, bytes: Buffer.byteLength(refreshed) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = generateRefreshedApp()
  console.log(`Generated ${path.relative(root, result.outputPath)} (${result.bytes} bytes)`)
}
