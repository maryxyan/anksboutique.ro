# TODO - Admin Etichete UI

## Plan (approved)
1. Update UI layout of `public_html/admin/etichete.php`:
   - improve form + table spacing using existing `.table-container`, `.form-*`, `.form-row` classes
   - add slug preview and small helper text
   - add better empty state for labels table
   - improve table readability (truncate description via CSS-friendly approach, add fallback)
2. If needed, extend `public_html/css/style.css` with small extra selectors for admin/labels page:
   - optional helper classes (e.g., `.muted`, description clamp)
3. Keep all existing POST/CSRF logic intact (delete/edit/add).

## Steps
- [x] Implement UI updates in `public_html/admin/etichete.php`
- [ ] Add/adjust CSS in `public_html/css/style.css` (if required)
- [x] Sanity check: verify add/edit/delete still works




