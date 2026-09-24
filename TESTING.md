# End-to-end testing

1. Create the first admin with `POST /api/admin/setup` using the `ADMIN_SETUP_KEY` header and a strong password, then log into the admin app.
2. Create `SHANO TEST PERFUME`, price 5000, stock 10.
3. Open customer app and confirm it appears.
4. Change price to 4500 and confirm customer reflects it after refresh.
5. Change stock to 5 and confirm availability.
6. Register a customer, add the product, and checkout with COD.
7. Confirm the order appears in Admin → Orders.
8. For manual payment, select the configured method and upload a receipt. Confirm admin can view and verify/reject it.
9. Change order to Shipped and confirm customer order timeline changes.
10. Change announcement/about/shipping settings in admin and refresh customer pages.
11. Test invoice/AWB print views and CSV export.
12. Test mobile/desktop, protected routes, invalid input, out-of-stock checkout and unauthorized admin API calls.
