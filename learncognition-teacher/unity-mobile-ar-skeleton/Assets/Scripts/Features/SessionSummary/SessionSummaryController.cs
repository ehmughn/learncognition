using System.Threading;
using System.Threading.Tasks;
using LearnCognition.MobileAR.Services;

namespace LearnCognition.MobileAR.Features.SessionSummary
{
    public sealed class SessionSummaryController
    {
        private readonly SessionService sessionService;

        public SessionSummaryController(SessionService sessionService)
        {
            this.sessionService = sessionService;
        }

        public async Task<bool> CompleteAndSyncAsync(CancellationToken cancellationToken = default)
        {
            var completed = await sessionService.CompleteSessionAsync(cancellationToken);
            await sessionService.SyncPendingEventsAsync(cancellationToken);
            return completed;
        }

        public string BuildSummaryMessage(string studentName, int discoveredCount, int totalObjects)
        {
            if (discoveredCount >= totalObjects && totalObjects > 0)
            {
                return "Great work, " + studentName + ". You found all objects.";
            }

            return "Nice effort, " + studentName + ". You found " + discoveredCount + " of " + totalObjects + " objects.";
        }
    }
}
