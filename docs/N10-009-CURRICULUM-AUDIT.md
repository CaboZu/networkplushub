# N10-009 Curriculum Audit

Audit date: 2026-09-07

Authoritative baseline: CompTIA Network+ N10-009 Exam Objectives, Version 4.0.

Official objectives: https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-network-n10-009-exam-objectives-%284-0%29-%281%29.pdf

## Current exam blueprint

| Domain | Weight |
|---|---:|
| 1.0 Networking Concepts | 23% |
| 2.0 Network Implementation | 20% |
| 3.0 Network Operations | 19% |
| 4.0 Network Security | 14% |
| 5.0 Network Troubleshooting | 24% |

The app is correctly targeting N10-009 and already contains strong material for OSI, TCP/UDP, ports, IPv4/subnetting, DNS/DHCP/NAT, SDN/SD-WAN, zero trust, SASE, VXLAN, IaC, operations, security, and troubleshooting. This audit focuses on precision and objective completeness rather than rebuilding the course.

## Priority 0: doctrine corrections

These should be corrected before calling the curriculum exam-ready.

1. **ARP and the OSI model**
   - Current wording treats ARP as a clean Layer 3 protocol.
   - Better teaching: ARP resolves an IPv4 Layer 3 address to a Layer 2 MAC address and does not map neatly to a single OSI layer. For beginner certification instruction, describe it as a Layer 2/Layer 3 boundary function rather than simply Layer 3.

2. **TLS and OSI Layer 6**
   - Current wording presents TLS as literally Layer 6.
   - Better teaching: encryption/representation are Layer 6 functions in the OSI model, and TLS is commonly associated with that layer for certification teaching, but TLS does not map cleanly to one layer in the practical TCP/IP stack.

3. **TCP reliability**
   - Replace absolute language such as "guaranteed delivery" with "reliable, acknowledged, ordered delivery with retransmission while the connection remains viable."

4. **POP3 behavior**
   - Replace "downloads and deletes" with wording that makes deletion client-configurable. IMAP is the protocol specifically designed for server-side synchronization across devices.

## Domain 1: Networking Concepts

### 1.1 OSI reference model
Status: **Strong, precision correction required**.

Action:
- Fix ARP placement language.
- Qualify TLS/Layer 6 mapping.
- Keep PDU and device mapping material.

### 1.2 Appliances, applications, and functions
Status: **Likely strong, verify complete coverage**.

Explicitly confirm coverage of:
- router
- switch
- firewall
- IDS/IPS
- load balancer
- proxy
- NAS
- SAN
- AP/controller
- CDN
- VPN
- QoS
- TTL

### 1.3 Cloud concepts and connectivity
Status: **Partial-to-strong; expand objective-specific items**.

Add or strengthen:
- Network Functions Virtualization (NFV)
- Virtual Private Cloud (VPC)
- network security groups
- network security lists
- internet gateway vs NAT gateway
- cloud VPN vs dedicated/direct connectivity
- scalability vs elasticity
- multitenancy

### 1.4 Ports, protocols, services, and traffic types
Status: **Strong ports foundation; verify protocol completeness**.

Add or strengthen:
- GRE
- IPsec AH
- IPsec ESP
- IKE
- anycast
- explicit unicast/multicast/broadcast/anycast comparison

### 1.5 Transmission media and transceivers
Status: **Needs formal completeness check**.

Add or strengthen:
- DAC/twinax
- Fibre Channel
- SFP vs QSFP
- MPO
- plenum vs non-plenum
- complete connector recognition set

### 1.6 Topologies, architectures, and traffic flows
Status: **Needs formal completeness check**.

Add or strengthen:
- spine-and-leaf
- collapsed core
- north-south traffic
- east-west traffic
- three-tier core/distribution/access model

### 1.7 IPv4 addressing
Status: **Strong**.

Keep:
- RFC1918
- APIPA
- loopback
- subnetting
- CIDR
- IPv4 classes because they remain explicitly listed in N10-009

Add or strengthen:
- VLSM scenario practice

### 1.8 Modern network environments
Status: **Strong but not complete**.

Already strong:
- SDN
- SD-WAN
- application-aware routing
- zero-touch provisioning
- central policy management
- VXLAN
- ZTA
- SASE
- IaC

Add or strengthen:
- SSE distinction from SASE
- DCI in the VXLAN context
- IaC configuration drift/compliance
- dynamic inventories
- IPv6 dual stack
- tunneling
- NAT64

## Domain 2: Network Implementation

### 2.1 Routing technologies
Status: **Strong routing basics; add redundancy details**.

Add or strengthen:
- FHRP
- VIP
- subinterfaces
- route selection comparison: administrative distance, prefix length, metric

### 2.2 Switching technologies and features
Status: **Strong VLAN base; expand implementation details**.

Add or strengthen:
- VLAN database
- SVI
- voice VLAN
- link aggregation
- MTU
- jumbo frames

### 2.3 Wireless devices and technologies
Status: **Needs detailed objective audit**.

Explicitly cover:
- channel width
- non-overlapping channels
- regulatory impacts/802.11h
- 2.4/5/6 GHz
- band steering
- SSID/BSSID/ESSID
- infrastructure/ad hoc/mesh/point-to-point modes
- WPA2/WPA3
- guest captive portals
- PSK vs enterprise authentication
- directional vs omnidirectional antennas
- autonomous vs lightweight APs

### 2.4 Physical installations
Status: **Likely under-covered relative to blueprint**.

Add:
- IDF vs MDF
- rack sizing
- port-side exhaust/intake
- patch panels
- fiber distribution panels
- locking/security
- UPS/PDU
- power load and voltage
- humidity
- fire suppression
- temperature

## Domain 3: Network Operations

### 3.1 Processes and procedures
Status: **Needs stronger operational documentation coverage**.

Add or strengthen:
- physical vs logical diagrams
- rack diagrams
- cable maps
- L1/L2/L3 network diagrams
- asset inventory
- licensing/warranty
- IPAM
- SLA
- wireless survey/heat map
- EOL/EOS
- decommissioning
- request/change tracking
- production/backup/golden configurations

### 3.2 Monitoring technologies
Status: **Strong foundation**.

Already represented:
- SNMP
- traps
- flow data
- packet capture
- baseline metrics
- syslog/SIEM

Add or strengthen:
- API integration
- port mirroring
- network discovery
- scheduled discovery
- availability/configuration monitoring

### 3.3 Disaster recovery
Status: **Strong foundation**.

Already represented:
- RPO
- RTO
- MTTR
- MTBF
- cold/warm/hot sites

Add or strengthen:
- active-active
- active-passive
- tabletop exercises
- validation testing

### 3.4 IPv4/IPv6 network services
Status: **Needs explicit objective mapping**.

Verify full coverage of DHCP and IPv6 network-service scenarios, not only definitions.

### 3.5 Network access and management methods
Status: **Needs explicit objective mapping**.

Verify secure management, VPN, console/SSH/API management, and access-control use cases against the objective wording.

## Domain 4: Network Security

Status: **Strong base; maintain scenario orientation**.

Strengths already observed:
- ARP poisoning
- VLAN hopping
- MAC flooding
- DHCP starvation/rogue DHCP
- DDoS/SYN flood
- social engineering
- IDS/IPS
- firewalls
- ACLs
- AAA

Next audit should map each 4.x subobjective to at least one lesson and one scenario-based question.

## Domain 5: Network Troubleshooting

Status: **Strong direction and high priority because this is 24% of the exam**.

Keep the current bottom-up troubleshooting and command/tool selection approach.

Next audit should ensure each troubleshooting objective contains:
1. symptom recognition,
2. most-likely cause,
3. appropriate tool/command,
4. remediation,
5. a scenario-based question.

## Definition of done for curriculum completeness

The course should not be labeled "complete N10-009 coverage" until every numbered objective has:

- at least one explicit lesson mapping,
- all listed concepts represented or intentionally documented as contextual examples,
- at least one scenario/application question for objectives that use "given a scenario",
- no known technically misleading simplifications,
- automated doctrine audit passing in strict mode,
- a manual review against the then-current official CompTIA objective PDF.

## Automated audit

Run:

```bash
npm run audit:doctrine
```

For CI or release gating:

```bash
npm run audit:doctrine:strict
```

The scanner is intentionally conservative. Keyword presence is not proof of adequate teaching; it identifies areas requiring human review. The official CompTIA objectives remain authoritative.
