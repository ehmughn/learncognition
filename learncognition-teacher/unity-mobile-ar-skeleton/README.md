# LearnCognition Unity Mobile AR Skeleton

This folder is a starter scaffold for the student mobile app described in MOBILE_AR_DEVELOPMENT_GUIDE.md.

## Purpose

- Provide class and folder skeletons for core app flow.
- Map Unity code structure to Supabase-backed module/session/discovery flow.
- Offer implementation stubs that your mobile team can fill in.

## Included

- Core app state machine and bootstrap classes
- Service stubs for deep links, Supabase API calls, session tracking, and local cache
- Feature controllers for module load, student name entry, AR discovery, and summary
- DTO models used across services and UI

## How to use

1. Create or open your Unity project.
2. Copy this folder structure under Assets/Scripts (or merge carefully).
3. Add your Supabase URL and anon key in SupabaseConfig in inspector.
4. Implement JSON parsing (recommended: Newtonsoft.Json for Unity).
5. Wire screen prefabs to feature controller events.
6. Replace placeholder AR discovery logic with AR Foundation implementation.

## Notes

- This is intentionally a skeleton, not a full production implementation.
- The HTTP methods and endpoints follow your current Supabase schema.
- Before mobile reads, ensure RLS allows anonymous select for published modules and their objects.
