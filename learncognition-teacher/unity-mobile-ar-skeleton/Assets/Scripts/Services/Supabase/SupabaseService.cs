using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine.Networking;

namespace LearnCognition.MobileAR.Services.Supabase
{
    public class SupabaseService
    {
        private readonly SupabaseConfig config;

        public SupabaseService(SupabaseConfig config)
        {
            this.config = config;
        }

        private string RestBaseUrl => config.BaseUrl.TrimEnd('/') + config.RestPath;

        public async Task<string> GetPublishedModuleJsonAsync(string moduleId, CancellationToken cancellationToken = default)
        {
            var url = RestBaseUrl
                      + "/modules?id=eq."
                      + EscapeUrl(moduleId)
                      + "&status=eq.published&select=id,title,description,is_sequential,status&limit=1";

            using var request = CreateRequest(url, UnityWebRequest.kHttpVerbGET);
            return await SendAsync(request, cancellationToken);
        }

        public async Task<string> GetModuleObjectsJsonAsync(string moduleId, CancellationToken cancellationToken = default)
        {
            var url = RestBaseUrl
                      + "/objects?module_id=eq."
                      + EscapeUrl(moduleId)
                      + "&select=id,module_id,name,description,image_url,audio_url,order_index&order=order_index.asc";

            using var request = CreateRequest(url, UnityWebRequest.kHttpVerbGET);
            return await SendAsync(request, cancellationToken);
        }

        public async Task<string> CreateStudentSessionJsonAsync(
            string moduleId,
            string studentName,
            string deviceInfo,
            CancellationToken cancellationToken = default)
        {
            var url = RestBaseUrl + "/student_sessions";
            var payload = "{\"module_id\":\"" + EscapeJson(moduleId)
                          + "\",\"student_name\":\"" + EscapeJson(studentName)
                          + "\",\"device_info\":\"" + EscapeJson(deviceInfo)
                          + "\"}";

            using var request = CreateRequest(url, UnityWebRequest.kHttpVerbPOST, payload, true);
            return await SendAsync(request, cancellationToken);
        }

        public async Task<string> CreateObjectDiscoveryJsonAsync(
            string sessionId,
            string objectId,
            int attempts,
            CancellationToken cancellationToken = default)
        {
            var url = RestBaseUrl + "/object_discoveries";
            var payload = "{\"session_id\":\"" + EscapeJson(sessionId)
                          + "\",\"object_id\":\"" + EscapeJson(objectId)
                          + "\",\"attempts\":" + attempts + "}";

            using var request = CreateRequest(url, UnityWebRequest.kHttpVerbPOST, payload, true);
            return await SendAsync(request, cancellationToken);
        }

        public async Task CompleteStudentSessionAsync(string sessionId, CancellationToken cancellationToken = default)
        {
            var url = RestBaseUrl + "/student_sessions?id=eq." + EscapeUrl(sessionId);
            var payload = "{\"completed_at\":\"" + DateTime.UtcNow.ToString("o") + "\"}";

            using var request = CreateRequest(url, "PATCH", payload);
            await SendAsync(request, cancellationToken);
        }

        private UnityWebRequest CreateRequest(string url, string method, string jsonBody = null, bool returnRepresentation = false)
        {
            var request = new UnityWebRequest(url, method)
            {
                downloadHandler = new DownloadHandlerBuffer()
            };

            if (!string.IsNullOrWhiteSpace(jsonBody))
            {
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody));
                request.SetRequestHeader("Content-Type", "application/json");
            }

            request.SetRequestHeader("apikey", config.AnonKey);
            request.SetRequestHeader("Authorization", "Bearer " + config.AnonKey);

            if (returnRepresentation)
            {
                request.SetRequestHeader("Prefer", "return=representation");
            }

            return request;
        }

        private static async Task<string> SendAsync(UnityWebRequest request, CancellationToken cancellationToken)
        {
            var operation = request.SendWebRequest();

            while (!operation.isDone)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    request.Abort();
                    cancellationToken.ThrowIfCancellationRequested();
                }

                await Task.Yield();
            }

            if (request.result != UnityWebRequest.Result.Success)
            {
                throw new InvalidOperationException("Supabase request failed: " + request.error + " | " + request.url);
            }

            return request.downloadHandler.text;
        }

        private static string EscapeJson(string value)
        {
            if (value == null)
            {
                return string.Empty;
            }

            return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }

        private static string EscapeUrl(string value)
        {
            return UnityWebRequest.EscapeURL(value ?? string.Empty);
        }
    }
}
