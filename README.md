# Hospital Management System API

A RESTful backend application for managing hospital operations, including user authentication, doctor profiles, appointment scheduling, medical services, and prescriptions.

Built with **NestJS, TypeScript, MongoDB, and Mongoose**, with role-based access control and transaction-based workflows for operations that modify related records.

## Features

### Authentication & Authorization

* User registration and login using JWT authentication.
* Role-based access control for Admin, Doctor, and Patient.
* Protected routes and authorization checks.

### User & Doctor Management

* User profile and account management.
* Doctor profile management.
* Doctor image uploads using Cloudinary.
* Account deactivation workflows.

### Appointment & Slot Management

* Doctor slot creation and management.
* Appointment booking and status management.
* Slot cancellation with related appointment updates.
* Capacity checks to prevent overbooking.
* MongoDB transactions for related database updates.

### Medical Services

* Medical service management.
* Service bookings linked to users.
* Booking cancellation workflows.

### Prescriptions

* Prescription data linked to appointments, patients, and doctors.
* Draft and finalized prescription statuses.

### Developer Experience

* API documentation with Swagger / OpenAPI.
* Application logging.
* DTO-based request validation.
* Modular architecture using NestJS modules, controllers, and services.

## Tech Stack

* **Backend:** NestJS, TypeScript, Node.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JWT, Passport
* **Validation:** class-validator, class-transformer
* **Image Storage:** Cloudinary
* **API Documentation:** Swagger / OpenAPI
* **Logging:** NestJS logging utilities or the configured application logger

## Architecture

The application follows a modular backend structure. Controllers handle HTTP requests, services implement business logic, DTOs validate input, and Mongoose models manage database operations.

Core domain modules include:

* Authentication
* Users
* Doctors
* Slots
* Appointments
* Medical Services
* Service Bookings
* Prescriptions
* Cloudinary integration

## Getting Started

### Prerequisites

* Node.js (use a version supported by the project's dependencies)
* npm
* MongoDB configured as a replica set if transaction-based workflows are enabled
* Cloudinary credentials for image uploads

### Installation

Clone the repository:

```bash
git clone https://github.com/MohammedHamed9/Hospital-Management-System-.git
cd Hospital-Management-System-
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and configure the variables used by the application.

Example:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/hospital?replicaSet=rs0
JWT_SECRET=replace_with_a_secure_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Use the exact variable names expected by your application. Never commit real credentials or production secrets.

### Run the Application

Development:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

Check `package.json` for the exact scripts supported by your version of the project.

## API Documentation

After starting the application, open the Swagger UI at the configured documentation route.

For example, if Swagger is configured at `/api`:

```text
http://localhost:3000/api
```

Swagger provides an interactive interface for exploring documented endpoints, request schemas, and responses.

## Database Transactions

Some business operations update multiple related collections, such as booking an appointment and reserving slot capacity, or cancelling a slot and its associated appointments.

These operations use MongoDB transactions to keep related updates consistent. MongoDB transactions require a replica set or a sharded cluster; a standalone MongoDB server does not support multi-document transactions.

## Project Status

**Version 1.0 — Initial backend version**

The core backend workflows and API documentation are under development and refinement. Testing coverage, deployment, and additional production-readiness improvements should be documented as they are completed.

## Future Improvements

* Unit and end-to-end testing.
* More comprehensive appointment and booking edge-case coverage.
* Password recovery and email verification.
* Improved monitoring and audit logging.
* Deployment and CI/CD automation.
* Additional reporting and dashboard endpoints.

## Author

**Mohamed Hamed**

* GitHub: [MohammedHamed9](https://github.com/MohammedHamed9)
* Project Repository: [Hospital Management System](https://github.com/MohammedHamed9/Hospital-Management-System-.git)
