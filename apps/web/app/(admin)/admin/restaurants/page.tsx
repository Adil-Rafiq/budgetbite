'use client';

// TODO: wire to the admin API (GET/POST/PATCH/DELETE `api/admin/restaurants`
// and nested `/menu-items`). Add a `lib/api/endpoints/admin.ts` + `use-admin-*`
// hook, then a data table here. Gate write actions on `can(user.role, 'restaurant:write')`.

export default function AdminRestaurantsPage() {
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
        Restaurants
      </h1>
      <p className="mt-1 text-[14px] text-ink">
        Browse, edit, and remove restaurants and their menu items.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-lumen-dk bg-white p-10 text-center">
        <p className="text-[14px] text-soft">Restaurant management coming soon.</p>
      </div>
    </div>
  );
}
