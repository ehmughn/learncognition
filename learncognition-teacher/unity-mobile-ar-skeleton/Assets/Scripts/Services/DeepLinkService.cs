using System;

namespace LearnCognition.MobileAR.Services
{
    public sealed class DeepLinkService
    {
        public bool TryGetModuleId(string deepLink, out string moduleId)
        {
            moduleId = string.Empty;

            if (string.IsNullOrWhiteSpace(deepLink))
            {
                return false;
            }

            if (!Uri.TryCreate(deepLink, UriKind.Absolute, out var uri))
            {
                return false;
            }

            if (!string.Equals(uri.Scheme, "learncognition", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(uri.Host, "module", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var possibleId = uri.AbsolutePath.Trim('/');
            if (!Guid.TryParse(possibleId, out _))
            {
                return false;
            }

            moduleId = possibleId;
            return true;
        }
    }
}
