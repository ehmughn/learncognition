using System;
using System.Collections.Generic;
using LearnCognition.MobileAR.Models;

namespace LearnCognition.MobileAR.Services
{
    public class ARDiscoveryService
    {
        private readonly List<ObjectDto> objects = new List<ObjectDto>();
        private readonly Dictionary<string, int> attemptsByObjectId = new Dictionary<string, int>();
        private bool isSequential;
        private int currentIndex;

        public event Action<ObjectDto> TargetChanged;
        public event Action<ObjectDto, int> TargetConfirmed;

        public void LoadTargets(IReadOnlyList<ObjectDto> orderedObjects, bool sequential)
        {
            objects.Clear();
            attemptsByObjectId.Clear();
            currentIndex = 0;
            isSequential = sequential;

            if (orderedObjects == null)
            {
                return;
            }

            objects.AddRange(orderedObjects);

            if (objects.Count > 0)
            {
                TargetChanged?.Invoke(objects[currentIndex]);
            }
        }

        public ObjectDto GetCurrentTarget()
        {
            if (objects.Count == 0 || currentIndex >= objects.Count)
            {
                return null;
            }

            return objects[currentIndex];
        }

        public bool ConfirmCurrentTargetFound()
        {
            var target = GetCurrentTarget();
            if (target == null)
            {
                return false;
            }

            if (!attemptsByObjectId.ContainsKey(target.id))
            {
                attemptsByObjectId[target.id] = 0;
            }

            attemptsByObjectId[target.id] += 1;
            TargetConfirmed?.Invoke(target, attemptsByObjectId[target.id]);

            if (isSequential)
            {
                currentIndex += 1;
                var next = GetCurrentTarget();
                if (next != null)
                {
                    TargetChanged?.Invoke(next);
                }
            }

            return true;
        }

        public bool IsFinished()
        {
            if (!isSequential)
            {
                return false;
            }

            return currentIndex >= objects.Count;
        }
    }
}
