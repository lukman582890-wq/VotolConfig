# VOTOL Config

Android companion application for communicating with VOTOL electric motor controllers and, in later stages, JK BMS devices.

The project is designed around a simple goal:

> **Connect a phone directly to a VOTOL controller, read its data, manage supported parameters, and build a safe foundation for future vehicle-control features.**

## Project status

🚧 **Early development — protocol and hardware validation in progress.**

The first milestone is to establish a reliable Android Bluetooth connection with a VOTOL EM-50 and verify read-only communication before adding write/control functions.

### Current target

- VOTOL EM-50
- Android phone
- Bluetooth serial communication
- VOTOL controller telemetry/configuration protocol
- Future JK BMS integration
- No ESP32 required for the primary Bluetooth path

> **Important:** Not every VOTOL controller exposes every function through Bluetooth. Features such as motor enable/disable, E-Lock, anti-theft, or remote power control will only be implemented after the corresponding protocol behavior is verified on real hardware.

## Planned features

### VOTOL controller

- [ ] Android Bluetooth device discovery
- [ ] Connect/disconnect
- [ ] Connection status and diagnostics
- [ ] Read controller identification
- [ ] Read live controller telemetry
- [ ] Read configuration
- [ ] Export configuration
- [ ] Import configuration
- [ ] Parameter editing with validation
- [ ] Safe write workflow
- [ ] Fault/DTC reading
- [ ] Fault/DTC clearing where supported
- [ ] Controller backup/restore
- [ ] Protocol logging
- [ ] Raw frame monitor for development
- [ ] EM-50 compatibility testing
- [ ] Support for additional VOTOL EM-series controllers

### Vehicle control research

These features are **research/experimental** until confirmed by protocol analysis and hardware testing:

- [ ] E-Lock state
- [ ] Motor enable/disable
- [ ] Anti-theft state
- [ ] Motor lock
- [ ] Remote ON/OFF
- [ ] Other controller-side control commands

Safety-critical commands will be disabled by default during development and must be explicitly verified before being exposed in the normal UI.

### JK BMS

- [ ] JK BMS discovery
- [ ] Battery voltage/current/SOC
- [ ] Cell voltages
- [ ] Temperatures
- [ ] BMS alarms
- [ ] Charge/discharge state
- [ ] Pack statistics
- [ ] Protocol abstraction
- [ ] Combined VOTOL + JK dashboard

## Hardware context

The initial development target is an electric scooter using:

- VOTOL EM-50 controller
- 60 V LiFePO4 battery
- JK BMS

Actual compatibility depends on the exact controller revision, firmware, Bluetooth/CAN/serial adapter, wiring, and communication mode.

## Communication architecture

The application is intended to keep the communication layer independent from the user interface:

```
Android UI
   |
Application / State Layer
   |
Protocol Services
   |
Bluetooth Transport
   |
VOTOL Controller
```

For future BMS support:

```
                 +-- VOTOL Protocol -- VOTOL EM-50
Android App ----+
                 +-- JK BMS Protocol -- JK BMS
```

This separation allows protocol work and UI work to evolve independently.

## Protocol research

VOTOL controllers have documented serial/Bluetooth programming workflows, and community reverse-engineering projects provide additional protocol information. The project will distinguish clearly between:

1. **Documented** — supported by controller documentation.
2. **Observed** — captured from real hardware.
3. **Reverse engineered** — derived from protocol analysis.
4. **Experimental** — not yet sufficiently verified.

Do not assume that a command works simply because a frame can be transmitted.

## Safety

This application communicates with hardware capable of controlling an electric motor.

Before testing:

- Put the vehicle on a stable stand when practical.
- Keep the driven wheel clear of people and objects.
- Do not test unknown write/control frames while riding.
- Keep a known-good controller configuration backup.
- Never change voltage/current parameters without confirming hardware compatibility.
- Stop testing immediately if the controller behaves unexpectedly.

Incorrect controller parameters can damage hardware. VOTOL documentation also warns that parameter changes must remain within the supported hardware range.

## Development

The intended Android stack is based on modern web technologies with Capacitor/native Bluetooth integration where appropriate.

Initial development workflow:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

Android development requires:

- Node.js
- Android Studio
- Android SDK
- Java/JDK compatible with the selected Android/Gradle toolchain

## Development phases

### Phase 1 — Foundation

1. Android project
2. Application shell
3. Bluetooth permission handling
4. Device discovery
5. Connect/disconnect
6. Connection diagnostics

### Phase 2 — VOTOL read-only

1. Controller identification
2. Protocol framing
3. Telemetry parsing
4. Fault reading
5. Raw communication logging

### Phase 3 — Configuration

1. Parameter model
2. Read configuration
3. Validation
4. Backup/export
5. Controlled parameter writes
6. Restore workflow

### Phase 4 — JK BMS

1. BMS transport
2. Protocol parser
3. Battery dashboard
4. Cell/temperature/fault data
5. VOTOL + BMS combined view

### Phase 5 — Advanced control research

Only after protocol verification:

- E-Lock
- anti-theft
- motor lock
- enable/disable
- remote control functions

## Repository structure

The repository will evolve toward a structure similar to:

```
VotolConfig/
├── android/              # Capacitor Android project
├── src/
│   ├── components/       # UI components
│   ├── services/         # Bluetooth and device services
│   ├── protocols/        # VOTOL / JK protocol implementations
│   ├── models/           # Data models
│   └── utils/            # Shared utilities
├── docs/
│   ├── protocol/
│   ├── hardware/
│   └── development/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── .gitignore
```

## Credits and research references

This project is intended to build on publicly available VOTOL documentation and community protocol research rather than reinventing already-documented communication layers.

Relevant research areas include VOTOL serial communication, CAN communication, Bluetooth serial adapters, and community reverse engineering.

## Disclaimer

VOTOL Config is an independent software project. It is not an official VOTOL application and is not affiliated with or endorsed by VOTOL/SIAECOSYS.

Use at your own risk. The developers are not responsible for damage, injury, loss of configuration, or vehicle behavior resulting from use of this software.

## License

A project license will be selected before the repository is published as a reusable open-source project.
