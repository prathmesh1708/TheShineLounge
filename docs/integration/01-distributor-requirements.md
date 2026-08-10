# Integration Requirements — Tunnel Car Wash & ANPR Gate System

**To:** Equipment Distributor / Manufacturer
**From:** The Shine Lounge — Technical Integration Team
**Date:** 8 August 2026
**Subject:** Request for external interface documentation and API access for tunnel car wash integration
**Reference document received:** *"Overseas opening of interfaces"* (Smart Parking External Development Interface, v-unnumbered)

---

## 1. Purpose of this request

The Shine Lounge operates a customer-facing booking platform (mobile/web app, staff console, admin console). We are integrating the tunnel car wash equipment being supplied so that the following happen **automatically, with no staff data entry**:

1. When a vehicle **enters the wash tunnel**, the customer's booking status updates to *Vehicle Received* → *Wash Started* and becomes visible in their app in real time.
2. When the **wash cycle completes**, the booking status updates to *Wash Completed* → *Delivered*.
3. The customer's **membership balance / washes remaining** is decremented automatically against the actual wash performed.
4. The **wash package actually delivered** by the machine is recorded against the booking for billing and reporting.

We have reviewed the *Smart Parking External Development Interface* document supplied. It is a valuable and largely sufficient specification **for the ANPR barrier-gate subsystem**. However it does not describe the **tunnel wash controller**, which is required for items 1–4 above.

This document lists (A) what we still need, (B) clarifications on the document already supplied, and (C) the commercial/support items required.

---

## 2. Summary of what we need

| # | Item | Priority | Status |
|---|------|----------|--------|
| A1 | Tunnel wash controller external interface specification (English) | **BLOCKER** | Not received |
| A2 | Wash cycle event feed (start / complete / abort) | **BLOCKER** | Not received |
| A3 | Vehicle ↔ wash cycle identity linkage method | **BLOCKER** | Not received |
| A4 | Wash program / package code table | **BLOCKER** | Not received |
| A5 | Wash authorisation ("start wash for plate X, program Y") | High | Not received |
| A6 | Fault / alarm event feed | High | Not received |
| B1 | Authentication & transport security for all APIs | **BLOCKER** | Absent from supplied doc |
| B2 | Real push/callback (webhook) instead of polling | High | Absent from supplied doc |
| B3 | Code tables (`carType`, `realCarType`, `carNumType`, `status`) | High | Undocumented |
| B4 | Machine-readable spec (OpenAPI/Swagger or Postman collection) | High | Not received |
| B5 | Corrections to inconsistencies listed in §4 | High | — |
| C1 | Test/staging environment or simulator + credentials | **BLOCKER** | Not received |
| C2 | Network, IP and port plan for site installation | High | Not received |
| C3 | Named integration engineer + support SLA | High | Partial (phone only) |

---

## 3. Section A — Tunnel wash controller interface (the critical gap)

Please supply the external/third-party integration specification for the **tunnel wash controller (PLC / wash controller / site controller)**, equivalent in form to the parking document already supplied. Specifically:

### A1. General
- Document in **English**, with the **original (untranslated) JSON field names** preserved.
- Controller make, model, firmware version, and the manufacturer's integration manual.
- Integration protocol supported. Please state which of the following are available:
  - [ ] REST / HTTP + JSON (preferred)
  - [ ] Outbound webhook / HTTP callback (preferred)
  - [ ] MQTT (broker details, topics, QoS)
  - [ ] WebSocket
  - [ ] Modbus TCP (register map required)
  - [ ] OPC-UA (node map required)
  - [ ] Raw TCP/serial socket (byte-level frame format required)
  - [ ] Dry-contact relay / digital I/O only (terminal map and signal timing required)

### A2. Wash cycle events — REQUIRED
We need to be notified of, at minimum, the following events. For each, please confirm availability and supply the exact payload:

| Event | Required fields |
|-------|-----------------|
| `wash.vehicle_entered` | event id, timestamp, lane/bay id, vehicle identifier (see A3) |
| `wash.started` | event id, timestamp, cycle id, program/package code, vehicle identifier |
| `wash.stage_changed` *(optional but desirable)* | event id, timestamp, cycle id, stage name/code, progress % |
| `wash.completed` | event id, timestamp, cycle id, program code, duration, completion result (success/partial) |
| `wash.aborted` / `wash.failed` | event id, timestamp, cycle id, reason code |
| `wash.vehicle_exited` | event id, timestamp, cycle id |

For each event please confirm:
- Is it **pushed** to a URL we configure, or must we **poll**? If polling, what is the safe minimum interval?
- Does every event carry a **unique, stable event id** so we can de-duplicate on retry? *(This is essential — without it we cannot guarantee a customer is charged exactly once.)*
- Is there a **replay / backfill** query (fetch events between two timestamps) for recovery after a network outage?
- Delivery guarantee: at-least-once, at-most-once, or exactly-once? Retry policy on our non-200 response?

### A3. Vehicle ↔ wash cycle linkage — REQUIRED
The single most important question: **how does the tunnel controller know which vehicle is in the tunnel?** Please state which applies:

- [ ] Licence plate is passed to the tunnel controller from the ANPR entry camera (please describe the internal linkage and confirm the plate appears in wash events)
- [ ] Barcode / QR code / ticket printed at entry and scanned at the tunnel
- [ ] RFID tag / windscreen transponder
- [ ] Loop/sensor sequence number only (i.e. **no vehicle identity** — please confirm, as this materially changes our design)
- [ ] Operator selects the vehicle on an HMI at the tunnel entrance
- [ ] Other: ______________________

If the plate is **not** available in wash events, please confirm whether the tunnel controller and the parking/ANPR system share a common session, transaction or sequence id we can join on.

### A4. Wash program / package code table — REQUIRED
- Full list of wash programs the machine can run: **code, name, description, nominal duration**.
- How is the program selected — by the customer at a kiosk, by staff, or commanded via API?
- Can a program be **commanded remotely** by our system (see A5)?
- Are program codes stable across firmware upgrades?

### A5. Wash authorisation / entitlement (strongly desired)
To enforce memberships and prepaid packages we would like to control whether a wash may start:

- Does the controller support an **inbound "authorise & start"** command, e.g. `startWash(laneId, plate, programCode, transactionRef)`?
- Alternatively, does the controller **query an external endpoint** before starting a wash (an entitlement callback we would host)? If so, please supply the request/response contract and timeout behaviour.
- Can a wash be **remotely blocked** (e.g. expired membership, no washes remaining)?
- Is there a **stop / e-stop** command available over the interface?

### A6. Faults, status and diagnostics
- Machine status endpoint: idle / running / faulted / offline / maintenance.
- Alarm and fault code table with severities.
- Consumable levels (shampoo, wax, water) if exposed.
- Counters: total washes, washes by program, per day — useful for reconciliation against our billing.
- Heartbeat / keepalive mechanism and expected interval.

---

## 4. Section B — Clarifications on the supplied parking document

We can build against the supplied *Smart Parking External Development Interface* document, but the following must be resolved before production use.

### B1. Authentication and transport — BLOCKER
The document specifies **no authentication of any kind** on any of the fourteen endpoints, over **plain HTTP** at `http://192.168.1.169:9001`. Endpoint #2 `/yard/third/openGate` can raise the barrier, and #3 `/yard/third/monthRental` can issue a free/monthly plate — both without credentials. This is not acceptable for production.

Please confirm what the system supports:
- [ ] API key / static token in header
- [ ] OAuth2 client credentials
- [ ] HMAC request signing (please specify algorithm, canonical string and clock-skew tolerance)
- [ ] IP allow-list
- [ ] HTTPS / TLS (please confirm, and whether a certificate can be installed)
- [ ] Mutual TLS

If none are available today, please confirm whether they can be added, and on what timeline. If they cannot, we will isolate the device on a dedicated VLAN with no route to the internet, and we will require written confirmation that this is the supported deployment model.

### B2. Push vs poll
Endpoint #13 is named `getPushNotification` but is in fact a **client-initiated POST** that we must poll per `channelMac`. Please confirm:
- Is there a genuine outbound callback/webhook where we register **our** URL and the system POSTs entry events to us as they happen?
- If not, what is the **minimum safe polling interval** per channel, and how many channels can be polled concurrently?
- Does `getPushNotification` return only the **most recent** vehicle, or a queue? If only the most recent, **we will lose events** when two vehicles pass within one polling interval. Please confirm the intended behaviour.

### B3. Undocumented code tables
The following fields are typed `Int` with no value list. Please supply the complete code tables:
- `carType` and `realCarType` (values seen in examples: `11`, `31`)
- `carNumType` — "vehicle license plate colour"
- `isNoCarNo` — confirmed as `0` = registered, `1` = unregistered
- `enterWay` / `leaveWay`
- `paymentWay`, `payType`, `operType`, `recordType`, `billStatus`, `trafficUploadStatus`
- `small` — confirmed as `0` = large lot, `1` = small lot
- `status` on the charge object (`0` normal billing, `1` normal but no charge, `2` abnormal, `3` no charge required) — please confirm this is exhaustive

### B4. Response status contradiction
Section "Response status" of every interface states `200 = Request successful`. However every worked example returns a body of `{"status": 1, ...}`. Please clarify:
- Is `status` in the body the **HTTP status** or an **application status**?
- What is the full list of application status values, including all failure values?
- What does a **failure** response body actually look like? No failure example is given anywhere in the document.

### B5. Data format and localisation
- **Plate format:** examples use Chinese plates (`"Guangdong B34943"`, `"B98255"`). Our site uses a different plate format. Please confirm character-set support (UTF-8), maximum length, whether spaces/hyphens are preserved, and whether plate matching is exact or normalised.
- **Untranslated values:** `getCarOut` returns `"enterPass": "入口"` and `"leavePass": "出口"`. Please confirm whether these strings are configurable/localisable, or whether we must map them.
- **Currency:** amounts are documented in **Fen** (1/100 CNY). Please confirm the unit used in our deployment and whether the currency is configurable.
- **Timestamps:** the document mixes `"2025-01-02 15:50:45"`, `"2025-01-17T02:00:33.000+0000"` and `"12/25/2024 16:31:30"` in different responses. Please specify the **exact format and timezone per field**, and whether the device clock is NTP-synchronised.
- **Field name casing:** section 10 (`getChargeInfo`) shows `"Car Type"`, `"Page Size"`, `"Status": "One"` — apparently artefacts of machine translation. Please supply the **original, verbatim JSON** for every example.

### B6. Document completeness
- The "Examples of response" blocks were supplied as **images**, not text. Please provide them as text, and preferably as a **Postman collection or OpenAPI/Swagger file**.
- Section 3 (`monthRental`) and section 12 (`userPaymentCarFee`) request-parameter tables are incomplete in the copy received.
- Section 14 lists the **same URL** `/yard/third/findMonthCarInfo` for both *"query monthly truck information"* and *"monthly card renewal recharge"*. Please confirm the correct endpoint for renewal.
- Endpoint #11 returns a **relative** image path (`Images/2025/1/9/1921681160_202519204320_big.jpg`). Please supply the base URL, the port, and whether image retrieval requires authentication.
- Please supply the **document version number and date**, and confirm the firmware version it applies to.

---

## 5. Section C — Deployment, testing and support

### C1. Test environment — BLOCKER
We cannot develop against production hardware. Please provide **one** of:
- [ ] A cloud/staging instance of the API with test credentials, **or**
- [ ] A software simulator that emits realistic entry and wash-cycle events, **or**
- [ ] A bench unit / demo controller on site ahead of go-live, **or**
- [ ] Recorded sample payloads for **every** event and endpoint, including error cases

### C2. Network and installation
- Will the parking server and the tunnel controller be on the **same LAN** as our on-site integration server?
- Confirmed **static IP addresses and ports** for both (the document's `192.168.1.169:9001` and `192.168.1.22:9001` appear to be lab addresses).
- Do the devices require **outbound internet** access? To which hosts?
- Can we place both devices on an **isolated VLAN** with only our integration server permitted to reach them?
- Number of lanes/channels and the **`channelMac` for each**, with its physical meaning (entry, exit, tunnel entrance, tunnel exit).
- Expected **event throughput** at peak (vehicles/hour).

### C3. Commercial and support
- Named **integration engineer** and email address. *(The document currently gives only a mobile number, `13066858850`, for all failures.)*
- Support hours, timezone, and response SLA for integration issues.
- Is API access included in the supply contract, or licensed separately? Any per-call or per-device fees?
- Firmware upgrade policy — will upgrades change the API? What notice is given? Is the API versioned?
- Are there **rate limits** on any endpoint?
- Confirmation that we are permitted to store plate numbers, timestamps and vehicle images retrieved via these APIs, and any data-retention constraints.

---

## 6. Minimum acceptable outcome

If the tunnel controller genuinely exposes **no** integration interface, we still require a written statement to that effect, plus confirmation of whether either of the following fallbacks is available:

- **Fallback 1 — Dry contacts:** a volt-free relay output that closes on *wash start* and on *wash complete*, with terminal designations and signal duration. We can wire this to an I/O module and derive the events ourselves. Vehicle identity would then be inferred from the ANPR entry event by time-window correlation.
- **Fallback 2 — Database read access:** read-only credentials to the controller's local database, with the relevant table/column definitions.

Either fallback is workable. **No signal at all is not** — it would mean staff must continue updating every wash by hand, which is precisely what this project exists to eliminate.

---

## 7. Response requested

Please return:
1. The tunnel wash controller interface specification (§3).
2. Point-by-point answers to §4 and §5.
3. Test environment access or sample payloads (§C1).
4. Named engineering contact (§C3).

We are ready to begin development against a specification or simulator immediately; hardware on site is not required for the first phase.

---

*Prepared by The Shine Lounge technical team. Please direct technical replies to the project contact.*
