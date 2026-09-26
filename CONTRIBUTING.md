# Contributing to VOTOL Config

Thank you for helping improve VOTOL Config.

## Development principles

The project prioritizes:

1. Hardware safety
2. Reproducible protocol findings
3. Read-only testing before write operations
4. Clear separation between verified and experimental behavior
5. Small, reviewable changes

## Protocol contributions

When documenting a new frame or command, include as much of the following as possible:

- Controller model
- Controller hardware revision
- Firmware version
- Communication method
- Baud rate, if applicable
- Request frame
- Response frame
- Meaning of each byte/field
- Test conditions
- Whether the result was reproduced
- Whether the operation is read-only or modifies controller state

Never describe an unverified frame as a confirmed command.

## Code changes

Before submitting a change:

```bash
npm install
npm run build
```

For Android changes, also verify:

```bash
npx cap sync android
```

## Safety-critical changes

Changes involving:

- motor enable/disable
- E-Lock
- anti-theft
- motor lock
- current limits
- voltage limits
- throttle parameters
- controller firmware/configuration writes

must include a clear description of the hardware test conditions and verification status.

## Commit messages

Prefer descriptive commits:

- `feat: add EM50 telemetry parser`
- `fix: handle bluetooth disconnect`
- `docs: document VOTOL frame`
- `refactor: separate transport from protocol`

## Issues

When reporting a communication problem, provide:

- phone model
- Android version
- controller model
- controller revision/firmware if known
- Bluetooth adapter/model
- connection method
- application version/commit
- relevant logs or captured frames
- exact observed behavior
