class VenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vente
        fields = ['id', 'production', 'date_vente', 'client', 'quantite', 'prix_unitaire', 'montant_total']
        read_only_fields = ['montant_total']

class MouvementCaisseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MouvementCaisse
        fields = ['id', 'date', 'type_mouvement', 'montant', 'description'] 