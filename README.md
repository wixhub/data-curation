# Movebank Data Curation & Quality Control Tool

An interactive, fully responsive web utility built with **Angular 22** designed to help researchers inspect, clean, and validate raw animal tracking data prior to analysis or repository publication.

## Features

- **Adaptive Layout:** Utilizes **SCSS and CSS Grid** to transform complex split-screen data grids into fluid, mobile-friendly interfaces on smartphones and tablets.

- **Automated Outlier Detection:** Client-side algorithms flag suspicious telemetry points (e.g., impossible speed jumps).

- **Interactive Review & Export:** Visually inspect anomalies, toggle data inclusion status, and export cleaned datasets locally as CSV or JSON.

## Tech Stack

- **Framework:** This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

- **Styling:** SCSS, CSS Grid (Fully Responsive Across All Screens)

- **Mapping & Logic:** Leaflet.js, custom data-processing pipes

## Getting Started

```bash
git clone https://github.com/wixhub/data-curation.git

cd data-curation
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
