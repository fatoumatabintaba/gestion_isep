<?php

namespace App\Providers;

use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Navigation\NavigationItem;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use App\Filament\Widgets\StatsOverview;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use App\Http\Middleware\OnlyBintaAccess;
use App\Filament\Widgets\DashboardHeader; // ← Ajoutez cette ligne


class BintaPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('binta')
            ->path('binta')
            ->login()
            ->registration()
            ->passwordReset()
            ->emailVerification()
            ->profile()
            ->colors([
                'primary' => Color::hex('#7C3AED'), // Violet moderne
                'secondary' => Color::hex('#F59E0B'), // Amber
                'success' => Color::hex('#10B981'), // Emerald
                'danger' => Color::hex('#EF4444'), // Red
                'warning' => Color::hex('#F59E0B'), // Amber
                'info' => Color::hex('#3B82F6'), // Blue
                'gray' => Color::Slate,
            ])
            ->font('Inter')
            ->brandName('ISEP Administration')
            ->brandLogo(asset('images/logo-isep.png'))
            ->brandLogoHeight('2.5rem')
            ->favicon(asset('images/favicon-isep.ico'))
            ->navigationGroups([
                '📊 Tableau de Bord',
                '👨‍🎓 Gestion des Apprenants',
                '👨‍🏫 Gestion des Enseignants',
                '📚 Gestion Académique',
                '⚙️ Administration Système',
            ])
            ->sidebarCollapsibleOnDesktop()
            ->sidebarFullyCollapsibleOnDesktop()
            ->globalSearchKeyBindings(['command+k', 'ctrl+k'])
            // ->viteTheme('resources/css/filament/binta/theme.css') // ⚠️ COMMENTÉ - Cause l'erreur Vite
            ->topNavigation(false)
            ->databaseNotifications()
            ->databaseNotificationsPolling('30s')
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->widgets([
                Widgets\AccountWidget::class,
                StatsOverview::class,
                \App\Filament\Widgets\DashboardHeader::class,

            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
                OnlyBintaAccess::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->plugins([
                // \BezhanSalleh\FilamentShield\FilamentShieldPlugin::make(),
            ]);
    }
}
