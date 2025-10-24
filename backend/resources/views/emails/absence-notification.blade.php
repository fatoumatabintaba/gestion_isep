<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Notification d'Absence</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .details {
            background: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Notification d'Absence</h1>
            <p>Département EIT - École d'Ingénierie et de Technologie</p>
        </div>

        <div class="content">
            <div class="alert">
                <h3>⚠️ Absence Signalée</h3>
                <p>Cher(e) <strong>{{ $absent['nom'] }}</strong>,</p>
                <p>Votre absence a été signalée pour la séance suivante :</p>
            </div>

            <div class="details">
                <h3>📋 Détails de la Séance</h3>
                <p><strong>Séance :</strong> {{ $seance->nom }}</p>
                <p><strong>UEA :</strong> {{ $seance->uea_nom }}</p>
                <p><strong>Date :</strong> {{ \Carbon\Carbon::parse($seance->date)->format('d/m/Y') }}</p>
                <p><strong>Heure :</strong> {{ $seance->heure_debut }} - {{ $seance->heure_fin }}</p>
                <p><strong>Salle :</strong> {{ $seance->salle }}</p>
                <p><strong>Enseignant :</strong> {{ $absent['enseignant'] }}</p>
            </div>

            <div style="margin: 25px 0;">
                <h3>📝 Important</h3>
                <p>Si vous pensez qu'il s'agit d'une erreur ou si vous avez un justificatif :</p>
                <ul>
                    <li>Contactez rapidement votre enseignant</li>
                    <li>Déposez un justificatif sur la plateforme</li>
                    <li>Consultez le règlement intérieur pour les procédures</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ url('/login') }}" class="btn">Accéder à la Plateforme</a>
            </div>
        </div>

        <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système de gestion des présences EIT.</p>
            <p>© {{ date('Y') }} Département EIT. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
