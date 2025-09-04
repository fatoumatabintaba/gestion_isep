<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport d'absences - {{ $uea->nom }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Rapport d'Absences</h2>
        <h3>UEA : {{ $uea->nom }}</h3>
        <p><strong>Date du rapport :</strong> {{ now()->format('d/m/Y') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Apprenant</th>
                <th>Matricule</th>
                <th>Date</th>
                <th>Motif</th>
                <th>Statut justificatif</th>
            </tr>
        </thead>
        <tbody>
            @foreach($absences as $absence)
            <tr>
                <td>{{ $absence['apprenant'] }}</td>
                <td>{{ $absence['matricule'] }}</td>
                <td>{{ \Carbon\Carbon::parse($absence['date'])->format('d/m/Y') }}</td>
                <td>{{ $absence['motif'] ?? 'Non soumis' }}</td>
                <td>{{ ucfirst($absence['justificatif']) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><strong>ISÉP - Système de gestion des présences</strong></p>
        <p>Ce rapport a été généré automatiquement via l'API.</p>
    </div>
</body>
</html>
