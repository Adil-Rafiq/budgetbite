'use client';

// TODO: wire to the admin API (GET/POST/PATCH/DELETE `api/admin/meal-types`).
// Add a `lib/api/endpoints/admin.ts` + `use-admin-*` hook, then a data table here.
// Gate write actions on `can(user.role, 'meal-type:write')`.

export default function AdminMealTypesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Meal types
      </h1>
      <p className="mt-1 text-[14px] text-ink">Manage the meal types users can plan around.</p>

      <div className="mt-6 rounded-xl border border-dashed border-lumen-dk bg-white p-10 text-center">
        <p className="text-[14px] text-soft">Meal type management coming soon.</p>
      </div>
    </div>
  );
}
