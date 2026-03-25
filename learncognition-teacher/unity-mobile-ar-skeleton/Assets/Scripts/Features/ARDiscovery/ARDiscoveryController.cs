using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LearnCognition.MobileAR.Models;
using LearnCognition.MobileAR.Services;

namespace LearnCognition.MobileAR.Features.ARDiscovery
{
    public sealed class ARDiscoveryController
    {
        private readonly ARDiscoveryService arDiscoveryService;
        private readonly SessionService sessionService;

        public ARDiscoveryController(ARDiscoveryService arDiscoveryService, SessionService sessionService)
        {
            this.arDiscoveryService = arDiscoveryService;
            this.sessionService = sessionService;
        }

        public void Begin(IReadOnlyList<ObjectDto> orderedObjects, bool isSequential)
        {
            arDiscoveryService.LoadTargets(orderedObjects, isSequential);
        }

        public ObjectDto CurrentTarget()
        {
            return arDiscoveryService.GetCurrentTarget();
        }

        public async Task<bool> ConfirmFoundAsync(CancellationToken cancellationToken = default)
        {
            var target = arDiscoveryService.GetCurrentTarget();
            if (target == null)
            {
                return false;
            }

            var moved = arDiscoveryService.ConfirmCurrentTargetFound();
            if (!moved)
            {
                return false;
            }

            return await sessionService.LogDiscoveryAsync(target.id, 1, cancellationToken);
        }

        public bool IsSequentialFlowFinished()
        {
            return arDiscoveryService.IsFinished();
        }
    }
}
