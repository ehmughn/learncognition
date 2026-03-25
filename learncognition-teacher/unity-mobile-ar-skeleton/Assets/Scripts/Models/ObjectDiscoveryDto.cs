using System;

namespace LearnCognition.MobileAR.Models
{
    [Serializable]
    public class ObjectDiscoveryDto
    {
        public string id;
        public string session_id;
        public string object_id;
        public int attempts;
        public string discovered_at;
    }
}
