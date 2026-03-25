using System;

namespace LearnCognition.MobileAR.Models
{
    [Serializable]
    public class ModuleDto
    {
        public string id;
        public string title;
        public string description;
        public bool is_sequential;
        public string status;
    }
}
