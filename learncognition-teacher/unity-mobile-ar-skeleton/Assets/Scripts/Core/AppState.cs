namespace LearnCognition.MobileAR.Core
{
    public enum AppState
    {
        Boot,
        AwaitDeepLink,
        LoadModule,
        EnterStudentName,
        StartSession,
        ARDiscovering,
        ModuleComplete,
        SyncPendingEvents,
        Summary,
        Error
    }
}
