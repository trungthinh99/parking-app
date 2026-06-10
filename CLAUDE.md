# Claude Code Rules - Parking Mobile (React Native)

## 1. Language & Text
- **All UI text and error messages MUST be in Korean**
- **Icon Handling**: `iconsax-react-native` first → `src/assets/images/icons/` → download from Figma
- Interaction with Claude: respond in Vietnamese.

## 2. Tech Stack
- **Framework**: React Native + Expo SDK + Expo Router
- **TypeScript**: Strict mode, NO `any`
- **Key Libraries**: `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-hook-form`, `victory-native`
- **API Client**: Custom fetch-based with `x-screen-id` header
- **Fonts**: Pretendard (9 weights: Thin → Black)

## 3. Routing (Expo Router)

### File-Based Routing
- Files in `app/` → routes. Groups `(auth)`, `(tabs)` = layout only (not in URL)
- **Keep routes thin** — logic in `src/screens/` or `src/features/`
- Use `PATHS` constants from `constants/Paths.ts` for navigation

### Screen Routes & IDs
See `constants/Paths.ts` and `src/api-contracts/screen-ids.ts` for full list.

### Navigation
```typescript
const router = useRouter();
router.push(PATHS.AUTH.LOGIN);
router.replace(PATHS.TABS.CONTROL_BOARD);
router.back();
```

## 4. API Architecture

### Screen-Based API
Every request **MUST** include `x-screen-id` header via `apiRequest()`.

### API Client (`src/api/client.ts`)
```typescript
import { apiRequest, ApiClientError } from '@/src/api/client';

// JSON request
const res = await apiRequest<LoginRequest, LoginResponse>({
  method: 'POST', path: '/auth/login',
  screenId: 'AUTH_LOGIN', body: { username, password },
});

// File upload (single file)
await apiUpload<T>({ path, screenId, fieldName, fileUri, fileName, mimeType });

// File upload with text fields
await apiUploadWithFields<T>({ path, screenId, body: {...}, file: { fieldName, fileUri, fileName, mimeType } });
```

### Error Handling
```typescript
catch (error) {
  if (error instanceof ApiClientError) {
    error.apiError?.message; // Korean error message
    error.status;            // HTTP status
  }
}
```

## 5. API Contracts
- Auto-generated in `src/api-contracts/` — **DO NOT EDIT**
- Sync: `npm run sync:contracts`
- Import: `import { LoginRequest, SCREEN_IDS, ApiError } from '@/src/api-contracts'`

## 6. Component Guidelines

### Touch Targets
Interactive icons **MUST** have `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` (up to 30).

### Forms
**ALWAYS** use `react-hook-form` with `Controller` components (`ControllerInput`, `ControllerPasswordInput`, `ControllerCheckbox`, `ControllerDateField`, `ControllerDropdownField`, `ControllerRadioGroup`, `ControllerSwitch`).

### Custom Text Component
**ALWAYS** use `import { Text } from '@/src/components/Text'` instead of `react-native`'s `Text`. It auto-maps `fontWeight` to the correct Pretendard font family.

### Shared Components Location
Components live in `src/features/<feature>/` only when they are specific to that feature. The moment a component is used (or is intended to be used) in **two or more features**, it **MUST** live in `src/components/` and be imported via `@/src/components/<Name>`.
- Do NOT create a `parking-shared/` (or similar) folder for cross-feature components — that is what `src/components/` is for.
- When adding a new component, ask: "Will this be reused?" If yes, put it in `src/components/` from the start.
- When you notice an existing feature-local component is being used by another feature, move it to `src/components/` and update imports rather than re-importing across feature folders.

### Global Modal
Use `useAppModal()` hook for alerts/errors — never create ad-hoc modals:
```typescript
const { showModal } = useAppModal();
showModal({ title: "에러", message: "문제가 발생했습니다.", buttons: [...] });
```

### Global Toast
Use `useAppToast()` hook for brief, non-blocking feedback. Use instead of `showModal` when no user action is needed:
```typescript
const { showToast } = useAppToast();
showToast({ message: "...", type: "success" }); // type: "success" | "error"
```

### Bottom Sheet Management
Use `useAppStore` to track `activeBottomSheet` and prevent overlapping sheets:
```typescript
const { activeBottomSheet, setActiveBottomSheet } = useAppStore();
// Set when opening, null when closing
```

### Keyboard Handling
Any screen/component with text inputs **MUST** ensure the keyboard does not cover the focused input. Choose the approach based on context:

| Context | Approach | Import |
|---------|----------|--------|
| Screen with scrollable content or inputs below mid-screen | `KeyboardAwareScrollView` | `react-native-keyboard-controller` |
| Bottom Sheet with inputs | `BottomSheetKeyboardAwareScrollView` | `src/components/BottomSheetKeyboardAwareScrollView` |
| Modal/overlay with a single input | `KeyboardAvoidingView` | `react-native` |
| Screen where all inputs are near the top (e.g. login) | `TouchableWithoutFeedback` + `Keyboard.dismiss` is sufficient | `react-native` |

**Standard `KeyboardAwareScrollView` props:**
```tsx
<KeyboardAwareScrollView
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={false}
  bottomOffset={40}
>
```
- `bottomOffset={40}` — keeps input visible above keyboard edge
- Add `extraKeyboardSpace={20}` for long forms (signup, edit profile)
- **Do NOT** wrap in `AuthCard fitContent` — render card styles inline inside the scroll view instead, so content can scroll when keyboard appears
- Call `Keyboard.dismiss()` before opening pickers (calendar, dropdown, bottom sheet)

## 7. Coding Standards

### TypeScript
- **STRICT MODE** — NO `any`, use `unknown` + type guards
- Prefer `interface` for objects, `type` for unions

### React Native
- `StyleSheet.create()` at bottom of file (not inline styles)
- `Platform.select()` for platform-specific code
- Functional components + hooks
- Structure: imports → interface Props → component (hooks → handlers → render) → styles

## 8. State Management

### Zustand (`src/store/`) — Global state
Stores combine state + actions in one `create()` call. Hydrate from SecureStore on app start.
```typescript
// Existing stores:
useAuthStore   // isAuthenticated, userId, hydrate(), setAuthenticated(), logout()
useAppStore    // activeBottomSheet, setActiveBottomSheet()
useNotificationStore // isEnabled, hydrate(), setEnabled()
```

### TanStack Query (`src/query/`) — Server state
- **Query keys**: Use factory in `src/query/query-keys.ts` (`queryKeys.auth.session()`, `queryKeys.user.profile(id)`, etc.)
- **Hooks**: Place in `src/query/hooks/` as `use-[domain]-queries.ts`
- **Defaults**: staleTime 5min, gcTime 30min, retry 1 (0 for 401/403/404)

#### Mutation Pattern
```typescript
export function useMyMutation() {
  const queryClient = useQueryClient();
  const { showModal } = useAppModal();

  return useMutation<ResponseType, ApiClientError, RequestType>({
    mutationFn: myApiCall,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.domain.all }),
    onError: (error) => showModal({ title: "에러", message: error.apiError?.message ?? error.message }),
  });
}
```

#### Query Pattern
```typescript
export function useMyData(id: string) {
  return useQuery<ResponseType, ApiClientError>({
    queryKey: queryKeys.domain.detail(id),
    queryFn: () => fetchMyData(id),
    enabled: !!id,
  });
}
```

### React hooks (useState, useContext) — Local component state only

## 9. Auth System

### Token Storage (`src/lib/auth-storage.ts`)
Uses `expo-secure-store`. Functions: `saveAuthTokens()`, `getAccessToken()`, `getRefreshToken()`, `clearAuthTokens()`.

### Auth Event (`src/lib/auth-event.ts`)
Decouples API client from navigation to avoid circular deps:
- `emitAuthExpired()` — API client calls on token failure
- `onAuthExpired(listener)` — root layout subscribes to force redirect to login

### Token Refresh
Handled automatically in `apiRequest()`: on 401 with `TOKEN_EXPIRED`/`TOKEN_INVALID` → refresh → retry once → force logout on failure.

## 10. Test Accounts
Credentials stored securely in Claude memory. If login fails, **ASK the user for updated credentials**.

## 11. Security
- `expo-secure-store` for tokens
- Never commit `.env` with credentials
- Sanitize inputs, avoid logging sensitive data in production

## 12. Code Formatting
- Format per `.prettierrc` after generating/modifying code

## 13. Map Marker State Logic (저장 및 완료 flow)

Each parking map screen has its own marker-state pipeline. The shared rule across all three: **final save (`저장 및 완료`) ALWAYS marks the marker as `isConfirmed` (read-only), but ONLY flips the marker color to its "updated" variant when at least one input/radio/checkbox value actually changed.** No-op saves (open sheet → press save without editing) keep the original color but lock the sheet as read-only.

`hasChanges` is computed by the **backend** in `parking-lots.service.ts → updateParkingLot()` by normalizing each submitted DTO field against the pre-mutation snapshot (boolean `Y/N/0/1`, dates `YYYY.MM.DD ↔ YYYY-MM-DD`, form-default fallbacks like `미시행`/`N`/`노외`) and short-circuiting on the first real diff. The result is returned as `result.data.isUpdated` and forwarded to the screen via `onSaveSuccess(markerId, hasChanges)`.

The screen-level handler is identical in shape across all three maps:

```typescript
const handleSaveSuccess = useCallback((markerId: string, hasChanges: boolean) => {
  if (hasChanges) {
    setLocalUpdatedIds((prev) => new Set(prev).add(markerId));
  }
  setLocalConfirmedIds((prev) => new Set(prev).add(markerId)); // always
  setSelectedMarker((prev) =>
    prev ? { ...prev, isConfirmed: true, isUpdated: hasChanges || prev.isUpdated } : prev
  );
}, []);
```

`localUpdatedIds` / `localConfirmedIds` are session-only optimistic sets that flip color/read-only state immediately without waiting for the next viewport refetch.

### 13.1. 건축물부설 / 노외 (Private Parking) — `PrivateParkingScreen.tsx` + `KakaoMap.tsx`

- **Shape**: square (`building`), triangle (`off_street`), circle (`on_street`)
- **Default color (existing, not updated)**: per-type color — `#072AC8` blue (building), `#F59E0B` amber (off_street), `#10B981` green (on_street). Building uses `White bg + blue border` outline style.
- **Updated color (after save with changes)**: solid blue `#072AC8` — `MARKER_STYLES.updated.color`. Marker is re-bucketed into `updatedArr` by `setMarkers()` based on `isUpdated`.
- **Created via app**: solid green `#10A571` — `MARKER_STYLES.createdByApp.color`. Marker bucketed into `createdByAppArr` based on `isCreatedByApp`.
- **No-op save behavior**: `isUpdated` stays `false` → marker keeps its per-type color; `isConfirmed = true` → bottom sheet hides `ActionBar` (read-only).
- **Files**: [parking-mobile/src/screens/private-parking/PrivateParkingScreen.tsx](parking-mobile/src/screens/private-parking/PrivateParkingScreen.tsx), [parking-mobile/src/features/private-parking/KakaoMap.tsx](parking-mobile/src/features/private-parking/KakaoMap.tsx)

### 13.2. 노외주차장 / Off-Street (Street Parking) — `StreetParkingScreen.tsx` + `StreetKakaoMap.tsx`

- **Shape**: triangle only (single parking type: `off_street`)
- **Default color (existing, not updated)**: white fill + red outline — `MARKER_STYLES.existing = { fill: '#FFFFFF', stroke: '#D00000', strokeWidth: 2 }`
- **Updated color (after save with changes)**: solid red `#D00000` — `MARKER_STYLES.updated = { fill: '#D00000', stroke: 'none' }`. Marker bucketed into `updatedArr` based on `isUpdated`.
- **Created via app**: solid green `#10A571` — `MARKER_STYLES.createdByApp`. Marker bucketed into `createdByAppArr` based on `isCreatedByApp`.
- **No-op save behavior**: `isUpdated` stays `false` → marker keeps the white-fill / red-outline triangle; `isConfirmed = true` → bottom sheet hides `ActionBar` (read-only).
- **Files**: [parking-mobile/src/screens/street-parking/StreetParkingScreen.tsx](parking-mobile/src/screens/street-parking/StreetParkingScreen.tsx), [parking-mobile/src/features/street-parking/StreetKakaoMap.tsx](parking-mobile/src/features/street-parking/StreetKakaoMap.tsx)

### 13.3. 노상주차장 / On-Street (Roadside Parking) — `OnStreetParkingScreen.tsx` + `OnStreetKakaoMap.tsx`

- **Shape**: circle, with optional X overlay for illegal sub-types
- **Sub-type colors (driven by `onStreetSubType`, NOT by `isUpdated` directly)**:
  - `on_street_legal_day` → `#FFDA09` yellow, no X
  - `on_street_illegal_day` → `#FFDA09` yellow, with X
  - `on_street_legal_night` → `#2D2D2D` dark, no X
  - `on_street_illegal_night` → `#2D2D2D` dark, with X
- **Save handler signature is wider**: `handleSaveSuccess(markerId, hasChanges, newSubType?, isDraft?)`. The optimistic state is split:
  - `localUpdatedSubTypes: Map<string, OnStreetSubType>` — applied immediately so the marker can switch yellow↔dark or legal↔illegal even before the next refetch.
  - `localCompletedIds: Set<string>` — analogue of `localConfirmedIds` (final save only, not draft).
- **No-op save behavior**: same rule — `isUpdated` only flips when `hasChanges = true`; sub-type only changes when the user actually picked a different sub-type. Confirmed markers become read-only.
- **Files**: [parking-mobile/src/screens/on-street-parking/OnStreetParkingScreen.tsx](parking-mobile/src/screens/on-street-parking/OnStreetParkingScreen.tsx), [parking-mobile/src/features/on-street-parking/OnStreetKakaoMap.tsx](parking-mobile/src/features/on-street-parking/OnStreetKakaoMap.tsx)

### 13.4. Cross-cutting invariants (apply to all three maps)

- **Never** infer "marker was edited" from "user opened the sheet" or "user pressed save". Always use the backend-computed `result.data.isUpdated`.
- **Never** set `isUpdated = true` optimistically without `hasChanges`. Color must reflect data reality.
- **Always** add the marker ID to `localConfirmedIds` (or equivalent) on final save, regardless of `hasChanges`, so the sheet becomes read-only on next open.
- **Draft save (`임시저장`)**: never sets `isConfirmed` and never sets `isUpdated` — marker color and editability are unchanged. Backend skips the diff comparison entirely (`if (dto.isDraft) { lot.isDraft = true }`).
- When adding a new field to the parking-lot form, verify the backend `updateParkingLot()` normalizer handles it correctly (boolean / date / default-value fallback). Otherwise no-op saves can spuriously flip `isUpdated = true`.

---

## Quick Reference

**Key Principles:**
1. Expo Router file-based routing — thin routes, logic in `src/`
2. `x-screen-id` sent via `apiRequest()` (Section 4)
3. Sync contracts: `npm run sync:contracts`
4. TypeScript strict — NO `any`
5. UI text Korean, comments English
6. Custom `Text` from `@/src/components/Text` (not RN default)
7. `iconsax-react-native` first, then custom assets
8. `react-hook-form` + Controller components
9. `StyleSheet.create()` for styles
10. `useAppModal()` for alerts, never ad-hoc modals
11. TanStack Query for server state, Zustand for global state
12. Format code per `.prettierrc`
13. Keyboard must not cover inputs — use `KeyboardAwareScrollView` (Section 6)
14. Marker color reflects backend `isUpdated`, never assume from UI actions (Section 13)

**Key Files:**
- `src/api/client.ts` — API client (apiRequest, apiUpload, apiUploadWithFields)
- `src/api-contracts/` — Synced types (read-only)
- `src/query/query-keys.ts` — Query key factory
- `src/query/hooks/` — TanStack Query hooks
- `src/store/` — Zustand stores (auth, app, notification)
- `src/components/Text.tsx` — Custom Text with Pretendard mapping
- `src/hooks/useAppModal.ts` — Global modal hook
- `src/lib/auth-storage.ts` — SecureStore token management
- `src/lib/auth-event.ts` — Auth expiry event emitter
- `constants/Paths.ts` — Route path constants
