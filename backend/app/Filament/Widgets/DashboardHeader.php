<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardHeader extends Widget
{
    protected static string $view = 'filament.widgets.dashboard-header';

    protected static ?int $sort = -100; // Pour s'assurer qu'il soit en premier

    protected int | string | array $columnSpan = 'full';

    protected function getViewData(): array
    {
        return [
            'currentDate' => $this->getCurrentDate(),
            'currentTime' => $this->getCurrentTime(),
        ];
    }

    protected function getCurrentDate(): string
    {
        // Pour avoir la date en français
        setlocale(LC_TIME, 'fr_FR.UTF-8');
        return strftime('%A %d %B %Y');
    }

    protected function getCurrentTime(): string
    {
        return date('H:i');
    }
}
