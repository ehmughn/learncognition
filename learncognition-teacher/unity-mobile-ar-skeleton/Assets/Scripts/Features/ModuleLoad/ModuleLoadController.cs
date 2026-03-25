using System;
using System.Threading;
using System.Threading.Tasks;
using LearnCognition.MobileAR.Services;
using LearnCognition.MobileAR.Services.Supabase;
using UnityEngine;

namespace LearnCognition.MobileAR.Features.ModuleLoad
{
    public sealed class ModuleLoadController
    {
        private readonly DeepLinkService deepLinkService;
        private readonly SupabaseService supabaseService;
        private readonly LocalCacheService localCacheService;

        public ModuleLoadController(
            DeepLinkService deepLinkService,
            SupabaseService supabaseService,
            LocalCacheService localCacheService)
        {
            this.deepLinkService = deepLinkService;
            this.supabaseService = supabaseService;
            this.localCacheService = localCacheService;
        }

        public async Task<ModuleLoadResult> LoadFromDeepLinkAsync(string deepLink, CancellationToken cancellationToken = default)
        {
            if (!deepLinkService.TryGetModuleId(deepLink, out var moduleId))
            {
                return ModuleLoadResult.Failure("Invalid deep link.");
            }

            try
            {
                var moduleJson = await supabaseService.GetPublishedModuleJsonAsync(moduleId, cancellationToken);
                var objectsJson = await supabaseService.GetModuleObjectsJsonAsync(moduleId, cancellationToken);

                localCacheService.SaveCurrentModuleJson(moduleJson + "\n" + objectsJson);

                return ModuleLoadResult.Success(moduleId, moduleJson, objectsJson);
            }
            catch (Exception ex)
            {
                Debug.LogWarning("Falling back to cached module data. Reason: " + ex.Message);
                var cached = localCacheService.LoadCurrentModuleJson();

                if (!string.IsNullOrWhiteSpace(cached))
                {
                    return ModuleLoadResult.Success(moduleId, cached, string.Empty);
                }

                return ModuleLoadResult.Failure("Unable to load module from network or cache.");
            }
        }
    }

    public sealed class ModuleLoadResult
    {
        public bool IsSuccess { get; private set; }
        public string ModuleId { get; private set; }
        public string ModuleJson { get; private set; }
        public string ObjectsJson { get; private set; }
        public string ErrorMessage { get; private set; }

        public static ModuleLoadResult Success(string moduleId, string moduleJson, string objectsJson)
        {
            return new ModuleLoadResult
            {
                IsSuccess = true,
                ModuleId = moduleId,
                ModuleJson = moduleJson,
                ObjectsJson = objectsJson
            };
        }

        public static ModuleLoadResult Failure(string errorMessage)
        {
            return new ModuleLoadResult
            {
                IsSuccess = false,
                ErrorMessage = errorMessage
            };
        }
    }
}
