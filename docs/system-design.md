# AI Expense Tracker System Design

## Current Direction

The product should evolve as a **modular monolith first**, then split into microservices only where there is a clear operational benefit.

That gives us:

- one Angular application with strict feature ownership
- one ASP.NET Core API with explicit infrastructure and application setup
- clear service boundaries for future extraction

This is the safest way to scale the project without adding deployment complexity too early.

## Frontend Structure

The Angular app should follow this shape:

```text
src/app
  features/
    auth/
      components/
      auth-page.component.*
      auth.module.ts
    dashboard/
      components/
      dashboard-page.component.*
      dashboard.module.ts
    receipts/
      components/
      dialogs/
      receipts-page.component.*
      receipts.module.ts
    budgets/
      components/
      pages/
      budgets.module.ts
    categories/
      components/
      pages/
      categories.module.ts
    profile/
      pages/
      profile.module.ts
  shared/
    components/
    shared.module.ts
  layout/
  guards/
  services/
```

### Frontend Rules

- Every route-owning feature owns its own page container.
- Feature-specific dialogs live inside the same feature.
- Reusable cross-feature UI belongs in `shared/`.
- Singleton app concerns such as auth, shell state, and route protection are candidates for a future `core/` folder.
- Lazy loading stays at the feature-module boundary.
- The old global `src/app/pages/` compatibility layer should not come back; live features should import each other directly through feature-owned pages, components, or shared UI.
- Pure child components should prefer `OnPush` change detection so parent containers carry the async orchestration while presentation stays cheap.

### Why This Works

- It keeps receipt, budget, category, and profile behavior isolated.
- It makes future microfrontend extraction easier if the app grows.
- It avoids the anti-pattern where routed features depend on a global `pages/` folder.

## Backend Structure

The API should move toward this shape:

```text
ExpenseTracker.Api
  Configuration/
  Controllers/
  Data/
    ExpenseTrackerDbContext.cs
    IRepository.cs
    Repository.cs
    IUnitOfWork.cs
    UnitOfWork.cs
    Migrations/
  Dtos/
  Extensions/
  Models/
  Services/
```

The current refactor keeps the API as one deployable service, but makes startup explicit:

- `Configuration/JwtSettings.cs` owns auth settings
- `Extensions/ServiceCollectionExtensions.cs` owns registrations
- `Extensions/WebApplicationExtensions.cs` owns middleware and endpoint pipeline

### Backend Rules

- `Program.cs` should only compose the app.
- Service registration should be grouped by platform concern.
- File storage, auth, CORS, data access, and AI integrations should not be mixed inline in startup.
- Controllers and domain services should depend on repositories and a unit of work instead of reaching straight into `DbContext`.
- Repositories should expose querying and persistence for aggregates, while transaction boundaries stay in the unit of work.
- Feature code can later be moved into `Features/Auth`, `Features/Receipts`, `Features/Budgets`, and `Features/Analytics` without changing the deployment model first.

## Future Microservice Boundaries

If the app grows enough to justify separate services, the clean extraction path is:

1. `Identity Service`
   Handles login, registration, OTP, JWT issuing, and user roles.

2. `Receipt Ingestion Service`
   Handles receipt upload, OCR parsing, AI extraction, and file storage.

3. `Budgeting Service`
   Handles budgets, categories, budget pacing, and monthly rules.

4. `Insights Service`
   Handles dashboard summaries, anomaly detection, AI insights, and chat orchestration.

5. `Export and Notification Service`
   Handles exports, email, and future scheduled reminders.

## Recommended Next Cleanup

- Move `layout/`, `guards/`, and auth/profile singleton services into a `core/` folder.
- Group API files by feature once the team is ready for a larger backend refactor.
- Add contracts per domain so frontend modules depend on typed DTOs, not loosely shaped mapping logic.
- Introduce a BFF or API gateway only when multiple deployable backend services actually exist.
