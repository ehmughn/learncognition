namespace LearnCognition.MobileAR.Features.StudentIdentity
{
    public sealed class StudentIdentityController
    {
        public bool TryNormalizeName(string rawName, out string normalizedName)
        {
            normalizedName = (rawName ?? string.Empty).Trim();

            if (normalizedName.Length < 2)
            {
                return false;
            }

            if (normalizedName.Length > 60)
            {
                normalizedName = normalizedName.Substring(0, 60);
            }

            return true;
        }
    }
}
