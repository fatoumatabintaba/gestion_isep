<div class="dashboard-header bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <div class="welcome-header">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Bonjour, Admin</h1>
        <p class="text-gray-600 dark:text-gray-300 text-base mb-4">Bienvenue dans votre espace d'administration ISEP THiÈS</p>
        <div class="date-time">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ $currentDate }} • {{ $currentTime }}</span>
        </div>
    </div>
</div>

<style>
.dashboard-header {
    background: #ffffff;
    border: 1px solid #e5e7eb;
}

.dark .dashboard-header {
    background: #1f2937;
    border-color: #374151;
}

.welcome-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: #111827;
}

.dark .welcome-header h1 {
    color: #f9fafb;
}

.welcome-header p {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 1rem;
}

.dark .welcome-header p {
    color: #d1d5db;
}

.date-time span {
    font-size: 0.875rem;
    color: #9ca3af;
}

.dark .date-time span {
    color: #9ca3af;
}

/* Responsive */
@media (max-width: 1024px) {
    .dashboard-header {
        padding: 1.25rem !important;
    }

    .welcome-header h1 {
        font-size: 1.25rem !important;
    }

    .welcome-header p {
        font-size: 0.9rem !important;
    }
}
</style>
