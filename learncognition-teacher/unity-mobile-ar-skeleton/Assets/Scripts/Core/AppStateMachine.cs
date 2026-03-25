using System;

namespace LearnCognition.MobileAR.Core
{
    public sealed class AppStateMachine
    {
        public AppState Current { get; private set; } = AppState.Boot;

        public event Action<AppState, AppState> StateChanged;

        public void TransitionTo(AppState next)
        {
            if (Current == next)
            {
                return;
            }

            var previous = Current;
            Current = next;
            StateChanged?.Invoke(previous, next);
        }
    }
}
