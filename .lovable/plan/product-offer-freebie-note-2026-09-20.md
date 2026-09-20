# Product Offer / Freebie Note

## Goal
Add an optional per-product note that administrators can manage and customers see only directly below the product title on its dedicated product page.

## Changes
- Add an `offer_note` text field to product records, defaulting to empty for existing products.
- Add an empty “Offer / Freebie Note” input to the product create/edit form in the admin panel.
- Include the field in secure admin product saves and product-page loading.
- Render the trimmed note as muted, semi-bold subtitle text immediately below the main product title.
- Render nothing when the note is empty, and do not add it to product cards, category pages, checkout, sidebars, or metadata.

## Validation
- Verify admin create/edit payloads preserve the optional note.
- Check a product page with and without a note.
- Confirm the project builds successfully.

## Technical details
- Database migration: nullable/default-empty `products.offer_note` text column.
- Extend only the product database/admin types needed for this field; the shared storefront card model remains unchanged so the note cannot leak into other displays.
