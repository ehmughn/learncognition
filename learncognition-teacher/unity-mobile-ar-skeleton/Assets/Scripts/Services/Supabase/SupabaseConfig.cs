using System;

namespace LearnCognition.MobileAR.Services.Supabase
{
    [Serializable]
    public class SupabaseConfig
    {
        public string BaseUrl;
        public string AnonKey;
        public string RestPath = "/rest/v1";
    }
}
