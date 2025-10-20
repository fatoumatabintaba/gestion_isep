module.exports = {
    content: [
        './resources/**/*.blade.php',
        './vendor/filament/**/*.blade.php',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#a67c52', // Marron clair
                beige: '#f5f5dc',   // Beige
                sidebar: '#8d6748', // Marron foncé
            },
        },
    },
    plugins: [],
}
