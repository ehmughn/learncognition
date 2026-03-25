using System.Threading.Tasks;
using LearnCognition.MobileAR.Services;
using LearnCognition.MobileAR.Services.Supabase;
using UnityEngine;

namespace LearnCognition.MobileAR.Core
{
    public class AppBootstrap : MonoBehaviour
    {
        [Header("Supabase")]
        [SerializeField] private SupabaseConfig supabaseConfig;

        [Header("Debug")]
        [SerializeField] private string startupDeepLink = "";

        private AppStateMachine stateMachine;
        private DeepLinkService deepLinkService;
        private SupabaseService supabaseService;
        private LocalCacheService localCacheService;
        private SessionService sessionService;
        private ARDiscoveryService arDiscoveryService;

        public AppStateMachine StateMachine => stateMachine;
        public SupabaseService SupabaseService => supabaseService;
        public SessionService SessionService => sessionService;
        public ARDiscoveryService ARDiscoveryService => arDiscoveryService;

        private async void Start()
        {
            stateMachine = new AppStateMachine();
            deepLinkService = new DeepLinkService();
            supabaseService = new SupabaseService(supabaseConfig);
            localCacheService = new LocalCacheService();
            sessionService = new SessionService(supabaseService, localCacheService);
            arDiscoveryService = new ARDiscoveryService();

            stateMachine.TransitionTo(AppState.AwaitDeepLink);

            if (!string.IsNullOrWhiteSpace(startupDeepLink))
            {
                await HandleDeepLinkAsync(startupDeepLink);
            }
        }

        public async Task HandleDeepLinkAsync(string deepLink)
        {
            if (!deepLinkService.TryGetModuleId(deepLink, out var moduleId))
            {
                stateMachine.TransitionTo(AppState.Error);
                Debug.LogWarning("Invalid deep link: " + deepLink);
                return;
            }

            stateMachine.TransitionTo(AppState.LoadModule);
            Debug.Log("Deep link accepted. Module id: " + moduleId);
            await Task.CompletedTask;
        }
    }
}
