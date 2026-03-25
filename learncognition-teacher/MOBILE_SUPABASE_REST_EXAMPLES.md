# LearnCognition Mobile Supabase REST Examples

This document provides concrete Supabase REST requests for each mobile screen in the Unity student app flow.

## 1. Environment Variables

Use these values in your mobile app config:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
REST_BASE=https://YOUR_PROJECT.supabase.co/rest/v1
```

Standard headers for all requests:

```http
apikey: YOUR_ANON_KEY
authorization: Bearer YOUR_ANON_KEY
```

For POST requests where you want returned row data:

```http
prefer: return=representation
content-type: application/json
```

## 2. Screen: Deep Link Entry (no REST call)

Input deep link format:

```text
learncognition://module/{module_uuid}
```

Extract module UUID from the link, then use the UUID in the requests below.

## 3. Screen: Module Loading

### 3.1 Get published module by id

Request:

```bash
curl "${REST_BASE}/modules?id=eq.11111111-2222-3333-4444-555555555555&status=eq.published&select=id,title,description,is_sequential,status&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Expected response:

```json
[
  {
    "id": "11111111-2222-3333-4444-555555555555",
    "title": "Find Classroom Shapes",
    "description": "Look around and find shape examples.",
    "is_sequential": true,
    "status": "published"
  }
]
```

### 3.2 Get module objects ordered for student flow

Request:

```bash
curl "${REST_BASE}/objects?module_id=eq.11111111-2222-3333-4444-555555555555&select=id,module_id,name,description,image_url,audio_url,order_index&order=order_index.asc" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Expected response:

```json
[
  {
    "id": "aaaaaaa1-2222-3333-4444-555555555555",
    "module_id": "11111111-2222-3333-4444-555555555555",
    "name": "Circle",
    "description": "Find something round.",
    "image_url": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/object-images/circle.png",
    "audio_url": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/object-audio/circle.mp3",
    "order_index": 0
  }
]
```

## 4. Screen: Student Name Entry

### Start a session

Request:

```bash
curl "${REST_BASE}/student_sessions" \
  -X POST \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "content-type: application/json" \
  -H "prefer: return=representation" \
  -d '{
    "module_id": "11111111-2222-3333-4444-555555555555",
    "student_name": "Alex",
    "device_info": "android-14-pixel7"
  }'
```

Expected response:

```json
[
  {
    "id": "99999999-2222-3333-4444-555555555555",
    "module_id": "11111111-2222-3333-4444-555555555555",
    "student_name": "Alex",
    "started_at": "2026-03-16T10:20:30.000Z",
    "completed_at": null,
    "device_info": "android-14-pixel7"
  }
]
```

Save the returned session id for discovery logging.

## 5. Screen: AR Discovery Loop

### Log one discovered object

Request:

```bash
curl "${REST_BASE}/object_discoveries" \
  -X POST \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "content-type: application/json" \
  -H "prefer: return=representation" \
  -d '{
    "session_id": "99999999-2222-3333-4444-555555555555",
    "object_id": "aaaaaaa1-2222-3333-4444-555555555555",
    "attempts": 1
  }'
```

Expected response:

```json
[
  {
    "id": "ddddddd1-2222-3333-4444-555555555555",
    "session_id": "99999999-2222-3333-4444-555555555555",
    "object_id": "aaaaaaa1-2222-3333-4444-555555555555",
    "discovered_at": "2026-03-16T10:23:14.000Z",
    "attempts": 1
  }
]
```

Repeat this request for each successful discovery.

## 6. Screen: Session Summary / Finish

### Mark session complete

Request:

```bash
curl "${REST_BASE}/student_sessions?id=eq.99999999-2222-3333-4444-555555555555" \
  -X PATCH \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "content-type: application/json" \
  -d '{
    "completed_at": "2026-03-16T10:28:00.000Z"
  }'
```

Expected response:

- HTTP 204 No Content (default)

## 7. Screen: Background Sync (offline replay)

When connectivity returns, replay queued requests in this order:

1. Start session (if not yet created).
2. Discovery events in event-time order.
3. Complete session update.

Recommended idempotency strategy:

- Add local idempotency keys in the mobile queue.
- Before posting a queued discovery, check if a matching row already exists for session_id + object_id + timestamp bucket in your local replay logic.

## 8. Optional Verification Calls

### Count discoveries for one session

```bash
curl "${REST_BASE}/object_discoveries?session_id=eq.99999999-2222-3333-4444-555555555555&select=id" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Read session after completion

```bash
curl "${REST_BASE}/student_sessions?id=eq.99999999-2222-3333-4444-555555555555&select=id,module_id,student_name,started_at,completed_at" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "authorization: Bearer ${SUPABASE_ANON_KEY}"
```

## 9. Required RLS Reminder

For the mobile student app to read content anonymously, ensure these select policies exist:

```sql
create policy "Anon read published modules" on public.modules
  for select
  using (status = 'published');

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

Without these, module and object GET requests will fail for anon clients.
