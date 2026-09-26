# Security Policy

## Scope

VOTOL Config communicates with physical vehicle hardware. Security issues may therefore have both software and physical-safety implications.

## Please report privately

Do not publicly post:

- credentials
- private Bluetooth pairing information
- personal information
- private vehicle identifiers
- exploitable control frames that could unexpectedly enable or move a vehicle
- unpublished vulnerabilities involving remote control

For sensitive issues, use GitHub's private security reporting mechanism when available.

## Safety-related vulnerabilities

Examples include:

- unauthorized motor activation
- bypassing safety interlocks
- unintended controller writes
- unsafe parameter changes
- commands sent to the wrong device
- Bluetooth authentication weaknesses
- malformed frames causing unsafe controller behavior

These should be treated as high priority.

## Development rule

The application should fail safely:

- unknown devices should not receive write commands
- unverified control commands should not be exposed as normal controls
- communication failures should not leave a command in an ambiguous state
- dangerous operations should require deliberate user confirmation
