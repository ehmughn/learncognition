using System;

namespace LearnCognition.MobileAR.Models
{
    [Serializable]
    public class ObjectDto
    {
        public string id;
        public string module_id;
        public string name;
        public string description;
        public string image_url;
        public string audio_url;
        public int order_index;
    }
}
