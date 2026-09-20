# Mobile two-column product grid

## Goal
Show two product cards side-by-side on mobile in the home shop section, while keeping both purchase actions clearly visible and easy to tap.

## Changes
- Change the home product grid to use two equal columns from the smallest screen size, retaining the existing larger-screen column counts.
- Tighten only the mobile card spacing and typography so product images, names, ratings, prices, and actions fit cleanly without overflow.
- Keep “Add to Cart” and “Order Now” stacked at full card width on mobile, with stable tap height, readable labels, and icons; preserve the existing side-by-side desktop treatment.
- Ensure long product names and optional color choices wrap safely without widening or clipping cards.

## Validation
- Check the home shop at narrow mobile widths for exactly two cards per row, no horizontal scrolling, and fully visible buttons.
- Confirm filtering still works and the desktop grid remains four columns.
- Confirm the preview build completes without errors.

## Technical details
- Update `ProductGrid` grid columns and small-screen gaps.
- Add responsive compact sizing in `ProductCard`; no product data, checkout logic, fonts, colors, or category-page grid structure will change.
