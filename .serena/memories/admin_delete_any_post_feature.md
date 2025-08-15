# Admin Delete Any Post Feature

## What was implemented:
- Added `canDeleteAny` parameter to `ThreeDotsMenu` to distinguish between author delete and admin delete
- Super admins can now delete any post (not just their own) through the three-dots menu
- The delete option shows "Delete Post (Admin)" for admin deletions vs "Delete" for author deletions
- Updated both `PostRow.swift` and `ThreeDotsMenu.swift` to support this functionality

## Technical details:
- `adminMenuButton` now checks for `adminService.hasPermission(.deleteAnyPost)`
- Three-dots menu shows delete option for both authors and admins with deleteAnyPost permission
- Delete button text is contextual: "Delete" for authors, "Delete Post (Admin)" for admins

## Files modified:
- `RefractiveExchange/Logged In/EyeReddit/Feed/PostRow.swift`
- `RefractiveExchange/UI/ThreeDotsMenu.swift`