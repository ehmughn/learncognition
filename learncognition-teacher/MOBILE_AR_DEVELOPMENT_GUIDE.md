# LearnCognition Mobile AR App Development Guide

This guide describes how to build the student-side mobile AR app that pairs with the existing teacher portal.

## 1. Product Goal

Build a student app where:

1. A student scans a teacher-generated QR code.
2. The app resolves a module from the QR data.
3. The student enters a name (no account required).
4. The app runs an AR scavenger flow to discover module objects.
5. The app logs session and discovery analytics back to Supabase.

The app should prioritize reliability and accessibility for SPED learners over advanced visuals.

## 2. Current Backend Contract (Already Available)

From the existing Supabase schema, the mobile app should use:

- `modules`
- `objects`
- `student_sessions`
- `object_discoveries`

Teacher QR deep links currently use this format:

- `learncognition://module/{module_id}`

## 3. Important Backend Update Before Mobile Development

Current RLS allows anonymous inserts for `student_sessions` and `object_discoveries`, but anonymous reads for module content are not yet enabled.

Without read policies, the student app cannot load module/object data.

Apply this SQL before mobile implementation:

```sql
-- Allow anonymous read of published modules only
create policy "Anon read published modules" on public.modules
  for select
  using (status = 'published');

-- Allow anonymous read of objects only when parent module is published
create policy "Anon read objects for published modules" on public.objects
  for select
  using (
    exists (
      select 1
      from public.modules m
      where m.id = objects.module_id
        and m.status = 'published'
    )
  );
```

Optional hardening (recommended later):

- Use signed QR payloads (JWT or signed token) with short expiry.
- Resolve module content through a Supabase Edge Function instead of direct table reads.

## 4. Recommended Technical Stack (Mobile)

- Unity 2022 LTS or newer
- AR Foundation
- ARKit XR Plugin (iOS)
- ARCore XR Plugin (Android)
- TextMeshPro
- Unity Input System
- UnityWebRequest (or Supabase C# SDK)

Optional libraries:

- ZXing for in-app QR scanning if you do not deep-link from external scanner.
- Addressables for local fallback assets.

## 5. Mobile App Architecture

Use a service-driven architecture inside Unity:

- `DeepLinkService`: Parse `learncognition://module/{id}`
- `SupabaseService`: Read module/object data, write sessions/discoveries
- `SessionService`: Start session, track completion, retry failed writes
- `ARDiscoveryService`: Handle object detection/discovery logic
- `AccessibilityService`: Text size, narration playback, simplified prompts
- `LocalCacheService`: Cache module + queue analytics when offline

Suggested folders:

```text
Assets/
  Scripts/
    Core/
      AppBootstrap.cs
      AppStateMachine.cs
    Services/
      DeepLinkService.cs
      SupabaseService.cs
      SessionService.cs
      LocalCacheService.cs
    Features/
      ModuleLoad/
      StudentIdentity/
      ARDiscovery/
      SessionSummary/
    UI/
      Screens/
      Components/
    Models/
      ModuleDto.cs
      ObjectDto.cs
      SessionDto.cs
  Prefabs/
  Scenes/
    Boot.unity
    Home.unity
    Module.unity
    ARSession.unity
    Summary.unity
```

## 6. End-to-End Student Flow

1. App opens from QR deep link.
2. Parse `module_id`.
3. Fetch module where `id = module_id` and `status = published`.
4. Fetch objects ordered by `order_index`.
5. Ask for student name.
6. Create `student_sessions` row.
7. Run discovery loop:
   - Show target prompt
   - Detect or confirm object found
   - Insert `object_discoveries` row
8. Mark session `completed_at` when module finishes.
9. Show a positive completion summary.

State machine (recommended):

```text
Boot -> AwaitDeepLink -> LoadModule -> EnterStudentName -> StartSession
-> ARDiscovering -> ModuleComplete -> SyncPendingEvents -> Summary
```

## 7. Supabase Integration Contract

### Read module

- Table: `modules`
- Filter: `id == module_id`, `status == published`
- Fields: `id, title, description, is_sequential`

### Read objects

- Table: `objects`
- Filter: `module_id == module_id`
- Sort: `order_index asc`
- Fields: `id, name, description, image_url, audio_url, order_index`

### Start session

Insert into `student_sessions`:

- `module_id`
- `student_name`
- `device_info`

### Log discovery

Insert into `object_discoveries`:

- `session_id`
- `object_id`
- `attempts`

### Complete session

Update `student_sessions` by id:

- `completed_at = now()`

## 8. AR Discovery Strategy (Practical Rollout)

Do not start with fully automatic object recognition. Roll out in 3 levels:

### Level 1 (MVP)

- Guided prompt + visual hint + manual "I found it" confirmation.
- Use this first to validate classroom workflow and analytics.

### Level 2

- Add assisted validation (image similarity or marker-based checks).
- Keep manual override for teacher reliability.

### Level 3

- Add full automatic detection for supported objects only.
- Keep fallback path if confidence is below threshold.

This staged approach avoids classroom failures and reduces frustration for SPED learners.

## 9. SPED-Centered UX Requirements

- Large tap targets (minimum 48 px).
- Short, concrete instructions.
- Optional audio narration on each screen.
- Reduced visual noise during AR mode.
- Positive reinforcement after each discovery.
- Consistent icon + color meanings across screens.
- Never block progress on one failed recognition attempt.

## 10. Offline and Failure Handling

Required behaviors:

- Cache the currently loaded module and objects.
- Queue `student_sessions` and `object_discoveries` writes if offline.
- Retry queued events with exponential backoff.
- Show simple "Saved, will sync soon" feedback.

Use an idempotency key per queued write to avoid duplicate rows on retries.

## 11. Security Guidelines

- Use only Supabase anon key in the mobile app.
- Never embed service role key in Unity.
- Keep module reads scoped to `published` content.
- Avoid exposing hidden teacher-only metadata in responses.
- If stricter control is needed, move student reads to an Edge Function.

## 12. Suggested Sprint Plan (6 Sprints)

### Sprint 1: Foundation

- Unity project setup (AR Foundation + scenes)
- Deep link parser
- Supabase client wrapper
- Basic UI shell

### Sprint 2: Module Loading

- Module/object fetch from Supabase
- Student name capture
- Start session insert
- Error states and retries

### Sprint 3: AR Loop MVP

- Prompt presentation
- Manual discovery confirmation
- Discovery inserts
- Sequential vs non-sequential module logic

### Sprint 4: Accessibility + UX

- Audio narration playback
- Bigger controls and simplified prompts
- Positive reinforcement UI
- Teacher pilot feedback integration

### Sprint 5: Robustness

- Offline queue + sync
- Crash recovery for active session
- Analytics reliability checks

### Sprint 6: Release Hardening

- Device matrix testing (Android + iOS)
- Performance tuning for low-end devices
- Store assets, privacy text, release candidate

## 13. Test Matrix

Cover these cases before classroom rollout:

- Deep link opens correct module
- Invalid module id handling
- Published vs draft module access
- Session start succeeds and retries
- Discovery logs once per success event
- Completed session updates correctly
- Offline mode queues and syncs later
- AR mode stable for at least 10 minutes
- Audio narration always interruptible

## 14. Definition of Done (Mobile v1)

Mobile v1 is done when:

1. Students can complete a module from QR scan to summary without teacher intervention.
2. Teacher portal analytics show session and discovery data for completed runs.
3. App remains usable on temporary connectivity loss.
4. Accessibility checks pass for SPED classroom usage.

## 15. Implementation Notes for the Existing Web Team

To keep both apps aligned:

- Treat `module_id` in QR as the only cross-app contract key.
- Keep object ordering authoritative via `order_index`.
- Do not change analytics table shape without versioning both apps.
- Document any schema changes in a shared changelog.

---

If you want, the next step can be a second document with concrete Unity class skeletons and API request examples per screen.
