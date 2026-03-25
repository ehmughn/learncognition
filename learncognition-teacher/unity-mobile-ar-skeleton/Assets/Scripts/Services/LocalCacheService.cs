using System;
using System.Collections.Generic;
using UnityEngine;

namespace LearnCognition.MobileAR.Services
{
    [Serializable]
    public class PendingEvent
    {
        public string idempotency_key;
        public string event_type;
        public string payload_json;
        public long created_at_unix;
    }

    [Serializable]
    internal class PendingEventWrapper
    {
        public List<PendingEvent> items = new List<PendingEvent>();
    }

    public class LocalCacheService
    {
        private const string PendingEventsKey = "learncognition.pending_events";

        public void SaveCurrentModuleJson(string moduleJson)
        {
            PlayerPrefs.SetString("learncognition.current_module_json", moduleJson ?? string.Empty);
            PlayerPrefs.Save();
        }

        public string LoadCurrentModuleJson()
        {
            return PlayerPrefs.GetString("learncognition.current_module_json", string.Empty);
        }

        public void Enqueue(PendingEvent pendingEvent)
        {
            var wrapper = LoadPendingEventsInternal();
            wrapper.items.Add(pendingEvent);
            SavePendingEventsInternal(wrapper);
        }

        public IReadOnlyList<PendingEvent> GetPendingEvents()
        {
            return LoadPendingEventsInternal().items;
        }

        public void RemoveByIdempotencyKey(string idempotencyKey)
        {
            var wrapper = LoadPendingEventsInternal();
            wrapper.items.RemoveAll(item => item.idempotency_key == idempotencyKey);
            SavePendingEventsInternal(wrapper);
        }

        private PendingEventWrapper LoadPendingEventsInternal()
        {
            var raw = PlayerPrefs.GetString(PendingEventsKey, string.Empty);
            if (string.IsNullOrWhiteSpace(raw))
            {
                return new PendingEventWrapper();
            }

            try
            {
                var parsed = JsonUtility.FromJson<PendingEventWrapper>(raw);
                return parsed ?? new PendingEventWrapper();
            }
            catch
            {
                return new PendingEventWrapper();
            }
        }

        private void SavePendingEventsInternal(PendingEventWrapper wrapper)
        {
            var raw = JsonUtility.ToJson(wrapper);
            PlayerPrefs.SetString(PendingEventsKey, raw);
            PlayerPrefs.Save();
        }
    }
}
