# Bilingual Checkout Locations

## Goal
Show English and Bengali names together for every district and thana/upazila option while preserving the existing clean English values saved with orders.

## Changes
- Add Bengali display-name mappings for the existing 64 districts and their thana/upazila options.
- Keep each dropdown option value as its current English name; change only the visible label to `English (বাংলা)`.
- Add bilingual placeholder labels for the district and thana/upazila selectors.
- Leave delivery-price logic, validation, saved orders, Meta matching, and checkout flow unchanged.

## Validation
- Verify selecting a bilingual option still submits the original English district and thana values.
- Check dependent thana options update after changing district.
- Confirm the project builds successfully.
