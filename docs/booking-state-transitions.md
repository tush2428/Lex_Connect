# Booking domain schema and state transitions

## Scope
This project now includes booking-specific Prisma models for appointment scheduling, advocate availability, and payment management. These schemas are defined in `prisma/schema.prisma` and mapped to migration SQL in `prisma/migrations/20261111090000_add_booking_and_payment_schema/migration.sql`.

## Models

### Availability
Represents a time block available for a lawyer/advocate. The model records the advocate, the slot window, the timezone, and current slot status.

Relevant fields:
- `advocateId`: linked advocate user
- `startsAt`, `endsAt`: the concrete slot window
- `status`: `OPEN`, `BOOKED`, `BLOCKED`
- `notes`: optional slot notes

### Appointment
Represents a booked consultation or legal session against a specific availability slot.

Relevant fields:
- `clientId`, `advocateId`: associated users
- `availabilityId`: scheduled slot reference
- `status`: the booking lifecycle state
- `scheduledAt`, `endAt`: booking time range
- `amount`, `currency`: fee information

### Payment
Tracks the invoice/payment lifecycle for an appointment.

Relevant fields:
- `appointmentId`: one-to-one relation to a booked appointment
- `amount`, `currency`: charge amount
- `status`: `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`
- `provider`, `transactionId`, `paymentIntentId`: payment integration metadata

## Appointment booking state transitions

| Current state | Allowed next states | Notes |
| --- | --- | --- |
| `PENDING` | `CONFIRMED`, `CANCELLED`, `RESCHEDULED` | Booking is created but not yet accepted or paid in full. |
| `CONFIRMED` | `CHECKED_IN`, `CANCELLED`, `RESCHEDULED` | Appointment has been accepted and the slot is held. |
| `CHECKED_IN` | `COMPLETED`, `NO_SHOW`, `CANCELLED` | Client has joined or checked in. |
| `COMPLETED` | none | Terminal state after appointment is finished. |
| `CANCELLED` | none | Terminal cancellation state. |
| `NO_SHOW` | none | Terminal no-show state. |
| `RESCHEDULED` | `PENDING`, `CONFIRMED` | Rebooking flows to a new slot and re-enters the booking lifecycle. |

## Payment state transitions

| Current state | Allowed next states | Notes |
| --- | --- | --- |
| `PENDING` | `AUTHORIZED`, `PAID`, `FAILED` | Payment is being processed or awaiting confirmation. |
| `AUTHORIZED` | `PAID`, `FAILED`, `REFUNDED` | Card or gateway authorization is valid but settlement is not final. |
| `PAID` | `REFUNDED`, `PARTIALLY_REFUNDED` | Payment cleared successfully. |
| `FAILED` | none | Payment attempt failed and requires user action or retry. |
| `REFUNDED` | none | Full refund completed. |
| `PARTIALLY_REFUNDED` | none | Partial refund completed. |

## Suggested business rules
- A booking cannot move from `CANCELLED` or `NO_SHOW` back into an active state.
- `Availability.status` should be set to `BOOKED` when an appointment is confirmed.
- `Payment.status` should be `PAID` before an appointment is fully confirmed in a production booking flow.
- `RESCHEDULED` should always generate a fresh `Availability` slot or reassign the existing slot to a new appointment.

## Review checklist
- Prisma schema reviewed for required relations and indexes.
- Migration created to support the new domain tables and enums.
- State transitions documented for backend and frontend coordination.
