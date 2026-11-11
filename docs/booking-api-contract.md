# Booking API contract reference

This document is intended as a contract reference for the appointment, availability, and payment domain added in the Prisma schema. It is a backend-ready specification for API implementation and frontend coordination.

## Availability endpoints

### POST /availability
Creates a new time slot for an advocate.

Request body:
```json
{
  "advocateId": "<uuid>",
  "startsAt": "2026-11-12T10:00:00.000Z",
  "endsAt": "2026-11-12T11:00:00.000Z",
  "timezone": "UTC",
  "status": "OPEN",
  "notes": "Consultation slot"
}
```

Response:
```json
{
  "id": "<uuid>",
  "advocateId": "<uuid>",
  "startsAt": "2026-11-12T10:00:00.000Z",
  "endsAt": "2026-11-12T11:00:00.000Z",
  "status": "OPEN"
}
```

### GET /advocates/:advocateId/availability
Returns open and booked slots for a given advocate.

## Appointment endpoints

### POST /appointments
Creates a booking from an availability slot.

Request body:
```json
{
  "clientId": "<uuid>",
  "advocateId": "<uuid>",
  "availabilityId": "<uuid>",
  "caseId": "<uuid>",
  "title": "Legal consultation",
  "description": "Employment law consultation",
  "scheduledAt": "2026-11-12T10:00:00.000Z",
  "endAt": "2026-11-12T11:00:00.000Z",
  "amount": 140.00,
  "currency": "USD"
}
```

Response:
```json
{
  "id": "<uuid>",
  "status": "PENDING",
  "amount": 140.00,
  "currency": "USD"
}
```

### PATCH /appointments/:id/status
Updates the appointment lifecycle state.

Request body:
```json
{
  "status": "CONFIRMED"
}
```

## Payment endpoints

### POST /payments/appointments/:appointmentId
Creates or updates a payment record for the appointment.

Request body:
```json
{
  "amount": 140.00,
  "currency": "USD",
  "provider": "stripe",
  "paymentIntentId": "pi_12345"
}
```

Response:
```json
{
  "id": "<uuid>",
  "appointmentId": "<uuid>",
  "status": "PENDING",
  "amount": 140.00,
  "currency": "USD"
}
```

## Error handling expectations
- Return `404` when a slot or appointment does not exist.
- Return `409` when a booking attempt conflicts with an already booked availability slot.
- Return `422` when an invalid booking or payment status transition is requested.

## Implementation notes
- State transitions are validated by backend logic before persisting to the database.
- Payment status changes should remain consistent with appointment status updates.
