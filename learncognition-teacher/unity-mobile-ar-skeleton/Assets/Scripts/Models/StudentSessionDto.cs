using System;

namespace LearnCognition.MobileAR.Models
{
    [Serializable]
    public class StudentSessionDto
    {
        public string id;
        public string module_id;
        public string student_name;
        public string started_at;
        public string completed_at;
        public string device_info;
    }
}
