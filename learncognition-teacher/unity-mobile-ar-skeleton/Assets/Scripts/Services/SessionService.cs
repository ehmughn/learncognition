using System;
using System.Threading;
using System.Threading.Tasks;
using LearnCognition.MobileAR.Services.Supabase;

namespace LearnCognition.MobileAR.Services
{
    public class SessionService
    {
        private readonly SupabaseService supabaseService;
        private readonly LocalCacheService localCacheService;

        public string CurrentSessionId { get; private set; }

        public SessionService(SupabaseService supabaseService, LocalCacheService localCacheService)
        {
            this.supabaseService = supabaseService;
            this.localCacheService = localCacheService;
        }

        public async Task<bool> StartSessionAsync(
            string moduleId,
            string studentName,
            string deviceInfo,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var responseJson = await supabaseService.CreateStudentSessionJsonAsync(moduleId, studentName, deviceInfo, cancellationToken);
                CurrentSessionId = TryExtractFirstId(responseJson);
                return !string.IsNullOrWhiteSpace(CurrentSessionId);
            }
            catch
            {
                localCacheService.Enqueue(new PendingEvent
                {
                    idempotency_key = Guid.NewGuid().ToString(),
                    event_type = "start_session",
                    payload_json = "{\"module_id\":\"" + moduleId + "\",\"student_name\":\"" + studentName + "\",\"device_info\":\"" + deviceInfo + "\"}",
                    created_at_unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                });

                return false;
            }
        }

        public async Task<bool> LogDiscoveryAsync(string objectId, int attempts, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(CurrentSessionId))
            {
                return false;
            }

            try
            {
                await supabaseService.CreateObjectDiscoveryJsonAsync(CurrentSessionId, objectId, attempts, cancellationToken);
                return true;
            }
            catch
            {
                localCacheService.Enqueue(new PendingEvent
                {
                    idempotency_key = Guid.NewGuid().ToString(),
                    event_type = "log_discovery",
                    payload_json = "{\"session_id\":\"" + CurrentSessionId + "\",\"object_id\":\"" + objectId + "\",\"attempts\":" + attempts + "}",
                    created_at_unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                });

                return false;
            }
        }

        public async Task<bool> CompleteSessionAsync(CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(CurrentSessionId))
            {
                return false;
            }

            try
            {
                await supabaseService.CompleteStudentSessionAsync(CurrentSessionId, cancellationToken);
                return true;
            }
            catch
            {
                localCacheService.Enqueue(new PendingEvent
                {
                    idempotency_key = Guid.NewGuid().ToString(),
                    event_type = "complete_session",
                    payload_json = "{\"session_id\":\"" + CurrentSessionId + "\"}",
                    created_at_unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                });

                return false;
            }
        }

        public async Task SyncPendingEventsAsync(CancellationToken cancellationToken = default)
        {
            // Skeleton behavior: iterate and remove placeholders.
            // Replace this with strong typed replay logic per event_type.
            var pending = localCacheService.GetPendingEvents();
            foreach (var pendingEvent in pending)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // TODO: parse payload_json and replay each event to Supabase.
                await Task.Yield();
                localCacheService.RemoveByIdempotencyKey(pendingEvent.idempotency_key);
            }
        }

        private static string TryExtractFirstId(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return string.Empty;
            }

            const string marker = "\"id\":\"";
            var start = json.IndexOf(marker, StringComparison.Ordinal);
            if (start < 0)
            {
                return string.Empty;
            }

            start += marker.Length;
            var end = json.IndexOf('"', start);
            if (end < 0)
            {
                return string.Empty;
            }

            return json.Substring(start, end - start);
        }
    }
}
